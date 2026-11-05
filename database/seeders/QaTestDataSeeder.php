<?php

namespace Database\Seeders;

use App\Modules\Cart\Infrastructure\Models\Cart;
use App\Modules\Cart\Infrastructure\Models\CartItem;
use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Infrastructure\Models\ProductImage;
use App\Modules\Catalog\Infrastructure\Models\ProductVariant;
use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Customer\Infrastructure\Models\CustomerProfile;
use App\Modules\Customer\Infrastructure\Models\CustomerWallet;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Infrastructure\Models\Coupon;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Platform\Infrastructure\Models\Country;
use App\Modules\Platform\Infrastructure\Models\District;
use App\Modules\Platform\Infrastructure\Models\Municipality;
use App\Modules\Platform\Infrastructure\Models\Province;
use App\Modules\Shared\Domain\Enums\DeliveryPartnerStatus;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Shipping\Infrastructure\Models\ShippingZone;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Infrastructure\Models\VendorDocument;
use App\Modules\Vendor\Infrastructure\Models\VendorKyc;
use App\Modules\Wallet\Infrastructure\Models\VendorWallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class QaTestDataSeeder extends Seeder
{
    private array $users = [];

    private array $vendors = [];

    private array $stores = [];

    private array $products = [];

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('QA test data may only be seeded in local or testing environments.');
        }

        $password = (string) env('QA_TEST_PASSWORD', '');
        if (mb_strlen($password) < 12) {
            throw new RuntimeException('Set QA_TEST_PASSWORD to a test-only password of at least 12 characters in your approved secrets store.');
        }

        DB::transaction(function () use ($password): void {
            $this->seedUsers($password);
            $this->seedVendors();
            $this->seedDeliveryPartners();
            $this->seedCustomerProfilesAndAddresses();
            $this->seedProducts();
            $this->seedWallets();
            $this->seedCouponsAndShippingZones();
            $this->seedCustomerCarts();
            $this->seedReturnEligibleOrder();
        });

        $this->seedKycUploadFixtures();
        $this->command?->info('QA test accounts and marketplace fixtures are ready. Credentials were not printed.');
    }

    private function seedUsers(string $password): void
    {
        $accounts = [
            'ADM-01' => ['admin@gosika.com.np', '9801000001', 'QA', 'Super Admin', Roles::SUPER_ADMIN],
            'S-1' => ['staff@gosika.com.np', '9801000002', 'QA', 'Orders Staff', 'qa_orders_view_only'],
            'SEL-A' => ['sellerA@gosika.com.np', '9801000003', 'QA', 'Seller A', Roles::VENDOR_ADMIN],
            'SEL-B' => ['sellerB@gosika.com.np', '9801000004', 'QA', 'Seller B', Roles::VENDOR_ADMIN],
            'SEL-C' => ['sellerC@gosika.com.np', '9801000005', 'QA', 'Seller C', Roles::VENDOR_ADMIN],
            'DP-1' => ['delivery1@gosika.com.np', '9801000006', 'QA', 'Delivery One', Roles::DELIVERY_PARTNER],
            'DP-2' => ['delivery2@gosika.com.np', '9801000007', 'QA', 'Delivery Two', Roles::DELIVERY_PARTNER],
            'CUS-A' => ['customerA@gosika.com.np', '9801000008', 'QA', 'Customer A', Roles::CUSTOMER],
            'CUS-B' => ['customerB@gosika.com.np', '9801000009', 'QA', 'Customer B', Roles::CUSTOMER],
        ];

        foreach ($accounts as $reference => [$email, $phone, $firstName, $lastName, $role]) {
            $user = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'phone' => $phone,
                    'password' => Hash::make($password),
                    'email_verified_at' => now(),
                    'phone_verified_at' => now(),
                    'status' => UserStatus::ACTIVE,
                    'meta' => ['qa_reference' => $reference],
                ]
            );
            $user->syncRoles([$role]);
            $this->users[$reference] = $user;
        }
    }

    private function seedVendors(): void
    {
        $definitions = [
            'SEL-A' => ['company' => 'QA Alpine Goods', 'status' => VendorStatus::APPROVED, 'kyc' => 'approved'],
            'SEL-B' => ['company' => 'QA Valley Market', 'status' => VendorStatus::APPROVED, 'kyc' => 'approved'],
            'SEL-C' => ['company' => 'QA River Crafts', 'status' => VendorStatus::APPROVED, 'kyc' => 'pending'],
        ];

        foreach ($definitions as $reference => $definition) {
            $user = $this->users[$reference];
            $vendor = Vendor::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'company_name' => $definition['company'],
                    'business_email' => $user->email,
                    'business_phone' => $user->phone,
                    'status' => $definition['status'],
                    'commission_rate' => 10,
                    'approved_by' => $this->users['ADM-01']->id,
                    'approved_at' => now(),
                    'meta' => ['qa_reference' => $reference],
                ]
            );
            $store = Store::query()->updateOrCreate(
                ['vendor_id' => $vendor->id],
                [
                    'name' => $definition['company'].' Store',
                    'slug' => Str::slug($definition['company']),
                    'description' => 'Synthetic storefront for isolated QA scenarios.',
                    'contact_email' => $user->email,
                    'contact_phone' => $user->phone,
                    'status' => StoreStatus::ACTIVE,
                    'approved_by' => $this->users['ADM-01']->id,
                    'approved_at' => now(),
                ]
            );
            $kyc = VendorKyc::query()->updateOrCreate(
                ['vendor_id' => $vendor->id],
                [
                    'owner_full_name' => 'QA '.$user->last_name,
                    'owner_email' => $user->email,
                    'owner_phone' => $user->phone,
                    'business_type' => 'Test business',
                    'address' => 'QA Test Address',
                    'province' => 'Bagmati Province',
                    'district' => 'Kathmandu',
                    'municipality' => 'Kathmandu',
                    'status' => $definition['kyc'],
                    'reviewed_by' => $definition['kyc'] === 'approved' ? $this->users['ADM-01']->id : null,
                    'reviewed_at' => $definition['kyc'] === 'approved' ? now() : null,
                ]
            );

            if ($definition['kyc'] === 'approved') {
                VendorDocument::query()->updateOrCreate(
                    ['vendor_id' => $vendor->id, 'document_type' => 'business_registration'],
                    [
                        'vendor_kyc_id' => $kyc->id,
                        'file_path' => 'qa-test-data/KYC-DUMMY/sample.pdf',
                        'mime_type' => 'application/pdf',
                        'file_size' => 512,
                        'status' => 'approved',
                        'reviewed_by' => $this->users['ADM-01']->id,
                        'reviewed_at' => now(),
                    ]
                );
            }

            $this->vendors[$reference] = $vendor;
            $this->stores[$reference] = $store;
        }
    }

    private function seedDeliveryPartners(): void
    {
        foreach ([
            'DP-1' => ['vehicle' => 'BA QA 1001', 'online' => true],
            'DP-2' => ['vehicle' => 'BA QA 1002', 'online' => false],
        ] as $reference => $definition) {
            $user = $this->users[$reference];
            DeliveryPartner::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $user->full_name,
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'vehicle_type' => 'motorcycle',
                    'vehicle_number' => $definition['vehicle'],
                    'service_areas' => ['Kathmandu', 'Lalitpur', 'Bhaktapur'],
                    'status' => DeliveryPartnerStatus::APPROVED,
                    'is_online' => $definition['online'],
                    'approved_by' => $this->users['ADM-01']->id,
                    'approved_at' => now(),
                ]
            );
        }
    }

    private function seedCustomerProfilesAndAddresses(): void
    {
        $country = Country::query()->where('code', 'NP')->firstOrFail();
        $province = Province::query()->where('name', 'Bagmati Province')->firstOrFail();
        $district = District::query()
            ->where('province_id', $province->id)
            ->where('name', 'Kathmandu')
            ->firstOrFail();
        $municipality = Municipality::query()
            ->where('district_id', $district->id)
            ->where('name', 'Kathmandu')
            ->firstOrFail();

        foreach (['CUS-A', 'CUS-B'] as $reference) {
            $user = $this->users[$reference];
            CustomerProfile::query()->updateOrCreate(
                ['user_id' => $user->id],
                ['preferences' => ['qa_reference' => $reference]]
            );
            $labels = $reference === 'CUS-A' ? ['Home', 'Office'] : ['Home'];

            foreach ($labels as $index => $label) {
                CustomerAddress::query()->updateOrCreate(
                    ['user_id' => $user->id, 'label' => $label],
                    [
                        'address_type' => 'shipping',
                        'full_name' => $user->full_name,
                        'phone' => $user->phone,
                        'address_line_1' => $index === 0 ? 'QA Street 1' : 'QA Street 2',
                        'address_line_2' => 'Ward 1',
                        'country_id' => $country->id,
                        'province_id' => $province->id,
                        'district_id' => $district->id,
                        'municipality_id' => $municipality->id,
                        'postal_code' => '44600',
                        'landmark' => 'QA landmark',
                        'is_default' => $index === 0,
                    ]
                );
            }
        }
    }

    private function seedProducts(): void
    {
        $catalog = [
            'P-01' => ['seller' => 'SEL-A', 'name' => 'QA Cotton Tote', 'price' => 900, 'compare' => null, 'quantity' => 20, 'threshold' => 5, 'stock' => 'in_stock'],
            'P-02' => ['seller' => 'SEL-B', 'name' => 'QA Ceramic Cup', 'price' => 1200, 'compare' => 1500, 'quantity' => 12, 'threshold' => 5, 'stock' => 'in_stock'],
            'P-03' => ['seller' => 'SEL-C', 'name' => 'QA Wool Scarf', 'price' => 1800, 'compare' => null, 'quantity' => 2, 'threshold' => 5, 'stock' => 'low_stock'],
            'OOS-01' => ['seller' => 'SEL-A', 'name' => 'QA Out of Stock Item', 'price' => 700, 'compare' => null, 'quantity' => 0, 'threshold' => 5, 'stock' => 'out_of_stock'],
        ];
        $category = Category::query()->where('slug', 'apparel')->firstOrFail();
        $brand = Brand::query()->where('slug', 'nepali-arts')->firstOrFail();

        foreach ($catalog as $reference => $item) {
            $product = Product::query()->updateOrCreate(
                ['slug' => Str::slug($reference.'-'.$item['name'])],
                [
                    'vendor_id' => $this->vendors[$item['seller']]->id,
                    'store_id' => $this->stores[$item['seller']]->id,
                    'category_id' => $category->id,
                    'brand_id' => $brand->id,
                    'name' => $item['name'],
                    'description' => 'Synthetic QA product '.$reference.'.',
                    'short_description' => 'Synthetic QA listing.',
                    'sku' => 'QA-'.$reference,
                    'status' => ProductStatus::PUBLISHED,
                    'stock_status' => $item['stock'],
                    'quantity' => $item['quantity'],
                    'low_stock_threshold' => $item['threshold'],
                    'price' => $item['price'],
                    'compare_at_price' => $item['compare'],
                    'currency' => 'NPR',
                    'tax_rate' => 13,
                    'is_variant' => $reference === 'P-01',
                    'meta' => ['qa_reference' => $reference],
                ]
            );
            ProductImage::query()->where('product_id', $product->id)->delete();
            $imagePath = 'qa-test-data/'.$reference.'.svg';
            $this->putFile('public', $imagePath, $this->productImageSvg($reference));
            ProductImage::query()->create([
                'product_id' => $product->id,
                'file_path' => Storage::disk('public')->url($imagePath),
                'sort_order' => 0,
                'is_primary' => true,
            ]);

            if ($reference === 'P-01') {
                ProductVariant::query()->updateOrCreate(
                    ['product_id' => $product->id, 'sku' => 'QA-P-01-RED'],
                    [
                        'name' => 'Red',
                        'price' => $item['price'],
                        'quantity' => $item['quantity'],
                        'stock_status' => 'in_stock',
                        'options' => ['color' => 'Red'],
                        'is_default' => true,
                    ]
                );
            }

            $this->products[$reference] = $product;
        }
    }

    private function seedWallets(): void
    {
        foreach ($this->vendors as $reference => $vendor) {
            $balance = $reference === 'SEL-A' ? 5000 : 0;
            VendorWallet::query()->updateOrCreate(
                ['vendor_id' => $vendor->id],
                [
                    'balance' => $balance,
                    'available_balance' => $balance,
                    'pending_balance' => 0,
                    'currency' => 'NPR',
                    'version' => 1,
                ]
            );
        }

        foreach (['CUS-A', 'CUS-B'] as $reference) {
            CustomerWallet::query()->updateOrCreate(
                ['user_id' => $this->users[$reference]->id],
                ['balance' => 0, 'currency' => 'NPR', 'version' => 1]
            );
        }
    }

    private function seedCouponsAndShippingZones(): void
    {
        Coupon::query()->updateOrCreate(
            ['code' => 'ACTIVE10'],
            [
                'name' => 'QA Active 10 Percent',
                'description' => 'QA coupon with minimum, usage, and cap constraints.',
                'discount_type' => 'percentage',
                'discount_value' => 10,
                'min_order_amount' => 500,
                'max_discount' => 500,
                'usage_limit' => 100,
                'per_user_limit' => 2,
                'used_count' => 0,
                'valid_from' => now()->toDateString(),
                'valid_until' => now()->addMonth()->toDateString(),
                'is_active' => true,
                'applies_to' => 'all',
            ]
        );
        Coupon::query()->updateOrCreate(
            ['code' => 'EXPIRED10'],
            [
                'name' => 'QA Expired 10 Percent',
                'discount_type' => 'percentage',
                'discount_value' => 10,
                'usage_limit' => 100,
                'per_user_limit' => 1,
                'valid_from' => now()->subMonth()->toDateString(),
                'valid_until' => now()->subDay()->toDateString(),
                'is_active' => true,
                'applies_to' => 'all',
            ]
        );

        foreach ([
            'ZONE-X' => ['provinces' => ['Bagmati Province'], 'standard' => 80, 'express' => 150],
            'ZONE-Y' => ['provinces' => ['Koshi Province'], 'standard' => 180, 'express' => 300],
        ] as $name => $zone) {
            ShippingZone::query()->updateOrCreate(
                ['name' => $name],
                [
                    'description' => 'Synthetic QA shipping zone.',
                    'provinces' => $zone['provinces'],
                    'standard_charge' => $zone['standard'],
                    'express_charge' => $zone['express'],
                    'estimated_days' => $name === 'ZONE-X' ? 1 : 3,
                    'is_active' => true,
                ]
            );
        }
    }

    private function seedCustomerCarts(): void
    {
        foreach (['CUS-A', 'CUS-B'] as $reference) {
            $cart = Cart::query()->updateOrCreate(
                ['user_id' => $this->users[$reference]->id, 'status' => 'active'],
                ['session_id' => null]
            );
            $cart->items()->delete();
        }

        $multiVendorCart = Cart::query()->updateOrCreate(
            ['session_id' => 'QA-CART-MV'],
            ['user_id' => null, 'status' => 'active']
        );
        $multiVendorCart->items()->delete();

        foreach (['P-01', 'P-02', 'P-03'] as $reference) {
            $product = $this->products[$reference];
            CartItem::query()->create([
                'cart_id' => $multiVendorCart->id,
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => $product->price,
                'total_price' => $product->price,
            ]);
        }
    }

    private function seedReturnEligibleOrder(): void
    {
        $deliveredAt = now()->subDays(3);
        $user = $this->users['CUS-A'];
        $address = CustomerAddress::query()->where('user_id', $user->id)->where('label', 'Home')->firstOrFail();
        $product = $this->products['P-01'];
        $vendor = $this->vendors['SEL-A'];
        $store = $this->stores['SEL-A'];
        $partner = DeliveryPartner::query()->where('user_id', $this->users['DP-1']->id)->firstOrFail();
        $total = (float) $product->price;

        $order = Order::query()->updateOrCreate(
            ['order_number' => 'QA-ORD-RET'],
            [
                'user_id' => $user->id,
                'shipping_address_id' => $address->id,
                'shipping_address_snapshot' => 'QA Street 1, Kathmandu, Bagmati Province',
                'payment_method' => 'cod',
                'payment_status' => OrderPaymentStatus::PAID,
                'status' => OrderStatus::COMPLETED,
                'subtotal' => $total,
                'delivery_charge' => 80,
                'grand_total' => $total + 80,
                'currency' => 'NPR',
                'placed_at' => $deliveredAt->copy()->subDays(2),
                'confirmed_at' => $deliveredAt->copy()->subDays(2),
                'completed_at' => $deliveredAt,
                'meta' => ['qa_reference' => 'ORD-RET'],
            ]
        );
        $vendorOrder = VendorOrder::query()->updateOrCreate(
            ['vendor_order_number' => 'QA-VO-ORD-RET'],
            [
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'store_id' => $store->id,
                'status' => OrderStatus::COMPLETED,
                'delivery_status' => DeliveryStatus::DELIVERED,
                'items_subtotal' => $total,
                'delivery_charge' => 80,
                'grand_total' => $total + 80,
                'commission_rate' => 10,
                'commission_amount' => $total * 0.1,
                'vendor_payable' => $total * 0.9,
            ]
        );
        $item = OrderItem::query()->updateOrCreate(
            ['order_id' => $order->id, 'sku' => 'QA-ORD-RET-ITEM'],
            [
                'vendor_order_id' => $vendorOrder->id,
                'vendor_id' => $vendor->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => 1,
                'unit_price' => $total,
                'line_total' => $total,
                'delivery_status' => DeliveryStatus::DELIVERED,
            ]
        );
        DeliveryAssignment::query()->updateOrCreate(
            ['vendor_order_id' => $vendorOrder->id, 'delivery_partner_id' => $partner->id],
            [
                'status' => DeliveryStatus::DELIVERED,
                'delivery_fee' => 80,
                'pickup_address' => 'QA Seller A Store',
                'dropoff_address' => 'QA Street 1, Kathmandu',
                'recipient_name' => $user->full_name,
                'recipient_phone' => $user->phone,
                'assigned_at' => $deliveredAt->copy()->subDay(),
                'delivered_at' => $deliveredAt,
                'meta' => ['qa_reference' => 'ORD-RET', 'order_item_id' => $item->id],
            ]
        );
    }

    private function seedKycUploadFixtures(): void
    {
        $fixtures = [
            'sample.jpg' => base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A/9k=', true),
            'sample.png' => base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/rS8AAAAASUVORK5CYII=', true),
            'sample.pdf' => "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
            'invalid.txt' => 'Synthetic invalid upload fixture; not a document.',
            'oversized.jpg' => str_repeat('0', 5 * 1024 * 1024 + 1),
        ];

        foreach ($fixtures as $name => $contents) {
            if ($contents === false) {
                throw new RuntimeException('Unable to decode the bundled QA upload fixture: '.$name);
            }
            $this->putFile('local', 'qa-test-data/KYC-DUMMY/'.$name, $contents);
        }
    }

    private function productImageSvg(string $reference): string
    {
        $label = htmlspecialchars($reference, ENT_QUOTES | ENT_XML1, 'UTF-8');

        return '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="#e8eef2"/><text x="400" y="420" text-anchor="middle" font-family="sans-serif" font-size="72" fill="#243746">'.$label.'</text></svg>';
    }

    private function putFile(string $disk, string $path, string $contents): void
    {
        if (! Storage::disk($disk)->put($path, $contents)) {
            throw new RuntimeException('Unable to write the QA fixture file: '.$path);
        }
    }
}
