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

        $lat = (float) $request->input('lat');
        $lng = (float) $request->input('lng');

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'GOSIKA-Ecommerce/1.0 (contact@gosika.sital.info.np)',
                'Accept' => 'application/json',
            ])->timeout(8)->get('https://nominatim.openstreetmap.org/reverse', [
                'format' => 'json',
                'lat' => $lat,
                'lon' => $lng,
                'addressdetails' => 1,
                'accept-language' => 'en',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $address = $data['address'] ?? [];

                $province = $this->matchProvince($address);
                $district = $this->matchDistrict($address, $province);
                $municipality = $this->matchMunicipality($address, $district, $province);

                // If municipality was found, ensure district & province match it
                if ($municipality && ! $district) {
                    $district = $municipality->district;
                }
                if ($district && ! $province) {
                    $province = $district->province;
                }

                $addressLine = $this->buildAddressLine($address, $data['display_name'] ?? '');

                return Response::success([
                    'province' => $province ? ['uuid' => $province->uuid, 'name' => $province->name] : null,
                    'district' => $district ? ['uuid' => $district->uuid, 'name' => $district->name] : null,
                    'municipality' => $municipality ? ['uuid' => $municipality->uuid, 'name' => $municipality->name] : null,
                    'address_line' => $addressLine,
                    'display_name' => $data['display_name'] ?? '',
                ], 'Location resolved.');
            }
        } catch (\Throwable $e) {
            // Log or fallback
        }

        // Fallback to local coordinate matching
        return $this->fallbackReverseGeocode($lat, $lng);
    }

    private function matchProvince(array $address): ?Province
    {
        if (isset($address['ISO3166-2-lvl4'])) {
            $isoCode = strtoupper(str_replace('NP-', 'P', $address['ISO3166-2-lvl4']));
            $prov = Province::query()->where('is_active', true)->where('code', $isoCode)->first();
            if ($prov) return $prov;
        }

        $candidates = [
            $address['state'] ?? '',
            $address['province'] ?? '',
            $address['region'] ?? '',
        ];

        $provinceMap = [
            '1' => 'Koshi Province',
            'p1' => 'Koshi Province',
            'koshi' => 'Koshi Province',
            'province 1' => 'Koshi Province',
            'province no. 1' => 'Koshi Province',
            '2' => 'Madhesh Province',
            'p2' => 'Madhesh Province',
            'madhesh' => 'Madhesh Province',
            'province 2' => 'Madhesh Province',
            '3' => 'Bagmati Province',
            'p3' => 'Bagmati Province',
            'bagmati' => 'Bagmati Province',
            'province 3' => 'Bagmati Province',
            '4' => 'Gandaki Province',
            'p4' => 'Gandaki Province',
            'gandaki' => 'Gandaki Province',
            'province 4' => 'Gandaki Province',
            '5' => 'Lumbini Province',
            'p5' => 'Lumbini Province',
            'lumbini' => 'Lumbini Province',
            'province 5' => 'Lumbini Province',
            '6' => 'Karnali Province',
            'p6' => 'Karnali Province',
            'karnali' => 'Karnali Province',
            'province 6' => 'Karnali Province',
            '7' => 'Sudurpashchim Province',
            'p7' => 'Sudurpashchim Province',
            'sudurpashchim' => 'Sudurpashchim Province',
            'sudurpaschim' => 'Sudurpashchim Province',
            'province 7' => 'Sudurpashchim Province',
        ];

        foreach (array_filter($candidates) as $raw) {
            $norm = $this->normalizeName($raw);
            if (isset($provinceMap[$norm])) {
                $p = Province::query()->where('is_active', true)->where('name', $provinceMap[$norm])->first();
                if ($p) return $p;
            }

            $p = Province::query()->where('is_active', true)
                ->where(function ($q) use ($norm) {
                    $q->whereRaw('LOWER(name) = ?', [$norm])
                      ->orWhereRaw('LOWER(name) LIKE ?', ['%' . $norm . '%']);
                })->first();
            if ($p) return $p;
        }

        return null;
    }

    private function matchDistrict(array $address, ?Province $province): ?District
    {
        $districtNames = [
            $address['county'] ?? '',
            $address['district'] ?? '',
            $address['state_district'] ?? '',
            $address['subregion'] ?? '',
        ];

        $districtAliasMap = [
            'tanahu' => 'Tanahun',
            'nawalparasi east' => 'Nawalpur',
            'nawalparasi west' => 'Parasi',
            'rukum east' => 'Eastern Rukum',
            'rukum west' => 'Western Rukum',
            'kapilbastu' => 'Kapilvastu',
            'dhanusa' => 'Dhanusa',
            'dhanusha' => 'Dhanusa',
            'makawanpur' => 'Makwanpur',
            'sindhupalchowk' => 'Sindhupalchok',
            'kavre' => 'Kavrepalanchok',
            'kabhrepalanchok' => 'Kavrepalanchok',
        ];

        foreach (array_filter($districtNames) as $raw) {
            $norm = $this->normalizeName($raw);
            $clean = $this->extractCoreName($norm);
            $target = $districtAliasMap[$clean] ?? $districtAliasMap[$norm] ?? null;

            $query = District::query()->where('is_active', true);
            if ($province) {
                $query->where('province_id', $province->id);
            }

            if ($target) {
                $d = (clone $query)->whereRaw('LOWER(name) = LOWER(?)', [$target])->first();
                if ($d) return $d;
            }

            $d = (clone $query)->where(function ($q) use ($norm, $clean) {
                $q->whereRaw('LOWER(name) = ?', [$norm])
                  ->orWhereRaw('LOWER(name) = ?', [$clean])
                  ->orWhereRaw('LOWER(name) LIKE ?', ['%' . $clean . '%']);
            })->first();

            if ($d) return $d;
        }

        return null;
    }

    private function matchMunicipality(array $address, ?District $district, ?Province $province = null): ?Municipality
    {
        $muniNames = [
            $address['municipality'] ?? '',
            $address['city'] ?? '',
            $address['town'] ?? '',
            $address['village'] ?? '',
            $address['suburb'] ?? '',
            $address['hamlet'] ?? '',
            $address['city_district'] ?? '',
        ];

        foreach (array_filter($muniNames) as $raw) {
            $norm = $this->normalizeName($raw);
            $core = $this->extractCoreName($norm);

            $query = Municipality::query()->where('is_active', true);
            if ($district) {
                $query->where('district_id', $district->id);
            } elseif ($province) {
                $query->whereHas('district', fn ($q) => $q->where('province_id', $province->id));
            }

            // 1. Exact match
            $m = (clone $query)->whereRaw('LOWER(name) = ?', [$norm])->first();
            if ($m) return $m;

            // 2. Core match (e.g. 'Budhiganga' -> 'Budhiganga Rural Municipality')
            $m = (clone $query)->where(function ($q) use ($core) {
                $q->whereRaw('LOWER(name) = ?', [$core])
                  ->orWhereRaw('LOWER(name) LIKE ?', [$core . ' %'])
                  ->orWhereRaw('LOWER(name) LIKE ?', ['% ' . $core . ' %'])
                  ->orWhereRaw('LOWER(name) LIKE ?', ['%' . $core . '%']);
            })->first();

            if ($m) return $m;
        }

        return null;
    }

    private function buildAddressLine(array $address, string $displayName = ''): string
    {
        $parts = [
            $address['city_district'] ?? '',
            $address['road'] ?? '',
            $address['neighbourhood'] ?? '',
            $address['suburb'] ?? '',
            $address['hamlet'] ?? '',
            $address['village'] ?? '',
        ];

        $filtered = array_values(array_unique(array_filter(array_map('trim', $parts))));
        if (! empty($filtered)) {
            return implode(', ', $filtered);
        }

        if ($displayName) {
            $segments = explode(',', $displayName);
            return trim($segments[0] ?? '');
        }

        return '';
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
            'sub metropolitan city',
            'rural municipality',
            'municipality',
            'gaunpalika',
            'nagarpalika',
            'mahanagarpalika',
            'upa-mahanagarpalika',
            'village council',
            'province',
            'district',
            'ward',
        ];

        $lower = strtolower(trim($name));
        // Remove trailing numbers or ward identifiers e.g. "Budhiganga-04" -> "Budhiganga"
        $lower = preg_replace('/[-\s]*\d+$/', '', $lower);

        foreach ($suffixes as $suffix) {
            if (str_ends_with($lower, ' ' . $suffix)) {
                $lower = trim(substr($lower, 0, -strlen($suffix) - 1));
                break;
            }
        }

        return trim($lower);
    }

    private function fallbackReverseGeocode(float $lat, float $lng): JsonResponse
    {
        // Major Nepal Hub Coordinates
        $hubs = [
            ['name' => 'Kathmandu', 'dist' => 'Kathmandu', 'prov' => 'Bagmati Province', 'muni' => 'Kathmandu Metropolitan City', 'lat' => 27.7172, 'lng' => 85.3240],
            ['name' => 'Lalitpur', 'dist' => 'Lalitpur', 'prov' => 'Bagmati Province', 'muni' => 'Lalitpur Metropolitan City', 'lat' => 27.6588, 'lng' => 85.3247],
            ['name' => 'Bhaktapur', 'dist' => 'Bhaktapur', 'prov' => 'Bagmati Province', 'muni' => 'Bhaktapur Municipality', 'lat' => 27.6710, 'lng' => 85.4298],
            ['name' => 'Pokhara', 'dist' => 'Kaski', 'prov' => 'Gandaki Province', 'muni' => 'Pokhara Metropolitan City', 'lat' => 28.2096, 'lng' => 83.9856],
            ['name' => 'Biratnagar', 'dist' => 'Morang', 'prov' => 'Koshi Province', 'muni' => 'Biratnagar Metropolitan City', 'lat' => 26.4525, 'lng' => 87.2718],
            ['name' => 'Duhabi', 'dist' => 'Sunsari', 'prov' => 'Koshi Province', 'muni' => 'Duhabi Municipality', 'lat' => 26.5667, 'lng' => 87.2833],
            ['name' => 'Dharan', 'dist' => 'Sunsari', 'prov' => 'Koshi Province', 'muni' => 'Dharan Sub-Metropolitan City', 'lat' => 26.8124, 'lng' => 87.2834],
            ['name' => 'Itahari', 'dist' => 'Sunsari', 'prov' => 'Koshi Province', 'muni' => 'Itahari Sub-Metropolitan City', 'lat' => 26.6626, 'lng' => 87.2820],
            ['name' => 'Bharatpur', 'dist' => 'Chitwan', 'prov' => 'Bagmati Province', 'muni' => 'Bharatpur Metropolitan City', 'lat' => 27.6833, 'lng' => 84.4333],
            ['name' => 'Butwal', 'dist' => 'Rupandehi', 'prov' => 'Lumbini Province', 'muni' => 'Butwal Sub-Metropolitan City', 'lat' => 27.7006, 'lng' => 83.4484],
            ['name' => 'Nepalgunj', 'dist' => 'Banke', 'prov' => 'Lumbini Province', 'muni' => 'Nepalgunj Sub-Metropolitan City', 'lat' => 28.0500, 'lng' => 81.6167],
            ['name' => 'Dhangadhi', 'dist' => 'Kailali', 'prov' => 'Sudurpashchim Province', 'muni' => 'Dhangadhi Sub-Metropolitan City', 'lat' => 28.6833, 'lng' => 80.6000],
            ['name' => 'Birgunj', 'dist' => 'Parsa', 'prov' => 'Madhesh Province', 'muni' => 'Birgunj Metropolitan City', 'lat' => 27.0133, 'lng' => 84.8778],
            ['name' => 'Janakpur', 'dist' => 'Dhanusa', 'prov' => 'Madhesh Province', 'muni' => 'Janakpurdham Sub-Metropolitan City', 'lat' => 26.7288, 'lng' => 85.9244],
            ['name' => 'Hetauda', 'dist' => 'Makwanpur', 'prov' => 'Bagmati Province', 'muni' => 'Hetauda Sub-Metropolitan City', 'lat' => 27.4286, 'lng' => 85.0322],
        ];

        $closest = null;
        $minDist = PHP_FLOAT_MAX;
        foreach ($hubs as $hub) {
            $d = sqrt(pow($lat - $hub['lat'], 2) + pow($lng - $hub['lng'], 2));
            if ($d < $minDist) {
                $minDist = $d;
                $closest = $hub;
            }
        }

        if ($closest) {
            $prov = Province::query()->where('is_active', true)->where('name', $closest['prov'])->first();
            $dist = District::query()->where('is_active', true)->where('name', $closest['dist'])->first();
            $muni = Municipality::query()->where('is_active', true)->where('name', 'like', '%' . $closest['name'] . '%')->first();

            return Response::success([
                'province' => $prov ? ['uuid' => $prov->uuid, 'name' => $prov->name] : null,
                'district' => $dist ? ['uuid' => $dist->uuid, 'name' => $dist->name] : null,
                'municipality' => $muni ? ['uuid' => $muni->uuid, 'name' => $muni->name] : null,
                'address_line' => $closest['name'],
                'display_name' => "{$closest['name']}, {$closest['dist']}, {$closest['prov']}, Nepal",
            ], 'Location approximated.');
        }

        return Response::error('Unable to determine location from coordinates.', [], 404);
    }
}
