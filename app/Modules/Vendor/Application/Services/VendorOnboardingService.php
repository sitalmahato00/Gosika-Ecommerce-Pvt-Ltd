<?php

namespace App\Modules\Vendor\Application\Services;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\KycStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Vendor\Application\DataTransferObjects\ApplyVendorDTO;
use App\Modules\Vendor\Application\DataTransferObjects\BankAccountDTO;
use App\Modules\Vendor\Application\DataTransferObjects\KycDTO;
use App\Modules\Vendor\Application\DataTransferObjects\StoreDTO;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Infrastructure\Models\VendorDocument;
use App\Modules\Vendor\Infrastructure\Models\VendorKyc;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class VendorOnboardingService
{
    public function apply(User $user, ApplyVendorDTO $dto): Vendor
    {
        if ($user->vendor()->exists()) {
            throw new DomainException('A vendor application already exists for this account.');
        }

        return DB::transaction(function () use ($user, $dto) {
            if (! $user->hasRole(Roles::VENDOR_ADMIN)) {
                $user->assignRole(Roles::VENDOR_ADMIN);
            }

            return Vendor::query()->create([
                'user_id' => $user->id,
                'company_name' => $dto->company_name,
                'business_email' => $dto->business_email,
                'business_phone' => $dto->business_phone,
                'pan_vat' => $dto->pan_vat,
                'registration_number' => $dto->registration_number,
                'status' => VendorStatus::PENDING,
            ]);
        });
    }

    public function submitKyc(Vendor $vendor, KycDTO $dto): VendorKyc
    {
        $this->assertVendorCanEdit($vendor);

        return DB::transaction(function () use ($vendor, $dto) {
            $kyc = VendorKyc::query()->updateOrCreate(
                ['vendor_id' => $vendor->id],
                [
                    'owner_full_name' => $dto->owner_full_name,
                    'owner_citizenship_number' => $dto->owner_citizenship_number,
                    'owner_email' => $dto->owner_email,
                    'owner_phone' => $dto->owner_phone,
                    'business_type' => $dto->business_type,
                    'address' => $dto->address,
                    'status' => KycStatus::SUBMITTED,
                ]
            );

            $vendor->update(['status' => VendorStatus::UNDER_REVIEW]);

            return $kyc;
        });
    }

    public function addDocument(Vendor $vendor, string $documentType, UploadedFile $file): VendorDocument
    {
        $this->assertVendorCanEdit($vendor);

        $path = $file->store('vendor-documents/'.$vendor->uuid, 'public');

        return VendorDocument::query()->create([
            'vendor_id' => $vendor->id,
            'document_type' => $documentType,
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'status' => 'pending',
        ]);
    }

    public function createStore(Vendor $vendor, StoreDTO $dto): Store
    {
        $this->assertVendorCanEdit($vendor);

        return Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => $dto->name,
            'slug' => $this->uniqueSlug($dto->slug ?: $dto->name),
            'description' => $dto->description,
            'contact_email' => $dto->contact_email,
            'contact_phone' => $dto->contact_phone,
            'status' => StoreStatus::DRAFT,
        ]);
    }

    public function updateStore(Vendor $vendor, Store $store, StoreDTO $dto): Store
    {
        $this->assertVendorOwnsStore($vendor, $store);

        $store->update([
            'name' => $dto->name,
            'description' => $dto->description,
            'contact_email' => $dto->contact_email,
            'contact_phone' => $dto->contact_phone,
        ]);

        return $store;
    }

    public function submitStoreForApproval(Vendor $vendor, Store $store): Store
    {
        $this->assertVendorOwnsStore($vendor, $store);

        $store->update(['status' => StoreStatus::PENDING_APPROVAL]);

        return $store;
    }

    public function addBankAccount(Vendor $vendor, BankAccountDTO $dto): BankAccount
    {
        $this->assertVendorCanEdit($vendor);

        $isFirst = ! $vendor->bankAccounts()->exists();

        return BankAccount::query()->create([
            'vendor_id' => $vendor->id,
            'bank_name' => $dto->bank_name,
            'branch_name' => $dto->branch_name,
            'account_name' => $dto->account_name,
            'account_number' => $dto->account_number,
            'account_type' => $dto->account_type,
            'is_default' => $isFirst,
        ]);
    }

    public function approveVendor(User $admin, Vendor $vendor): Vendor
    {
        $vendor->update([
            'status' => VendorStatus::APPROVED,
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        if ($vendor->user && ! $vendor->user->hasRole(Roles::VENDOR_ADMIN)) {
            $vendor->user->assignRole(Roles::VENDOR_ADMIN);
        }

        return $vendor;
    }

    public function rejectVendor(User $admin, Vendor $vendor, string $reason): Vendor
    {
        $vendor->update([
            'status' => VendorStatus::REJECTED,
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);

        if ($vendor->user && $vendor->user->hasRole(Roles::VENDOR_ADMIN)) {
            $vendor->user->removeRole(Roles::VENDOR_ADMIN);
        }

        return $vendor;
    }

    public function approveStore(User $admin, Store $store): Store
    {
        $store->update([
            'status' => StoreStatus::ACTIVE,
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        return $store;
    }

    public function rejectStore(User $admin, Store $store, string $reason): Store
    {
        $store->update([
            'status' => StoreStatus::SUSPENDED,
            'rejection_reason' => $reason,
        ]);

        return $store;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 2;

        while (Store::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    private function assertVendorCanEdit(Vendor $vendor): void
    {
        if ($vendor->status === VendorStatus::APPROVED) {
            return;
        }
        if (! in_array($vendor->status, [VendorStatus::PENDING, VendorStatus::UNDER_REVIEW, VendorStatus::REJECTED], true)) {
            throw new DomainException('Vendor is not editable in its current state.');
        }
    }

    private function assertVendorOwnsStore(Vendor $vendor, Store $store): void
    {
        if ($store->vendor_id !== $vendor->id) {
            throw new DomainException('You do not own this store.', 403);
        }
    }
}
