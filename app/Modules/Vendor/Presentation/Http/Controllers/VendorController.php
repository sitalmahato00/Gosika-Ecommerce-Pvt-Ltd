<?php

namespace App\Modules\Vendor\Presentation\Http\Controllers;

use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Application\DataTransferObjects\ApplyVendorDTO;
use App\Modules\Vendor\Application\DataTransferObjects\KycDTO;
use App\Modules\Vendor\Application\Services\VendorOnboardingService;
use App\Modules\Vendor\Presentation\Http\Requests\ApplyVendorRequest;
use App\Modules\Vendor\Presentation\Http\Requests\KycRequest;
use App\Modules\Vendor\Presentation\Resources\VendorResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class VendorController extends Controller
{
    public function __construct(protected VendorOnboardingService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('ensure:vendor')->except(['apply']);
    }

    public function apply(ApplyVendorRequest $request): JsonResponse
    {
        $vendor = $this->service->apply(
            $request->user(),
            ApplyVendorDTO::fromArray($request->validated())
        );

        app(\App\Modules\Marketing\Application\Services\NotificationDispatcher::class)->vendorApplied($vendor);

        return Response::success(new VendorResource($vendor), 'Vendor application submitted.', [], 201);
    }

    public function myVendor(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor()->with(['kyc', 'stores', 'bankAccounts'])->first();

        if (! $vendor) {
            throw new DomainException('No vendor application found for this account.', 404);
        }

        return Response::success(new VendorResource($vendor), 'Vendor profile retrieved.');
    }

    public function update(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must apply for a vendor account first.', 403);
        }

        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:200'],
            'business_email' => ['required', 'email', 'unique:vendors,business_email,'.$vendor->id],
            'business_phone' => ['nullable', 'string', 'max:40'],
            'pan_vat' => ['nullable', 'string', 'max:60'],
            'registration_number' => ['nullable', 'string', 'max:60'],
            'logo' => ['nullable', 'string', 'max:600'],
        ]);

        $vendor->update($data);

        return Response::success(new VendorResource($vendor->fresh()), 'Vendor profile updated.');
    }

    public function submitKyc(KycRequest $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $kyc = $this->service->submitKyc($vendor, KycDTO::fromArray($request->validated()));

        return Response::success($kyc, 'KYC submitted for review.');
    }

    public function uploadDocument(Request $request): JsonResponse
    {
        $request->validate([
            'document_type' => ['required', 'string', 'in:citizenship_front,citizenship_back,business_registration,pan_vat,tax_clearance,profile'],
            'file' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
        ]);

        $vendor = $this->vendorFor($request);
        $document = $this->service->addDocument(
            $vendor,
            $request->input('document_type'),
            $request->file('file')
        );

        return Response::success($document, 'Document uploaded.', [], 201);
    }

    protected function vendorFor(Request $request)
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must apply for a vendor account first.', 422);
        }

        return $vendor;
    }
}
