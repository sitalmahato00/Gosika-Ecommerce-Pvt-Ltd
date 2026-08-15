<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $addUuid = [
        'store_operating_hours',
        'product_images',
        'product_attributes',
        'product_attribute_values',
        'wishlists',
        'wishlist_items',
        'recently_viewed',
        'cart_items',
        'order_items',
        'order_status_history',
        'payment_attempts',
        'payment_status_history',
        'vendor_wallets',
        'payout_records',
        'delivery_tracking',
        'coupon_redemptions',
        'activity_logs',
        'notification_templates',
        'banners',
        'ticket_messages',
    ];

    private array $addBlame = [
        'countries',
        'provinces',
        'districts',
        'municipalities',
        'vendors',
        'vendor_kycs',
        'vendor_documents',
        'stores',
        'store_addresses',
        'store_operating_hours',
        'bank_accounts',
        'categories',
        'brands',
        'brand_requests',
        'product_images',
        'product_variants',
        'product_attributes',
        'product_attribute_values',
        'customer_profiles',
        'customer_addresses',
        'wishlists',
        'wishlist_items',
        'recently_viewed',
        'product_reviews',
        'store_reviews',
        'carts',
        'cart_items',
        'checkout_sessions',
        'orders',
        'vendor_orders',
        'order_items',
        'order_status_history',
        'return_requests',
        'payments',
        'payment_attempts',
        'payment_status_history',
        'refunds',
        'reconciliation_records',
        'vendor_wallets',
        'wallet_transactions',
        'commissions',
        'settlements',
        'payout_requests',
        'payout_records',
        'delivery_partners',
        'delivery_assignments',
        'delivery_tracking',
        'coupons',
        'coupon_redemptions',
        'audit_logs',
        'activity_logs',
        'notification_templates',
        'banners',
        'support_tickets',
        'ticket_messages',
    ];

    private array $addDeletedBy = [
        'vendors',
        'stores',
        'bank_accounts',
        'categories',
        'brands',
        'products',
        'product_variants',
        'customer_addresses',
        'orders',
        'vendor_orders',
        'payments',
        'coupons',
        'delivery_partners',
        'banners',
    ];

    public function up(): void
    {
        foreach ($this->addUuid as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->uuid('uuid')->nullable();
            });
        }

        foreach ($this->addBlame as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
            });
        }

        foreach ($this->addDeletedBy as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->unsignedBigInteger('deleted_by')->nullable();
            });
        }

        foreach ($this->addUuid as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->unique(['uuid'], $table.'_uuid_unique');
            });
        }
    }

    public function down(): void
    {
        foreach ($this->addUuid as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropIndex($table->getTable().'_uuid_unique');
                $table->dropColumn('uuid');
            });
        }

        foreach ($this->addBlame as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn(['created_by', 'updated_by']);
            });
        }

        foreach ($this->addDeletedBy as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('deleted_by');
            });
        }
    }
};
