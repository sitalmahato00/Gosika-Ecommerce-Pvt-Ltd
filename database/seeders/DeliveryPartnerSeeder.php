<?php

namespace Database\Seeders;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\DeliveryPartnerStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DeliveryPartnerSeeder extends Seeder
{
    public function run(): void
    {
        $partnerUser = User::query()->firstOrCreate(
            ['email' => 'delivery@gosika.com.np'],
            [
                'uuid' => (string) Str::uuid(),
                'first_name' => 'Bikash',
                'last_name' => 'Rider',
                'phone' => '9800000004',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'status' => UserStatus::ACTIVE,
            ]
        );
        $partnerUser->assignRole(Roles::DELIVERY_PARTNER);

        DeliveryPartner::query()->firstOrCreate(
            ['user_id' => $partnerUser->id],
            [
                'name' => 'Bikash Rider',
                'phone' => '9800000004',
                'email' => 'delivery@gosika.com.np',
                'vehicle_type' => 'motorcycle',
                'vehicle_number' => 'BA 1 PA 4321',
                'service_areas' => ['Kathmandu', 'Lalitpur', 'Bhaktapur'],
                'status' => DeliveryPartnerStatus::APPROVED,
                'is_online' => true,
                'rating_avg' => 4.8,
                'rating_count' => 64,
                'approved_at' => now(),
            ]
        );
    }
}
