<?php

namespace Database\Seeders;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\DeliveryPartnerStatus;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Shipping\Infrastructure\Models\DeliveryTracking;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartnerDocument;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DeliveryAssignmentSeeder extends Seeder
{
    private const PICKUP_ADDRESS = 'Himalayan Handicrafts, Thamel, Kathmandu 44600, Nepal';
    private const PICKUP_LAT = 27.7150;
    private const PICKUP_LNG = 85.3125;

    private const DROPOFFS = [
        'Kathmandu' => [
            'Boudhanath, Kathmandu 44600, Nepal',
            'Baneshwor, Kathmandu 44600, Nepal',
            'New Baneshwor, Kathmandu 44600, Nepal',
            'Putalisadak, Kathmandu 44600, Nepal',
            'Kamalpokhari, Kathmandu 44600, Nepal',
        ],
        'Lalitpur' => [
            'Patan Dhoka, Lalitpur 44700, Nepal',
            'Jawalakhel, Lalitpur 44700, Nepal',
            'Mahalaxmi, Lalitpur 44700, Nepal',
        ],
        'Pokhara' => [
            'Lakeside, Pokhara 33700, Nepal',
            'Mahendrapul, Pokhara 33700, Nepal',
        ],
        'Biratnagar' => [
            'Birat Chowk, Biratnagar 56613, Nepal',
            'Rani, Biratnagar 56613, Nepal',
        ],
        'Itahari' => [
            'Itahari Chowk, Itahari 56705, Nepal',
        ],
        'Boudha' => [
            'Boudha Stupa, Boudha, Kathmandu 44600, Nepal',
        ],
    ];

    private const COORDS = [
        'Kathmandu'   => [['27.7120', '85.3140'], ['27.6980', '85.3560'], ['27.6940', '85.3260']],
        'Lalitpur'    => [['27.6710', '85.3250'], ['27.6650', '85.3270']],
        'Pokhara'     => [['28.2096', '83.9856'], ['28.2080', '83.9830']],
        'Biratnagar'  => [['26.4525', '87.2640']],
        'Itahari'     => [['26.6660', '87.2800']],
        'Boudha'      => [['27.7215', '85.3620']],
    ];

    public function run(): void
    {
        $this->ensureExtraPartners();
        $this->seedDocuments();

        $partnerIds = DeliveryPartner::pluck('id')->toArray();
        if (empty($partnerIds)) {
            $this->command?->warn('No delivery partners found — skipping assignment seeding.');
            return;
        }

        $orders = VendorOrder::query()
            ->with('order')
            ->orderBy('created_at')
            ->get();

        if ($orders->isEmpty()) {
            $this->command?->warn('No vendor orders found — skipping assignment seeding.');
            return;
        }

        $pickupCoords = self::PICKUP_LAT . ', ' . self::PICKUP_LNG;
        $partnerIndex = 0;
        $created = 0;
        $trackingCount = 0;

        foreach ($orders as $vendorOrder) {
            $status = $vendorOrder->delivery_status;
            if ($status === DeliveryStatus::PENDING) {
                $this->createPendingAssignment($vendorOrder, $partnerIds[$partnerIndex]);
                $partnerIndex = ($partnerIndex + 1) % count($partnerIds);
                $created++;
                continue;
            }
            if ($status === DeliveryStatus::DELIVERED) {
                $this->createDeliveredAssignment($vendorOrder, $partnerIds[$partnerIndex]);
                $partnerIndex = ($partnerIndex + 1) % count($partnerIds);
                $created++;
                continue;
            }
            if ($status === DeliveryStatus::OUT_FOR_DELIVERY) {
                $created += $this->createActiveAssignment($vendorOrder, $partnerIds[$partnerIndex], DeliveryStatus::OUT_FOR_DELIVERY);
                $partnerIndex = ($partnerIndex + 1) % count($partnerIds);
                $trackingCount++;
                continue;
            }
            if ($status === DeliveryStatus::RETURNED_TO_VENDOR) {
                $this->createReturnedAssignment($vendorOrder, $partnerIds[$partnerIndex]);
                $partnerIndex = ($partnerIndex + 1) % count($partnerIds);
                $created++;
                continue;
            }
            if ($status === DeliveryStatus::FAILED) {
                $this->createFailedAssignment($vendorOrder, $partnerIds[$partnerIndex]);
                $partnerIndex = ($partnerIndex + 1) % count($partnerIds);
                $created++;
                continue;
            }
        }

        $this->command?->info("Seeded {$created} delivery assignments with {$trackingCount} tracking records.");
    }

