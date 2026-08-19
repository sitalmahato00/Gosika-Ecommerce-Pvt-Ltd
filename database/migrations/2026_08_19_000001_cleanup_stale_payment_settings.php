<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->whereIn('key', [
            'payment.esewa_success_url',
            'payment.esewa_failure_url',
            'payment.khalti_base_url',
            'payment.khalti_return_url',
            'payment.khalti_website_url',
        ])->delete();
    }
};
