<?php

namespace App\Modules\Platform\Presentation\Http\Controllers;

use App\Modules\Platform\Infrastructure\Models\Country;
use App\Modules\Platform\Infrastructure\Models\District;
use App\Modules\Platform\Infrastructure\Models\Municipality;
use App\Modules\Platform\Infrastructure\Models\Province;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Http;

class GeoController extends Controller
{
    public function countries(): JsonResponse
    {
        $countries = Country::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'uuid', 'name', 'code', 'phone_code']);

        return Response::success($countries, 'Countries retrieved.');
    }
    public function provinces(): JsonResponse
    {
        $provinces = Province::query()
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'uuid', 'name', 'code']);

        return Response::success($provinces, 'Provinces retrieved.');
    }

    public function districts(Request $request): JsonResponse
    {
        $provinceId = $request->input('province_id');

        $districts = District::query()
            ->where('is_active', true)
            ->when($provinceId, fn ($query) => $query->where('province_id', $provinceId))
            ->orderBy('name')
            ->get(['id', 'uuid', 'province_id', 'name', 'code']);

        return Response::success($districts, 'Districts retrieved.');
    }

    public function municipalities(Request $request): JsonResponse
    {
        $districtId = $request->input('district_id');

        $municipalities = Municipality::query()
            ->where('is_active', true)
            ->when($districtId, fn ($query) => $query->where('district_id', $districtId))
            ->orderBy('name')
            ->get(['id', 'uuid', 'district_id', 'name', 'type', 'ward_count']);

        return Response::success($municipalities, 'Municipalities retrieved.');
    }

    public function reverseGeocode(Request $request): JsonResponse
    {
        $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        $lat = $request->input('lat');
        $lng = $request->input('lng');

        try {
            $response = Http::timeout(5)->get('https://nominatim.openstreetmap.org/reverse', [
                'format' => 'json',
                'lat' => $lat,
                'lon' => $lng,
                'addressdetails' => 1,
                'accept-language' => 'en',
            ]);

            if (! $response->successful()) {
                return Response::error('Geocoding service unavailable.', [], 502);
            }

            $data = $response->json();
            $address = $data['address'] ?? [];

        $province = $this->matchProvince($address);
        $district = $this->matchDistrict($address, $province);
        $municipality = $this->matchMunicipality($address, $district);

        if (! $province && isset($address['ISO3166-2-lvl4'])) {
            $isoCode = strtoupper(str_replace('NP-', 'P', $address['ISO3166-2-lvl4']));
            $province = Province::query()->where('is_active', true)->where('code', $isoCode)->first();
        }

            $addressLine = $this->buildAddressLine($address);

            return Response::success([
                'province' => $province ? ['uuid' => $province->uuid, 'name' => $province->name] : null,
                'district' => $district ? ['uuid' => $district->uuid, 'name' => $district->name] : null,
                'municipality' => $municipality ? ['uuid' => $municipality->uuid, 'name' => $municipality->name] : null,
                'address_line' => $addressLine,
            ], 'Location resolved.');
        } catch (\Exception $e) {
            return Response::error('Failed to resolve location.', [], 500);
        }
    }

    private function matchProvince(array $address): ?Province
    {
        $state = $address['state'] ?? '';

        if (! $state) {
            return null;
        }

        $province = Province::query()
            ->where('is_active', true)
            ->whereRaw('LOWER(name) = LOWER(?)', [$state])
            ->first();

        if ($province) {
            return $province;
        }

        $normalized = $this->normalizeName($state);

        $province = Province::query()
            ->where('is_active', true)
            ->whereRaw('LOWER(name) LIKE ?', ['%'.$normalized.'%'])
            ->first();

        if ($province) {
            return $province;
        }

        $core = $this->extractCoreName($state);

        if ($core !== $normalized) {
            $province = Province::query()
                ->where('is_active', true)
                ->whereRaw('LOWER(name) LIKE ?', ['%'.$core.'%'])
                ->first();

            if ($province) {
                return $province;
            }
        }

        return null;
    }

    private function matchDistrict(array $address, ?Province $province): ?District
    {
        $districtNames = [
            $address['county'] ?? '',
            $address['district'] ?? '',
            $address['subregion'] ?? '',
        ];

        $districtNames = array_filter($districtNames);

        foreach ($districtNames as $name) {
            $query = District::query()->where('is_active', true);

            if ($province) {
                $query->where('province_id', $province->id);
            }

            $district = $query->whereRaw('LOWER(name) = LOWER(?)', [$name])->first();

            if ($district) {
                return $district;
            }

            $normalized = $this->normalizeName($name);

            $query2 = District::query()->where('is_active', true);

            if ($province) {
                $query2->where('province_id', $province->id);
            }

            $district = $query2->whereRaw('LOWER(name) LIKE ?', ['%'.$normalized.'%'])->first();

            if ($district) {
                return $district;
            }
        }

        return null;
    }

    private function matchMunicipality(array $address, ?District $district): ?Municipality
    {
        $muniNames = [
            $address['city'] ?? '',
            $address['town'] ?? '',
            $address['village'] ?? '',
            $address['municipality'] ?? '',
            $address['suburb'] ?? '',
        ];

        $muniNames = array_filter($muniNames);

        foreach ($muniNames as $name) {
            $query = Municipality::query()->where('is_active', true);

            if ($district) {
                $query->where('district_id', $district->id);
            }

            $municipality = $query->whereRaw('LOWER(name) = LOWER(?)', [$name])->first();

            if ($municipality) {
                return $municipality;
            }

            $normalized = $this->normalizeName($name);

            $query2 = Municipality::query()->where('is_active', true);

            if ($district) {
                $query2->where('district_id', $district->id);
            }

            $municipality = $query2->whereRaw('LOWER(name) LIKE ?', ['%'.$normalized.'%'])->first();

            if ($municipality) {
                return $municipality;
            }

            $core = $this->extractCoreName($name);

            if ($core !== $normalized) {
                $query3 = Municipality::query()->where('is_active', true);

                if ($district) {
                    $query3->where('district_id', $district->id);
                }

                $municipality = $query3->whereRaw('LOWER(name) LIKE ?', ['%'.$core.'%'])->first();

                if ($municipality) {
                    return $municipality;
                }
            }
        }

        return null;
    }

    private function buildAddressLine(array $address): string
    {
        $parts = [
            $address['road'] ?? '',
            $address['neighbourhood'] ?? '',
            $address['suburb'] ?? '',
        ];

        return implode(', ', array_filter($parts));
    }

    private function normalizeName(string $name): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $name)));
    }

    private function extractCoreName(string $name): string
    {
        $suffixes = [
            'metropolitan city',
            'sub-metropolitan city',
            'municipality',
            'village council',
            'rural municipality',
            'province',
        ];

        $lower = strtolower(trim($name));

        foreach ($suffixes as $suffix) {
            if (str_ends_with($lower, ' '.$suffix)) {
                $lower = trim(substr($lower, 0, -strlen($suffix) - 1));
                break;
            }
        }

        return $lower;
    }
}
