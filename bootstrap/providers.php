<?php

use App\Modules\Catalog\Providers\CatalogServiceProvider;
use App\Modules\Cart\Providers\CartServiceProvider;
use App\Modules\Checkout\Providers\CheckoutServiceProvider;
use App\Modules\Customer\Providers\CustomerServiceProvider;
use App\Modules\Identity\Providers\IdentityServiceProvider;
use App\Modules\Administration\Providers\AdministrationServiceProvider;
use App\Modules\Analytics\Providers\AnalyticsServiceProvider;
use App\Modules\Marketing\Providers\MarketingServiceProvider;
use App\Modules\Marketplace\Providers\MarketplaceServiceProvider;
use App\Modules\Order\Providers\OrderServiceProvider;
use App\Modules\Payment\Providers\PaymentServiceProvider;
use App\Modules\Platform\Providers\PlatformServiceProvider;
use App\Modules\Shipping\Providers\ShippingServiceProvider;
use App\Modules\Support\Providers\SupportServiceProvider;
use App\Modules\Wallet\Providers\WalletServiceProvider;
use App\Modules\Shared\Providers\SharedServiceProvider;
use App\Modules\Vendor\Providers\VendorServiceProvider;
use App\Providers\AppServiceProvider;
use Laravel\Socialite\SocialiteServiceProvider;

return [
    AppServiceProvider::class,
    SocialiteServiceProvider::class,
    SharedServiceProvider::class,
    IdentityServiceProvider::class,
    PlatformServiceProvider::class,
    VendorServiceProvider::class,
    CatalogServiceProvider::class,
    CustomerServiceProvider::class,
    CartServiceProvider::class,
    CheckoutServiceProvider::class,
    OrderServiceProvider::class,
    PaymentServiceProvider::class,
    MarketplaceServiceProvider::class,
    MarketingServiceProvider::class,
    WalletServiceProvider::class,
    ShippingServiceProvider::class,
    SupportServiceProvider::class,
    AdministrationServiceProvider::class,
    AnalyticsServiceProvider::class,
];