    private function createPendingAssignment(VendorOrder $vo, int $partnerId): void
    {
        $drop = $this->dropoff($vo);
        DeliveryAssignment::create([
            'vendor_order_id'     => $vo->id,
            'delivery_partner_id' => $partnerId,
            'status'              => DeliveryStatus::ASSIGNED,
            'delivery_fee'        => $vo->delivery_charge ?: 120,
            'cod_amount'          => $this->codAmount($vo),
            'pickup_address'      => self::PICKUP_ADDRESS,
            'dropoff_address'     => $drop,
            'recipient_name'      => $vo->order?->shipping_address_snapshot ? json_decode($vo->order->shipping_address_snapshot, true)['full_name'] ?? 'Customer' : 'Customer',
            'recipient_phone'     => $vo->order?->shipping_address_snapshot ? json_decode($vo->order->shipping_address_snapshot, true)['phone'] ?? '9800000000' : '9800000000',
            'assigned_at'         => $vo->created_at->copy()->addMinutes(random_int(5, 30)),
        ]);
    }

    private function createDeliveredAssignment(VendorOrder $vo, int $partnerId): void
    {
        $drop = $this->dropoff($vo);
        $assigned = $vo->created_at->copy()->addMinutes(random_int(5, 30));
        $accepted = $assigned->copy()->addMinutes(random_int(2, 8));
        $pickedUp = $accepted->copy()->addMinutes(random_int(15, 45));
        $outFor   = $pickedUp->copy()->addMinutes(random_int(5, 20));
        $deliveredAt = $outFor->copy()->addMinutes(random_int(15, 90));

        $assignment = DeliveryAssignment::create([
            'vendor_order_id'     => $vo->id,
            'delivery_partner_id' => $partnerId,
            'status'              => DeliveryStatus::DELIVERED,
            'delivery_fee'        => $vo->delivery_charge ?: 120,
            'cod_amount'          => $this->codAmount($vo),
            'pickup_address'      => self::PICKUP_ADDRESS,
            'dropoff_address'     => $drop,
            'recipient_name'      => $this->recipientName($vo),
            'recipient_phone'     => $this->recipientPhone($vo),
            'assigned_at'         => $assigned,
            'accepted_at'         => $accepted,
            'picked_up_at'        => $pickedUp,
            'out_for_delivery_at' => $outFor,
            'delivered_at'        => $deliveredAt,
            'proof_photo'         => 'seeded/' . Str::random(12) . '.jpg',
        ]);

        $this->createTrackingSequence($assignment, $vo, $pickedUp, $deliveredAt);
    }

    private function createActiveAssignment(VendorOrder $vo, int $partnerId, DeliveryStatus $status): int
    {
        $drop = $this->dropoff($vo);
        $assigned = $vo->created_at->copy()->addMinutes(random_int(5, 30));
        $accepted = $assigned->copy()->addMinutes(random_int(2, 8));
        $pickedUp = $accepted->copy()->addMinutes(random_int(15, 45));

        $data = [
            'vendor_order_id'     => $vo->id,
            'delivery_partner_id' => $partnerId,
            'status'              => $status,
            'delivery_fee'        => $vo->delivery_charge ?: 120,
            'cod_amount'          => $this->codAmount($vo),
            'pickup_address'      => self::PICKUP_ADDRESS,
            'dropoff_address'     => $drop,
            'recipient_name'      => $this->recipientName($vo),
            'recipient_phone'     => $this->recipientPhone($vo),
            'assigned_at'         => $assigned,
            'accepted_at'         => $accepted,
            'picked_up_at'        => $pickedUp,
        ];
        if ($status === DeliveryStatus::OUT_FOR_DELIVERY) {
            $data['out_for_delivery_at'] = $pickedUp->copy()->addMinutes(random_int(5, 20));
        }

        $assignment = DeliveryAssignment::create($data);

        $this->createTrackingSequence($assignment, $vo, $pickedUp, null);
        return 1;
    }

    private function createReturnedAssignment(VendorOrder $vo, int $partnerId): void
    {
        $drop = $this->dropoff($vo);
        $assigned = $vo->created_at->copy()->addMinutes(random_int(5, 30));
        $accepted = $assigned->copy()->addMinutes(random_int(2, 8));
        $pickedUp = $accepted->copy()->addMinutes(random_int(15, 45));
        $outFor   = $pickedUp->copy()->addMinutes(random_int(15, 45));
        $failedAt = $outFor->copy()->addMinutes(random_int(10, 60));

        DeliveryAssignment::create([
            'vendor_order_id'     => $vo->id,
            'delivery_partner_id' => $partnerId,
            'status'              => DeliveryStatus::RETURNED_TO_VENDOR,
            'delivery_fee'        => $vo->delivery_charge ?: 120,
            'cod_amount'          => $this->codAmount($vo),
            'pickup_address'      => self::PICKUP_ADDRESS,
            'dropoff_address'     => $drop,
            'recipient_name'      => $this->recipientName($vo),
            'recipient_phone'     => $this->recipientPhone($vo),
            'assigned_at'         => $assigned,
            'accepted_at'         => $accepted,
            'picked_up_at'        => $pickedUp,
            'out_for_delivery_at' => $outFor,
            'failed_at'           => $failedAt,
            'failure_reason'      => 'Customer refused delivery — returned to vendor.',
        ]);
    }

