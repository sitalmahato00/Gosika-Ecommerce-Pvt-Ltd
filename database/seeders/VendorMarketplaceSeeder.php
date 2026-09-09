<?php

namespace Database\Seeders;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Infrastructure\Models\Broadcast;
use App\Modules\Support\Infrastructure\Models\SupportTicket;
use App\Modules\Support\Infrastructure\Models\TicketMessage;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Infrastructure\Models\SellerTier;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\StoreAddress;
use App\Modules\Vendor\Infrastructure\Models\StoreOperatingHour;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Infrastructure\Models\VendorDocument;
use App\Modules\Vendor\Infrastructure\Models\VendorKyc;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VendorMarketplaceSeeder extends Seeder
{
    public function run(): void
    {
        $vendor = Vendor::query()
            ->where('business_email', 'vendor@gosika.com.np')
            ->orWhere('company_name', 'Himalayan Handicrafts')
            ->first();

        if (! $vendor) {
            $this->command?->warn('Demo vendor not found. VendorMarketplaceSeeder skipped.');

            return;
        }

        $vendorUser = User::query()->find($vendor->user_id);
        $admin = User::query()->role(Roles::SUPER_ADMIN)->first();

        $store = Store::query()->where('vendor_id', $vendor->id)->first() ?? Store::query()->first();

        $this->profile($vendor, $admin, $store);
        $this->kycAndBank($vendor, $admin);
        $this->tiers($vendor);
        $this->bulletins($admin);
        $this->sellerInquiries($vendor, $vendorUser, $admin);

        $this->command?->info('Vendor marketplace profile seeded for '.$vendor->company_name.'.');
    }

    protected function profile(Vendor $vendor, ?User $admin, ?Store $store): void
    {
        $vendor->update([
            'pan_vat' => '301234567',
            'registration_number' => 'DPR-2024-0831',
            'business_phone' => '9800000003',
            'logo' => 'https://images.unsplash.com/photo-1545016696-f44b8b9f9a6e?w=300&q=80',
        ]);

        if ($store) {
            $store->update([
                'logo' => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80',
                'banner' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80',
                'description' => 'A family-run cooperative showcasing hand-knotted thangka paintings, brass singing bowls, organic Nepali produce, and artisanal handicrafts crafted by master artisans of the Kathmandu valley. Every purchase directly supports heritage craft communities across Nepal.',
                'contact_email' => 'vendor@gosika.com.np',
                'contact_phone' => '9800000003',
            ]);

            $address = StoreAddress::query()->firstOrCreate(
                ['store_id' => $store->id, 'address_type' => 'business'],
                [
                    'address_line_1' => 'Boudhanath, Gaushala Road',
                    'address_line_2' => 'Kathmandu Metropolitan City',
                    'country_id' => DB::table('countries')->where('name', 'Nepal')->value('id'),
                    'province_id' => DB::table('provinces')->where('name', 'Bagmati Province')->value('id'),
                    'district_id' => DB::table('districts')->where('name', 'Kathmandu')->value('id'),
                    'municipality_id' => DB::table('municipalities')->where('name', 'Kathmandu')->value('id'),
                    'postal_code' => '44600',
                    'landmark' => 'Near Boudhanath Stupa',
                ]
            );

            $address->update([
                'address_line_1' => 'Boudhanath, Gaushala Road',
                'address_line_2' => 'Kathmandu Metropolitan City',
                'postal_code' => '44600',
                'landmark' => 'Near Boudhanath Stupa',
            ]);

            $hours = [0 => [null, null, true], 1 => ['09:00', '19:00', false], 2 => ['09:00', '19:00', false], 3 => ['09:00', '19:00', false], 4 => ['09:00', '19:00', false], 5 => ['09:00', '20:00', false], 6 => ['10:00', '18:00', false]];

            foreach ($hours as $day => [$open, $close, $closed]) {
                StoreOperatingHour::query()->updateOrCreate(
                    ['store_id' => $store->id, 'day_of_week' => $day],
                    ['opens_at' => $open, 'closes_at' => $close, 'is_closed' => $closed]
                );
            }
        }
    }

    protected function kycAndBank(Vendor $vendor, ?User $admin): void
    {
        $kyc = VendorKyc::query()->updateOrCreate(
            ['vendor_id' => $vendor->id],
            [
                'owner_full_name' => 'Ramesh Bhandari',
                'owner_citizenship_number' => '1234-5678-9012',
                'owner_email' => 'vendor@gosika.com.np',
                'owner_phone' => '9800000004',
                'business_type' => 'Handicrafts Retail & Export',
                'address' => 'Boudhanath, Kathmandu 44600',
                'status' => 'approved',
                'review_notes' => 'Verified against PAN and business registration records.',
                'reviewed_by' => $admin?->id,
                'reviewed_at' => now(),
            ]
        );

        foreach ([
            ['citizenship', 'uploads/vendor-docs/demo-citizenship.pdf'],
            ['pan_vat', 'uploads/vendor-docs/demo-pan-vat.pdf'],
            ['registration', 'uploads/vendor-docs/demo-registration.pdf'],
        ] as [$type, $path]) {
            VendorDocument::query()->updateOrCreate(
                ['vendor_id' => $vendor->id, 'document_type' => $type],
                [
                    'vendor_kyc_id' => $kyc->id,
                    'file_path' => $path,
                    'mime_type' => 'application/pdf',
                    'file_size' => 245760,
                    'status' => 'approved',
                    'reviewed_by' => $admin?->id,
                    'reviewed_at' => now(),
                ]
            );
        }

        BankAccount::query()->updateOrCreate(
            ['vendor_id' => $vendor->id, 'account_number' => '0098123456789'],
            [
                'bank_name' => 'Nepal Bank Limited',
                'branch_name' => 'Boudhanath',
                'account_name' => 'Himalayan Handicrafts',
                'account_type' => 'savings',
                'is_verified' => true,
                'is_default' => true,
            ]
        );
    }

    protected function tiers(Vendor $vendor): void
    {
        $definitions = [
            ['name' => 'New Seller', 'slug' => 'new-seller', 'badge_level' => 0, 'min_orders' => 0, 'min_gmv' => 0, 'commission_percent' => null, 'badge_color' => '#64748b', 'badge_icon' => 'Seed', 'sort_order' => 1, 'is_active' => true, 'benefits' => ['Standard marketplace visibility', 'Basic analytics', 'Community support']],
            ['name' => 'Silver Seller', 'slug' => 'silver', 'badge_level' => 1, 'min_orders' => 10, 'min_gmv' => 50000, 'commission_percent' => 10, 'badge_color' => '#94a3b8', 'badge_icon' => 'Award', 'sort_order' => 2, 'is_active' => true, 'benefits' => ['Lowest-tier commission', 'Featured in category carousels', 'Priority vendor support']],
            ['name' => 'Gold Seller', 'slug' => 'gold', 'badge_level' => 2, 'min_orders' => 50, 'min_gmv' => 250000, 'commission_percent' => 8, 'badge_color' => '#eab308', 'badge_icon' => 'Medal', 'sort_order' => 3, 'is_active' => true, 'benefits' => ['Reduced commission (8%)', 'Storefront spotlight rotation', 'Early access to promotional campaigns']],
            ['name' => 'Platinum Seller', 'slug' => 'platinum', 'badge_level' => 3, 'min_orders' => 200, 'min_gmv' => 1000000, 'commission_percent' => 6, 'badge_color' => '#2563eb', 'badge_icon' => 'Crown', 'sort_order' => 4, 'is_active' => true, 'benefits' => ['Lowest commission (6%)', 'Dedicated account manager', 'Homepage hero placements', 'Invitation to seller events']],
        ];

        foreach ($definitions as $definition) {
            SellerTier::query()->updateOrCreate(
                ['slug' => $definition['slug']],
                $definition
            );
        }

        $silver = SellerTier::query()->where('slug', 'silver')->value('id');

        if ($silver && $vendor->seller_tier_id === null) {
            $vendor->update(['seller_tier_id' => $silver]);
        }
    }

    protected function bulletins(?User $admin): void
    {
        $vendorCount = (int) User::query()->role(Roles::VENDOR_ADMIN)->where('status', 'active')->count();

        foreach ([
            ['title' => 'Dashain Festival Selling Boost', 'message' => 'With Dashain and Tihar approaching, update your inventories, enable express delivery, and add festive combos to capture higher seasonal demand. Ads are now available within the vendor dashboard.', 'channel' => 'in_app', 'reach' => $vendorCount],
            ['title' => 'New Commission Policy for Gold Sellers', 'message' => 'Sellers who reach Gold tier (50 fulfilled orders or NPR 250,000 GMV) will see their commission reduced to 8%. Check your tier in the Seller Tiers section of the admin marketplace.', 'channel' => 'in_app', 'reach' => $vendorCount],
        ] as $bulletin) {
            Broadcast::query()->updateOrCreate(
                ['title' => $bulletin['title']],
                [
                    'message' => $bulletin['message'],
                    'channel' => $bulletin['channel'],
                    'target_type' => 'vendors',
                    'target_ids' => null,
                    'status' => 'sent',
                    'reach' => $bulletin['reach'],
                    'sent_at' => now(),
                    'created_by' => $admin?->id,
                ]
            );
        }
    }

    protected function sellerInquiries(Vendor $vendor, ?User $vendorUser, ?User $admin): void
    {
        $seeds = [
            [
                'subject' => 'Want to add reorder stock for singing bowls',
                'description' => 'Our brass singing bowl inventory is running low. How do we upload a bulk CSV to speed up the restock?',
                'category' => 'Catalog & Inventory',
                'priority' => 'normal',
                'status' => 'open',
            ],
            [
                'subject' => 'Payout schedule clarification',
                'description' => 'When is the weekly payout cycle run and how long does a withdrawal take to appear in the bank account?',
                'category' => 'Payments & Payouts',
                'priority' => 'high',
                'status' => 'open',
            ],
            [
                'subject' => 'Customer returned a damaged thangka',
                'description' => 'A thangka was returned damaged in transit. We have raised a claim with the courier and would like guidance on the return resolution flow.',
                'category' => 'Returns & Refunds',
                'priority' => 'normal',
                'status' => 'closed',
            ],
        ];

        foreach ($seeds as $seed) {
            $ticket = SupportTicket::query()->updateOrCreate(
                ['vendor_id' => $vendor->id, 'subject' => $seed['subject']],
                [
                    'ticket_number' => 'TCK-'.strtoupper(Str::random(8)),
                    'user_id' => $vendorUser?->id,
                    'subject' => $seed['subject'],
                    'description' => $seed['description'],
                    'category' => $seed['category'],
                    'priority' => $seed['priority'],
                    'status' => $seed['status'],
                    'resolved_at' => $seed['status'] === 'closed' ? now() : null,
                ]
            );

            if ($ticket->messages()->count() === 0) {
                TicketMessage::query()->create([
                    'support_ticket_id' => $ticket->id,
                    'sender_user_id' => $vendorUser?->id,
                    'message' => $seed['description'],
                    'is_internal' => false,
                ]);
            }
        }

        $openTickets = SupportTicket::query()->where('vendor_id', $vendor->id)->where('status', 'open')->orderByDesc('created_at')->limit(2)->get();

        foreach ($openTickets as $ticket) {
            if ($ticket->messages()->count() < 2 && $admin) {
                TicketMessage::query()->create([
                    'support_ticket_id' => $ticket->id,
                    'sender_user_id' => $admin->id,
                    'message' => 'Thanks for reaching out — our seller support team is reviewing this and will respond within one business day.',
                    'is_internal' => false,
                ]);
            }
        }
    }
}