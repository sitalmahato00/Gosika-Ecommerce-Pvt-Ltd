<?php

namespace App\Modules\Identity\Domain;

final class Permissions
{
    public const USERS_VIEW = 'users.view';
    public const USERS_CREATE = 'users.create';
    public const USERS_UPDATE = 'users.update';
    public const USERS_DELETE = 'users.delete';
    public const USERS_MANAGE_ROLES = 'users.manage_roles';

    public const VENDORS_VIEW = 'vendors.view';
    public const VENDORS_APPROVE = 'vendors.approve';
    public const VENDORS_REJECT = 'vendors.reject';
    public const VENDORS_SUSPEND = 'vendors.suspend';
    public const VENDOR_KYC_REVIEW = 'vendor_kyc.review';
    public const STORES_VIEW = 'stores.view';
    public const STORES_MANAGE = 'stores.manage';
    public const STORES_APPROVE = 'stores.approve';

    public const PRODUCTS_VIEW = 'products.view';
    public const PRODUCTS_CREATE = 'products.create';
    public const PRODUCTS_UPDATE = 'products.update';
    public const PRODUCTS_DELETE = 'products.delete';
    public const PRODUCTS_APPROVE = 'products.approve';
    public const CATEGORIES_MANAGE = 'categories.manage';
    public const BRANDS_MANAGE = 'brands.manage';

    public const ORDERS_VIEW = 'orders.view';
    public const ORDERS_MANAGE = 'orders.manage';
    public const ORDERS_CANCEL = 'orders.cancel';
    public const ORDERS_REFUND = 'orders.refund';

    public const PAYMENTS_VIEW = 'payments.view';
    public const PAYMENTS_MANAGE = 'payments.manage';
    public const REFUNDS_MANAGE = 'refunds.manage';
    public const RECONCILIATION_MANAGE = 'reconciliation.manage';

    public const WALLETS_VIEW = 'wallets.view';
    public const WALLETS_ADJUST = 'wallets.adjust';
    public const SETTLEMENTS_MANAGE = 'settlements.manage';
    public const PAYOUTS_APPROVE = 'payouts.approve';
    public const PAYOUTS_REQUEST = 'payouts.request';

    public const DELIVERIES_MANAGE = 'deliveries.manage';
    public const DELIVERY_PARTNERS_MANAGE = 'delivery_partners.manage';

    public const COUPONS_MANAGE = 'coupons.manage';
    public const BANNERS_MANAGE = 'banners.manage';
    public const CAMPAIGNS_MANAGE = 'campaigns.manage';
    public const PROMOTIONS_MANAGE = 'promotions.manage';
    public const PAGES_MANAGE = 'pages.manage';

    public const TICKETS_MANAGE = 'tickets.manage';
    public const TICKETS_VIEW = 'tickets.view';

    public const ANALYTICS_VIEW = 'analytics.view';

    public const SETTINGS_MANAGE = 'settings.manage';

    public const ALL = [
        self::USERS_VIEW, self::USERS_CREATE, self::USERS_UPDATE, self::USERS_DELETE, self::USERS_MANAGE_ROLES,
        self::VENDORS_VIEW, self::VENDORS_APPROVE, self::VENDORS_REJECT, self::VENDORS_SUSPEND,
        self::VENDOR_KYC_REVIEW, self::STORES_VIEW, self::STORES_MANAGE, self::STORES_APPROVE,
        self::PRODUCTS_VIEW, self::PRODUCTS_CREATE, self::PRODUCTS_UPDATE, self::PRODUCTS_DELETE,
        self::PRODUCTS_APPROVE, self::CATEGORIES_MANAGE, self::BRANDS_MANAGE,
        self::ORDERS_VIEW, self::ORDERS_MANAGE, self::ORDERS_CANCEL, self::ORDERS_REFUND,
        self::PAYMENTS_VIEW, self::PAYMENTS_MANAGE, self::REFUNDS_MANAGE, self::RECONCILIATION_MANAGE,
        self::WALLETS_VIEW, self::WALLETS_ADJUST, self::SETTLEMENTS_MANAGE,
        self::PAYOUTS_APPROVE, self::PAYOUTS_REQUEST,
        self::DELIVERIES_MANAGE, self::DELIVERY_PARTNERS_MANAGE,
        self::COUPONS_MANAGE, self::BANNERS_MANAGE, self::CAMPAIGNS_MANAGE, self::PROMOTIONS_MANAGE, self::PAGES_MANAGE,
        self::TICKETS_MANAGE, self::TICKETS_VIEW,
        self::ANALYTICS_VIEW,
        self::SETTINGS_MANAGE,
    ];
}
