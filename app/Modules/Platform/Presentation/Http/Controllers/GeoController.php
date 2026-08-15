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
}
