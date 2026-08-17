<?php

namespace App\Modules\Customer\Application\Services;

use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Customer\Infrastructure\Models\CustomerProfile;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Platform\Infrastructure\Models\Country;
use App\Modules\Platform\Infrastructure\Models\District;
use App\Modules\Platform\Infrastructure\Models\Municipality;
use App\Modules\Platform\Infrastructure\Models\Province;
use Illuminate\Database\Eloquent\Collection;

class CustomerService
{
    public function getOrCreateProfile(User $user): CustomerProfile
    {
        return CustomerProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['user_id' => $user->id]
        );
    }

    public function updateProfile(User $user, array $data): CustomerProfile
    {
        $profile = $this->getOrCreateProfile($user);

        $userFields = ['first_name', 'last_name', 'phone', 'avatar'];
        $userData = array_intersect_key($data, array_flip($userFields));
        if (!empty($userData)) {
            $user->fill(array_filter($userData, fn ($v) => $v !== null));
            $user->save();
        }

        $profileData = array_diff_key($data, array_flip($userFields));
        $profile->fill(array_filter($profileData, fn ($value) => $value !== null));
        $profile->save();

        return $profile;
    }

    public function listAddresses(User $user): Collection
    {
        return CustomerAddress::with(['country', 'province', 'district', 'municipality'])
            ->forUser($user->id)
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get();
    }

    public function findAddress(User $user, string $uuid): ?CustomerAddress
    {
        return CustomerAddress::forUser($user->id)->where('uuid', $uuid)->first();
    }

    public function createAddress(User $user, array $data): CustomerAddress
    {
        $data = $this->resolveLocationIds($data);

        $address = new CustomerAddress($data);
        $address->user_id = $user->id;
        $address->save();

        if ($data['is_default'] ?? false) {
            $this->setDefaultAddress($user, $address);
        }

        return $address->fresh(['country', 'province', 'district', 'municipality']);
    }

    public function updateAddress(User $user, CustomerAddress $address, array $data): CustomerAddress
    {
        $data = $this->resolveLocationIds($data);

        $address->fill(array_filter($data, fn ($value) => $value !== null));
        $address->save();

        if ($data['is_default'] ?? false) {
            $this->setDefaultAddress($user, $address);
        }

        return $address->fresh(['country', 'province', 'district', 'municipality']);
    }

    public function deleteAddress(User $user, CustomerAddress $address): void
    {
        if ($address->user_id !== $user->id) {
            abort(404, 'Address not found.');
        }

        $profile = $this->getOrCreateProfile($user);
        $isShippingDefault = $profile->default_shipping_address_id === $address->uuid;
        $isBillingDefault = $profile->default_billing_address_id === $address->uuid;

        $address->delete();

        if ($isShippingDefault) {
            $profile->default_shipping_address_id = null;
        }
        if ($isBillingDefault) {
            $profile->default_billing_address_id = null;
        }
        $profile->save();
    }

    public function setDefaultAddress(User $user, CustomerAddress $address): CustomerProfile
    {
        if ($address->user_id !== $user->id) {
            abort(404, 'Address not found.');
        }

        $type = $address->address_type;

        CustomerAddress::forUser($user->id)
            ->where('address_type', $type)
            ->where('id', '!=', $address->id)
            ->update(['is_default' => false]);

        $address->update(['is_default' => true]);

        $profile = $this->getOrCreateProfile($user);
        if ($type === 'shipping') {
            $profile->default_shipping_address_id = $address->uuid;
        } else {
            $profile->default_billing_address_id = $address->uuid;
        }
        $profile->save();

        return $profile;
    }

    public function defaultAddressFor(User $user, string $type): ?CustomerAddress
    {
        $profile = $this->getOrCreateProfile($user);
        $column = $type === 'billing' ? 'default_billing_address_id' : 'default_shipping_address_id';

        return $profile->{$column}
            ? CustomerAddress::forUser($user->id)->where('uuid', $profile->{$column})->first()
            : CustomerAddress::forUser($user->id)->where('address_type', $type)->where('is_default', true)->first();
    }

    protected function resolveLocationIds(array $data): array
    {
        $map = [
            'country_id' => Country::class,
            'province_id' => Province::class,
            'district_id' => District::class,
            'municipality_id' => Municipality::class,
        ];

        foreach ($map as $field => $model) {
            if (isset($data[$field]) && $data[$field] !== null) {
                $data[$field] = $model::where('uuid', $data[$field])->value('id');
            }
        }

        return $data;
    }
}
