<?php

namespace App\Modules\Identity\Domain;

final class Roles
{
    public const SUPER_ADMIN = 'super_admin';
    public const VENDOR_ADMIN = 'vendor_admin';
    public const DELIVERY_PARTNER = 'delivery_partner';
    public const CUSTOMER = 'customer';

    public const ALL = [
        self::SUPER_ADMIN,
        self::VENDOR_ADMIN,
        self::DELIVERY_PARTNER,
        self::CUSTOMER,
    ];
}