    private function createFailedAssignment(VendorOrder $vo, int $partnerId): void
    {
        $drop = $this->dropoff($vo);
        $assigned = $vo->created_at->copy()->addMinutes(random_int(5, 30));
        $accepted = $assigned->copy()->addMinutes(random_int(2, 8));
        $pickedUp = $accepted->copy()->addMinutes(random_int(15, 45));
        $outFor   = $pickedUp->copy()->addMinutes(random_int(10, 30));
        $failedAt = $outFor->copy()->addMinutes(random_int(15, 60));

        $reasons = [
            'Customer not available at delivery address.',
            'Wrong address provided — unable to locate recipient.',
            'Customer refused to accept the parcel.',
            'Incorrect phone number — unable to contact recipient.',
        ];

        DeliveryAssignment::create([
            'vendor_order_id'     => $vo->id,
            'delivery_partner_id' => $partnerId,
            'status'              => DeliveryStatus::FAILED,
            'delivery_fee'        => $vo->delivery_charge ?: 120,
            'cod_amount'          => $this->codAmount($vo),
            'pickup_address'      => self::PICKUP_ADDRESS,
            'dropoff_address'     => $drop,
            'recipient_name'      => $this->recipientName($vo),
            'recipient_phone'     => $this->recipientPhone($vo),
            'assigned_at'         => $assigned,
            'accepted_at'         => $accepted,
            'picked_up_at'        => $pickedUp,
            'out_for_delivery_at' => $outFor,
            'failed_at'           => $failedAt,
            'failure_reason'      => $reasons[array_rand($reasons)],
        ]);
    }

    private function createTrackingSequence(DeliveryAssignment $assignment, VendorOrder $vo, $startTime, $endTime): void
    {
        $snapshot = json_decode($vo->order?->shipping_address_snapshot ?? '{}', true);
        $district = $snapshot['district'] ?? 'Kathmandu';
        $coords = self::COORDS[$district] ?? self::COORDS['Kathmandu'];
        $steps = [];

        $steps[] = [
            'latitude'  => (string) self::PICKUP_LAT,
            'longitude' => (string) self::PICKUP_LNG,
            'status'    => DeliveryStatus::PICKED_UP,
            'note'      => 'Picked up from Himalayan Handicrafts warehouse.',
        ];

        if ($coords && count($coords) > 1) {
            $steps[] = [
                'latitude'  => $coords[0][0],
                'longitude' => $coords[0][1],
                'status'    => DeliveryStatus::OUT_FOR_DELIVERY,
                'note'      => 'In transit — rider en route.',
            ];
        }

        if ($endTime) {
            $lastCoord = $coords[count($coords) - 1] ?? $coords[0];
            $steps[] = [
                'latitude'  => $lastCoord[0],
                'longitude' => $lastCoord[1],
                'status'    => DeliveryStatus::DELIVERED,
                'note'      => 'Delivered to customer.',
            ];
        }

        $cursor = $startTime;
        $totalSeconds = $endTime
            ? $endTime->diffInSeconds($startTime)
            : now()->diffInSeconds($startTime);
        $interval = max(1, intdiv($totalSeconds, max(count($steps), 1)));

        foreach ($steps as $step) {
            $cursor = $cursor->copy()->addSeconds($interval + random_int(-60, 60));
            DeliveryTracking::create([
                'assignment_id'   => $assignment->id,
                'vendor_order_id' => $vo->id,
                'status'          => $step['status'],
                'latitude'        => $step['latitude'],
                'longitude'       => $step['longitude'],
                'note'            => $step['note'],
                'tracked_at'      => $cursor,
            ]);
        }
    }

    private function seedDocuments(): void
    {
        $sources = [
            'products/e587386d-a7e6-4a72-a6be-3a53fcf3ece2/50wiG97FxEmRSaD6drjBel8tnLH5CvBzSGfG0FG5.jpg',
            'products/e587386d-a7e6-4a72-a6be-3a53fcf3ece2/PXm0VTfFRRloxsnc7QwRmBrLZaSUy9SHAJGjrf3Q.png',
        ];
        $labels = ['driving_license', 'vehicle_registration', 'insurance'];
        $disk = Storage::disk('public');

        foreach (DeliveryPartner::all() as $partner) {
            if ($partner->documents()->exists()) {
                continue;
            }

            $created = 0;
            foreach ($labels as $i => $type) {
                $source = $sources[$i % count($sources)];
                $ext = Str::afterLast($source, '.');
                $target = 'delivery-documents/'.$partner->uuid.'/'.Str::slug($type).'-'.Str::random(6).'.'.$ext;

                if (! $disk->exists($source)) {
                    continue;
                }

                $disk->copy($source, $target);

                DeliveryPartnerDocument::create([
                    'delivery_partner_id' => $partner->id,
                    'document_type'       => $type,
                    'file_path'           => $target,
                    'mime_type'           => 'image/'.$ext,
                    'file_size'           => $disk->size($target),
                    'status'              => 'pending',
                ]);
                $created++;
            }

            if ($created > 0) {
                $this->command?->info("Seeded {$created} documents for {$partner->name}.");
            }
        }
    }

