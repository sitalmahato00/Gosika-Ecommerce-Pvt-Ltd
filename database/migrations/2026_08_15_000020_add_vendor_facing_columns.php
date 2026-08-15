<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            if (! Schema::hasColumn('support_tickets', 'vendor_id')) {
                $table->foreignId('vendor_id')->nullable()->after('id')->constrained()->nullOnDelete();
                $table->index('vendor_id');
            }
        });

        Schema::table('coupons', function (Blueprint $table) {
            if (! Schema::hasColumn('coupons', 'vendor_id')) {
                $table->foreignId('vendor_id')->nullable()->after('id')->constrained()->nullOnDelete();
                $table->index('vendor_id');
            }
        });

        Schema::table('return_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('return_requests', 'vendor_id')) {
                $table->foreignId('vendor_id')->nullable()->after('id')->constrained()->nullOnDelete();
                $table->index('vendor_id');
            }
        });

        Schema::table('product_reviews', function (Blueprint $table) {
            if (! Schema::hasColumn('product_reviews', 'reply')) {
                $table->text('reply')->nullable()->after('body');
                $table->unsignedBigInteger('replied_by')->nullable()->after('reply');
                $table->timestamp('replied_at')->nullable()->after('replied_by');
            }
        });

        Schema::table('store_reviews', function (Blueprint $table) {
            if (! Schema::hasColumn('store_reviews', 'reply')) {
                $table->text('reply')->nullable()->after('body');
                $table->unsignedBigInteger('replied_by')->nullable()->after('reply');
                $table->timestamp('replied_at')->nullable()->after('replied_by');
            }
        });

        Schema::table('stores', function (Blueprint $table) {
            if (! Schema::hasColumn('stores', 'settings')) {
                $table->json('settings')->nullable()->after('rejection_reason');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn('settings');
        });
        Schema::table('store_reviews', function (Blueprint $table) {
            $table->dropColumn(['reply', 'replied_by', 'replied_at']);
        });
        Schema::table('product_reviews', function (Blueprint $table) {
            $table->dropColumn(['reply', 'replied_by', 'replied_at']);
        });
        Schema::table('return_requests', function (Blueprint $table) {
            $table->dropColumn('vendor_id');
        });
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn('vendor_id');
        });
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn('vendor_id');
        });
    }
};