    private function ensureExtraPartners(): void
    {
        $extras = [
            [
                'email'      => 'rider2@gosika.com.np',
                'phone'      => '9800000005',
                'first_name' => 'Sanjay',
                'last_name'  => 'Thapa',
                'name'       => 'Sanjay Thapa',
                'vehicle'    => 'bicycle',
                'plate'      => 'BA 2 PA 1122',
                'model'      => 'Giant Escape 3',
                'color'      => 'sliver',
                'year'       => 2021,
                'insurance'  => now()->addMonths(8)->toDateString(),
                'lat'        => 27.7105,
                'lng'        => 85.3135,
            ],
            [
                'email'      => 'rider3@gosika.com.np',
                'phone'      => '9800000006',
                'first_name' => 'Deepa',
                'last_name'  => 'Magar',
                'name'       => 'Deepa Magar',
                'vehicle'    => 'motorcycle',
                'plate'      => 'BA 4 PA 9876',
                'model'      => 'Bajaj Pulsar NS160',
                'color'      => 'red',
                'year'       => 2023,
                'insurance'  => now()->addYear()->toDateString(),
                'lat'        => 27.7080,
                'lng'        => 85.3150,
            ],
        ];

        foreach ($extras as $e) {
            $user = User::firstOrCreate(
                ['email' => $e['email']],
                [
                    'uuid'              => (string) Str::uuid(),
                    'first_name'        => $e['first_name'],
                    'last_name'         => $e['last_name'],
                    'phone'             => $e['phone'],
                    'password'          => Hash::make('password'),
                    'email_verified_at' => now(),
                    'phone_verified_at' => now(),
                    'status'            => \App\Modules\Shared\Domain\Enums\UserStatus::ACTIVE,
                ]
            );
            $user->assignRole(\App\Modules\Identity\Domain\Roles::DELIVERY_PARTNER);

            DeliveryPartner::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'name'          => $e['name'],
                    'phone'         => $e['phone'],
                    'email'         => $e['email'],
                    'vehicle_type'  => $e['vehicle'],
                    'vehicle_number'=> $e['plate'],
                    'vehicle_model' => $e['model'] ?? null,
                    'vehicle_color' => $e['color'] ?? null,
                    'vehicle_year'  => $e['year'] ?? null,
                    'insurance_expiry' => $e['insurance'] ?? null,
                    'service_areas' => ['Kathmandu', 'Lalitpur', 'Bhaktapur'],
                    'status'        => DeliveryPartnerStatus::APPROVED,
                    'is_online'     => in_array($e['email'], ['rider2@gosika.com.np']),
                    'latitude'      => $e['lat'],
                    'longitude'     => $e['lng'],
                    'last_location_at' => $e['email'] === 'rider2@gosika.com.np' ? now() : null,
                    'rating_avg'    => $e['email'] === 'rider2@gosika.com.np' ? 4.6 : 4.9,
                    'rating_count'  => $e['email'] === 'rider2@gosika.com.np' ? 23 : 41,
                    'approved_at'   => now(),
                ]
            );
        }
    }

    private function dropoff(VendorOrder $vo): string
    {
        $snapshot = json_decode($vo->order?->shipping_address_snapshot ?? '{}', true);
        $district = $snapshot['district'] ?? 'Kathmandu';
        $options  = self::DROPOFFS[$district] ?? self::DROPOFFS['Kathmandu'];
        return $options[array_rand($options)];
    }

    private function recipientName(VendorOrder $vo): string
    {
        $snapshot = json_decode($vo->order?->shipping_address_snapshot ?? '{}', true);
        return $snapshot['full_name'] ?? 'Customer';
    }

    private function recipientPhone(VendorOrder $vo): string
    {
        $snapshot = json_decode($vo->order?->shipping_address_snapshot ?? '{}', true);
        return $snapshot['phone'] ?? '9800000000';
    }

    private function codAmount(VendorOrder $vo): float
    {
        return $vo->order && $vo->order->payment_method === 'cash_on_delivery'
            ? (float) $vo->grand_total
            : 0;
    }
}
