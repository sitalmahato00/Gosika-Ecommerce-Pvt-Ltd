<?php

namespace Database\Seeders;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\SettlementStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shared\Domain\Enums\WalletTransactionType;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Infrastructure\Models\PayoutRecord;
use App\Modules\Wallet\Infrastructure\Models\PayoutRequest;
use App\Modules\Wallet\Infrastructure\Models\Settlement;
use App\Modules\Wallet\Infrastructure\Models\VendorWallet;
use App\Modules\Wallet\Infrastructure\Models\WalletTransaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DemoFinanceSeeder extends Seeder
{
    private const SEED_TAG = 'demo_finance_v1';

    private User $admin;

    public function run(): void
    {
        $this->admin = User::query()->role(Roles::SUPER_ADMIN)->first()
            ?? User::query()->first();

        $primary = Vendor::query()->where('business_email', 'vendor@gosika.com.np')->first()
            ?? Vendor::query()->first();

        if (! $primary) {
            $this->command?->warn('No vendors found. DemoFinanceSeeder skipped.');
            return;
        }

        $this->seedVendor(...$this->himalayanHandicrafts($primary));

        $this->seedVendor(...$this->mechiOrganics());
        $this->seedVendor(...$this->bhaktapurPottery());
        $this->seedVendor(...$this->sagarmathaSouvenirs());

        $this->command?->info('Demo finance ledger seeded: wallets, settlements, payout requests and transactions.');
    }

    protected function seedVendor(array $vendorPost, array $settlements, array $payouts, array $transactions): void
    {
        $vendorUser = User::query()->updateOrCreate(
            ['email' => $vendorPost['business_email']],
            [
                'first_name' => $vendorPost['first_name'],
                'last_name' => $vendorPost['last_name'],
                'phone' => $vendorPost['business_phone'],
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'status' => UserStatus::ACTIVE,
            ]
        );
        $vendorUser->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->updateOrCreate(
            ['business_email' => $vendorPost['business_email']],
            [
                'user_id' => $vendorUser->id,
                'company_name' => $vendorPost['company_name'],
                'business_phone' => $vendorPost['business_phone'],
                'pan_vat' => $vendorPost['pan_vat'],
                'commission_rate' => 10,
                'status' => VendorStatus::APPROVED,
                'approved_by' => $this->admin->id,
                'approved_at' => now(),
            ]
        );

        $bank = BankAccount::query()->updateOrCreate(
            ['vendor_id' => $vendor->id, 'account_number' => $vendorPost['account_number']],
            [
                'bank_name' => $vendorPost['bank_name'],
                'branch_name' => $vendorPost['branch_name'],
                'account_name' => $vendorPost['account_name'],
                'account_type' => 'savings',
                'is_verified' => true,
                'is_default' => true,
            ]
        );

        $walletModel = VendorWallet::query()->updateOrCreate(
            ['vendor_id' => $vendor->id],
            [
                'balance' => 0,
                'available_balance' => 0,
                'pending_balance' => 0,
                'currency' => 'NPR',
                'version' => 1,
            ]
        );

        $settlementMap = [];
        foreach ($settlements as $seed) {
            $settlement = Settlement::query()->updateOrCreate(
                ['settlement_number' => $seed['number']],
                [
                    'vendor_id' => $vendor->id,
                    'period_start' => $seed['period_start'],
                    'period_end' => $seed['period_end'],
                    'gross_sales' => $seed['gross_sales'],
                    'commission_total' => $seed['commission_total'],
                    'refunds_total' => $seed['refunds_total'],
                    'adjustments_total' => $seed['adjustments_total'],
                    'net_payable' => $seed['net_payable'],
                    'status' => $seed['status'],
                    'hold_reason' => $seed['hold_reason'] ?? null,
                    'generated_at' => $seed['generated_at'],
                    'paid_at' => $seed['paid_at'] ?? null,
                    'meta' => ['seeded_by' => self::SEED_TAG],
                ]
            );
            $settlementMap[$seed['number']] = $settlement;
        }

        $payoutMap = [];
        foreach ($payouts as $seed) {
            $payout = PayoutRequest::query()->updateOrCreate(
                ['payout_number' => $seed['number']],
                [
                    'vendor_id' => $vendor->id,
                    'settlement_id' => isset($seed['settlement']) ? $settlementMap[$seed['settlement']]->id : null,
                    'wallet_id' => $walletModel->id,
                    'bank_account_id' => $bank->id,
                    'amount' => $seed['amount'],
                    'status' => $seed['status'],
                    'requested_at' => $seed['requested_at'],
                    'approved_by' => $seed['approved_by'] ?? $this->admin->id,
                    'approved_at' => $seed['approved_at'] ?? null,
                    'rejection_reason' => $seed['rejection_reason'] ?? null,
                    'paid_at' => $seed['paid_at'] ?? null,
                    'meta' => ['seeded_by' => self::SEED_TAG],
                ]
            );
            $payoutMap[$seed['number']] = $payout;

            if (isset($seed['record'])) {
                PayoutRecord::query()->updateOrCreate(
                    ['payout_request_id' => $payout->id],
                    [
                        'provider_reference' => $seed['record']['provider_reference'],
                        'amount' => $seed['amount'],
                        'fee' => $seed['record']['fee'],
                        'net_amount' => $seed['amount'] - $seed['record']['fee'],
                        'status' => $seed['record']['status'],
                        'paid_at' => $seed['paid_at'] ?? now(),
                        'meta' => ['seeded_by' => self::SEED_TAG],
                    ]
                );
            }
        }

        WalletTransaction::query()
            ->where('wallet_id', $walletModel->id)
            ->where('meta->seeded_by', self::SEED_TAG)
            ->delete();

        $running = 0;
        foreach ($transactions as $seed) {
            $before = $running;
            $running += $seed['amount'];
            WalletTransaction::query()->create([
                'wallet_id' => $walletModel->id,
                'transaction_type' => $seed['type'],
                'reference_type' => isset($seed['reference']) ? (str_starts_with($seed['reference'], 'STL') ? 'settlement' : 'payout') : null,
                'reference_id' => isset($seed['reference'])
                    ? (isset($settlementMap[$seed['reference']]) ? $settlementMap[$seed['reference']]->id : $payoutMap[$seed['reference']]->id)
                    : null,
                'amount' => $seed['amount'],
                'balance_before' => $before,
                'balance_after' => $running,
                'status' => 'completed',
                'description' => $seed['description'],
                'meta' => ['seeded_by' => self::SEED_TAG],
            ]);
        }

        $activePayoutStatuses = [
            \App\Modules\Shared\Domain\Enums\PayoutStatus::PENDING->value,
            \App\Modules\Shared\Domain\Enums\PayoutStatus::APPROVED->value,
            \App\Modules\Shared\Domain\Enums\PayoutStatus::PROCESSING->value,
        ];

        $settlementModels = Settlement::query()->where('vendor_id', $vendor->id)->get();
        $payoutModels = PayoutRequest::query()->where('vendor_id', $vendor->id)->get();

        $pending = 0.0;
        foreach ($settlementModels as $settlement) {
            if ($settlement->status->value === SettlementStatus::HOLD->value) {
                $pending += (float) $settlement->net_payable;
                continue;
            }

            if ($settlement->status->value !== SettlementStatus::ELIGIBLE->value) {
                continue;
            }

            $hasActivePayout = $payoutModels
                ->where('settlement_id', $settlement->id)
                ->contains(fn ($payout) => in_array($payout->status->value, $activePayoutStatuses, true));

            if (! $hasActivePayout) {
                $pending += (float) $settlement->net_payable;
            }
        }

        $available = 0.0;
        foreach ($transactions as $seed) {
            if (in_array($seed['type'], [
                WalletTransactionType::CREDIT_ADJUSTMENT->value,
                WalletTransactionType::DEBIT_ADJUSTMENT->value,
            ], true) && ! isset($seed['reference'])) {
                $available += (float) $seed['amount'];
            }
        }

        $walletModel->update([
            'pending_balance' => round($pending, 2),
            'available_balance' => round($available, 2),
            'balance' => round($pending + $available, 2),
        ]);
    }

    protected function himalayanHandicrafts(Vendor $primary): array
    {
        return [
            'vendorPost' => [
                'business_email' => $primary->business_email,
                'company_name' => $primary->company_name,
                'business_phone' => $primary->business_phone ?? '9800000003',
                'pan_vat' => $primary->pan_vat ?? '301234567',
                'first_name' => 'Himalayan',
                'last_name' => 'Handicrafts',
                'bank_name' => 'Nepal Bank Limited',
                'branch_name' => 'Boudhanath',
                'account_name' => 'Himalayan Handicrafts',
                'account_number' => '0098123456789',
            ],
            'settlements' => [
                [
                    'number' => 'STL-202606-01', 'period_start' => Carbon::parse('2026-06-01'), 'period_end' => Carbon::parse('2026-06-30'),
                    'gross_sales' => 350000, 'commission_total' => 42000, 'refunds_total' => 1500, 'adjustments_total' => 0,
                    'net_payable' => 306500, 'status' => SettlementStatus::PAID,
                    'generated_at' => Carbon::parse('2026-07-01 08:00'), 'paid_at' => Carbon::parse('2026-07-03 10:00'),
                ],
                [
                    'number' => 'STL-202607-01', 'period_start' => Carbon::parse('2026-07-01'), 'period_end' => Carbon::parse('2026-07-31'),
                    'gross_sales' => 210000, 'commission_total' => 25200, 'refunds_total' => 800, 'adjustments_total' => 1000,
                    'net_payable' => 185000, 'status' => SettlementStatus::PROCESSING,
                    'generated_at' => Carbon::parse('2026-08-01 08:00'),
                ],
                [
                    'number' => 'STL-202608-01', 'period_start' => Carbon::parse('2026-08-01'), 'period_end' => Carbon::parse('2026-08-15'),
                    'gross_sales' => 168000, 'commission_total' => 20160, 'refunds_total' => 0, 'adjustments_total' => 0,
                    'net_payable' => 147840, 'status' => SettlementStatus::ELIGIBLE,
                    'generated_at' => Carbon::parse('2026-08-16 08:00'),
                ],
                [
                    'number' => 'STL-202608-02', 'period_start' => Carbon::parse('2026-08-16'), 'period_end' => Carbon::parse('2026-08-31'),
                    'gross_sales' => 95000, 'commission_total' => 11400, 'refunds_total' => 12000, 'adjustments_total' => 0,
                    'net_payable' => 71600, 'status' => SettlementStatus::HOLD,
                    'generated_at' => Carbon::parse('2026-09-01 08:00'),
                    'hold_reason' => 'Return rate spike in late August; funds withheld pending reconciliation.',
                ],
                [
                    'number' => 'STL-202609-01', 'period_start' => Carbon::parse('2026-09-01'), 'period_end' => Carbon::parse('2026-09-07'),
                    'gross_sales' => 130000, 'commission_total' => 15600, 'refunds_total' => 2000, 'adjustments_total' => -1000,
                    'net_payable' => 111400, 'status' => SettlementStatus::ELIGIBLE,
                    'generated_at' => Carbon::parse('2026-09-08 08:00'),
                ],
            ],
            'payouts' => [
                [
                    'number' => 'POUT-202606-01', 'amount' => 75000, 'settlement' => 'STL-202606-01', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::PAID,
                    'requested_at' => Carbon::parse('2026-07-04 09:00'), 'approved_at' => Carbon::parse('2026-07-05 15:00'), 'paid_at' => Carbon::parse('2026-07-06 10:30'),
                    'record' => ['provider_reference' => 'NBL-2026070061', 'fee' => 150, 'status' => 'completed'],
                ],
                [
                    'number' => 'POUT-202607-01', 'amount' => 105000, 'settlement' => 'STL-202606-01', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::PAID,
                    'requested_at' => Carbon::parse('2026-07-20 09:00'), 'approved_at' => Carbon::parse('2026-07-21 15:00'), 'paid_at' => Carbon::parse('2026-07-22 10:30'),
                    'record' => ['provider_reference' => 'NBL-2026070207', 'fee' => 210, 'status' => 'completed'],
                ],
                [
                    'number' => 'POUT-202608-01', 'amount' => 185000, 'settlement' => 'STL-202607-01', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::APPROVED,
                    'requested_at' => Carbon::parse('2026-08-05 10:00'), 'approved_at' => Carbon::parse('2026-08-06 14:00'),
                ],
                [
                    'number' => 'POUT-202609-01', 'amount' => 147840, 'settlement' => 'STL-202608-01', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::PENDING,
                    'requested_at' => Carbon::parse('2026-09-08 09:00'),
                ],
                [
                    'number' => 'POUT-202609-02', 'amount' => 111400, 'settlement' => 'STL-202609-01', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::REJECTED,
                    'requested_at' => Carbon::parse('2026-09-09 09:00'),
                    'rejection_reason' => 'Vendor bank account name mismatch; PAN/KYC re-verification required before disbursement.',
                ],
            ],
            'transactions' => [
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 306500, 'description' => 'Settlement STL-202606-01 paid out', 'reference' => 'STL-202606-01'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 185000, 'description' => 'Settlement STL-202607-01 eligible — awaiting payout request', 'reference' => 'STL-202607-01'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -185000, 'description' => 'Payout POUT-202608-01 approved — funds reserved', 'reference' => 'POUT-202608-01'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 147840, 'description' => 'Settlement STL-202608-01 eligible — awaiting payout request', 'reference' => 'STL-202608-01'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -147840, 'description' => 'Payout POUT-202609-01 pending — funds reserved', 'reference' => 'POUT-202609-01'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 71600, 'description' => 'Settlement STL-202608-02 placed on hold', 'reference' => 'STL-202608-02'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 111400, 'description' => 'Settlement STL-202609-01 eligible — awaiting payout request', 'reference' => 'STL-202609-01'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -111400, 'description' => 'Payout POUT-202609-02 pending — funds reserved', 'reference' => 'POUT-202609-02'],
                ['type' => WalletTransactionType::CREDIT_ADJUSTMENT, 'amount' => 111400, 'description' => 'Payout POUT-202609-02 rejected — returned to pending', 'reference' => 'POUT-202609-02'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -75000, 'description' => 'Payout POUT-202606-01 disbursed', 'reference' => 'POUT-202606-01'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -105000, 'description' => 'Payout POUT-202607-01 disbursed', 'reference' => 'POUT-202607-01'],
                ['type' => WalletTransactionType::DEBIT_REFUND, 'amount' => -1600, 'description' => 'Customer return refund'],
                ['type' => WalletTransactionType::CREDIT_ADJUSTMENT, 'amount' => 6000, 'description' => 'Festive season incentive credit'],
            ],
        ];
    }

    protected function mechiOrganics(): array
    {
        return [
            'vendorPost' => [
                'business_email' => 'mechiorganics@gosika.com.np',
                'company_name' => 'Mechi Organics',
                'business_phone' => '9810000011',
                'pan_vat' => '502345678',
                'first_name' => 'Mechi',
                'last_name' => 'Organics',
                'bank_name' => 'Agricultural Development Bank',
                'branch_name' => 'Birtamode',
                'account_name' => 'Mechi Organics Pvt Ltd',
                'account_number' => '0098234567891',
            ],
            'settlements' => [
                [
                    'number' => 'STL-202606-02', 'period_start' => Carbon::parse('2026-06-01'), 'period_end' => Carbon::parse('2026-06-30'),
                    'gross_sales' => 120000, 'commission_total' => 14400, 'refunds_total' => 2500, 'adjustments_total' => 0,
                    'net_payable' => 103100, 'status' => SettlementStatus::PAID,
                    'generated_at' => Carbon::parse('2026-07-01 08:00'), 'paid_at' => Carbon::parse('2026-07-10 11:30'),
                ],
                [
                    'number' => 'STL-202607-02', 'period_start' => Carbon::parse('2026-07-01'), 'period_end' => Carbon::parse('2026-07-31'),
                    'gross_sales' => 90000, 'commission_total' => 10800, 'refunds_total' => 0, 'adjustments_total' => 0,
                    'net_payable' => 79200, 'status' => SettlementStatus::PROCESSING,
                    'generated_at' => Carbon::parse('2026-08-01 08:00'),
                ],
                [
                    'number' => 'STL-202608-03', 'period_start' => Carbon::parse('2026-08-01'), 'period_end' => Carbon::parse('2026-08-31'),
                    'gross_sales' => 75000, 'commission_total' => 9000, 'refunds_total' => 0, 'adjustments_total' => 0,
                    'net_payable' => 66000, 'status' => SettlementStatus::ELIGIBLE,
                    'generated_at' => Carbon::parse('2026-09-01 08:00'),
                ],
            ],
            'payouts' => [
                [
                    'number' => 'POUT-202607-02', 'amount' => 55000, 'settlement' => 'STL-202606-02', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::PAID,
                    'requested_at' => Carbon::parse('2026-07-12 10:00'), 'approved_at' => Carbon::parse('2026-07-13 15:00'), 'paid_at' => Carbon::parse('2026-07-14 09:30'),
                    'record' => ['provider_reference' => 'ADBL-2026070144', 'fee' => 110, 'status' => 'completed'],
                ],
                [
                    'number' => 'POUT-202608-02', 'amount' => 79200, 'settlement' => 'STL-202607-02', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::APPROVED,
                    'requested_at' => Carbon::parse('2026-08-06 09:00'),
                    'record' => ['provider_reference' => 'ADBL-2026080112', 'fee' => 80, 'status' => 'processing'],
                ],
                [
                    'number' => 'POUT-202609-03', 'amount' => 66000, 'settlement' => 'STL-202608-03', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::PENDING,
                    'requested_at' => Carbon::parse('2026-09-02 11:00'),
                ],
            ],
            'transactions' => [
                ['type' => WalletTransactionType::CREDIT_EARNINGS, 'amount' => 150000, 'description' => 'Accumulated June–July order earnings'],
                ['type' => WalletTransactionType::DEBIT_COMMISSION, 'amount' => -18000, 'description' => 'Platform commission'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 103100, 'description' => 'Settlement STL-202606-02 paid out', 'reference' => 'STL-202606-02'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -55000, 'description' => 'Payout POUT-202607-02 disbursed', 'reference' => 'POUT-202607-02'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 79200, 'description' => 'Settlement STL-202607-02 eligible — awaiting payout request', 'reference' => 'STL-202607-02'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -79200, 'description' => 'Payout POUT-202608-02 approved — funds reserved', 'reference' => 'POUT-202608-02'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 66000, 'description' => 'Settlement STL-202608-03 eligible — awaiting payout request', 'reference' => 'STL-202608-03'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -66000, 'description' => 'Payout POUT-202609-03 pending — funds reserved', 'reference' => 'POUT-202609-03'],
                ['type' => WalletTransactionType::DEBIT_REFUND, 'amount' => -4500, 'description' => 'Customer return refund'],
                ['type' => WalletTransactionType::DEBIT_ADJUSTMENT, 'amount' => -3000, 'description' => 'Logistics service chargeback'],
                ['type' => WalletTransactionType::CREDIT_ADJUSTMENT, 'amount' => 5000, 'description' => 'Seasonal supply incentive credit'],
            ],
        ];
    }

    protected function bhaktapurPottery(): array
    {
        return [
            'vendorPost' => [
                'business_email' => 'pottery@gosika.com.np',
                'company_name' => 'Bhaktapur Pottery House',
                'business_phone' => '9810000022',
                'pan_vat' => '302345678',
                'first_name' => 'Bhaktapur',
                'last_name' => 'Pottery',
                'bank_name' => 'NIC Asia Bank',
                'branch_name' => 'Bhaktapur',
                'account_name' => 'Bhaktapur Pottery House',
                'account_number' => '0098456789012',
            ],
            'settlements' => [
                [
                    'number' => 'STL-202606-03', 'period_start' => Carbon::parse('2026-06-01'), 'period_end' => Carbon::parse('2026-06-30'),
                    'gross_sales' => 29000, 'commission_total' => 3480, 'refunds_total' => 220, 'adjustments_total' => 0,
                    'net_payable' => 25300, 'status' => SettlementStatus::PAID,
                    'generated_at' => Carbon::parse('2026-07-01 08:00'), 'paid_at' => Carbon::parse('2026-07-15 10:00'),
                ],
                [
                    'number' => 'STL-202607-03', 'period_start' => Carbon::parse('2026-07-01'), 'period_end' => Carbon::parse('2026-07-31'),
                    'gross_sales' => 23000, 'commission_total' => 2760, 'refunds_total' => 540, 'adjustments_total' => 0,
                    'net_payable' => 19700, 'status' => SettlementStatus::PAID,
                    'generated_at' => Carbon::parse('2026-08-01 08:00'), 'paid_at' => Carbon::parse('2026-08-15 10:00'),
                ],
            ],
            'payouts' => [
                [
                    'number' => 'POUT-202607-03', 'amount' => 30000, 'settlement' => 'STL-202606-03', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::PAID,
                    'requested_at' => Carbon::parse('2026-07-18 09:00'), 'approved_at' => Carbon::parse('2026-07-19 14:00'), 'paid_at' => Carbon::parse('2026-07-20 11:00'),
                    'record' => ['provider_reference' => 'NICA-2026070318', 'fee' => 60, 'status' => 'completed'],
                ],
                [
                    'number' => 'POUT-202608-03', 'amount' => 15000, 'settlement' => 'STL-202607-03', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::PAID,
                    'requested_at' => Carbon::parse('2026-08-16 09:00'), 'approved_at' => Carbon::parse('2026-08-17 14:00'), 'paid_at' => Carbon::parse('2026-08-18 11:00'),
                    'record' => ['provider_reference' => 'NICA-2026080322', 'fee' => 30, 'status' => 'completed'],
                ],
            ],
            'transactions' => [
                ['type' => WalletTransactionType::CREDIT_EARNINGS, 'amount' => 80000, 'description' => 'Accumulated June–July order earnings'],
                ['type' => WalletTransactionType::DEBIT_COMMISSION, 'amount' => -9600, 'description' => 'Platform commission'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 20000, 'description' => 'Settlement STL-202606-03 part credit', 'reference' => 'STL-202606-03'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -30000, 'description' => 'Payout POUT-202607-03 disbursed', 'reference' => 'POUT-202607-03'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 5300, 'description' => 'Settlement STL-202606-03 final credit', 'reference' => 'STL-202606-03'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 19700, 'description' => 'Settlement STL-202607-03 credit', 'reference' => 'STL-202607-03'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -15000, 'description' => 'Payout POUT-202608-03 disbursed', 'reference' => 'POUT-202608-03'],
                ['type' => WalletTransactionType::CREDIT_ADJUSTMENT, 'amount' => 2000, 'description' => 'Pottery workshop incentive credit'],
            ],
        ];
    }

    protected function sagarmathaSouvenirs(): array
    {
        return [
            'vendorPost' => [
                'business_email' => 'souvenirs@gosika.com.np',
                'company_name' => 'Sagarmatha Souvenirs',
                'business_phone' => '9810000033',
                'pan_vat' => '602345678',
                'first_name' => 'Sagarmatha',
                'last_name' => 'Souvenirs',
                'bank_name' => 'Global IME Bank',
                'branch_name' => 'Lakeside, Pokhara',
                'account_name' => 'Sagarmatha Souvenirs',
                'account_number' => '0098678901234',
            ],
            'settlements' => [
                [
                    'number' => 'STL-202606-04', 'period_start' => Carbon::parse('2026-06-01'), 'period_end' => Carbon::parse('2026-06-30'),
                    'gross_sales' => 150000, 'commission_total' => 18000, 'refunds_total' => 4000, 'adjustments_total' => 0,
                    'net_payable' => 128000, 'status' => SettlementStatus::PAID,
                    'generated_at' => Carbon::parse('2026-07-01 08:00'), 'paid_at' => Carbon::parse('2026-07-10 12:00'),
                ],
                [
                    'number' => 'STL-202607-04', 'period_start' => Carbon::parse('2026-07-01'), 'period_end' => Carbon::parse('2026-07-31'),
                    'gross_sales' => 60000, 'commission_total' => 7200, 'refunds_total' => 800, 'adjustments_total' => 0,
                    'net_payable' => 52000, 'status' => SettlementStatus::PAID,
                    'generated_at' => Carbon::parse('2026-08-01 08:00'), 'paid_at' => Carbon::parse('2026-08-10 12:00'),
                ],
                [
                    'number' => 'STL-202608-04', 'period_start' => Carbon::parse('2026-08-01'), 'period_end' => Carbon::parse('2026-08-31'),
                    'gross_sales' => 24000, 'commission_total' => 2880, 'refunds_total' => 120, 'adjustments_total' => 0,
                    'net_payable' => 21000, 'status' => SettlementStatus::HOLD,
                    'generated_at' => Carbon::parse('2026-09-01 08:00'),
                    'hold_reason' => 'Bank KYC re-verification in progress for Pokhara outlet; funds withheld until documents are updated.',
                ],
            ],
            'payouts' => [
                [
                    'number' => 'POUT-202607-04', 'amount' => 100000, 'settlement' => 'STL-202606-04', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::PAID,
                    'requested_at' => Carbon::parse('2026-07-12 10:00'), 'approved_at' => Carbon::parse('2026-07-13 16:00'), 'paid_at' => Carbon::parse('2026-07-14 10:30'),
                    'record' => ['provider_reference' => 'GIBL-2026070119', 'fee' => 200, 'status' => 'completed'],
                ],
                [
                    'number' => 'POUT-202608-04', 'amount' => 60000, 'settlement' => 'STL-202607-04', 'status' => \App\Modules\Shared\Domain\Enums\PayoutStatus::PAID,
                    'requested_at' => Carbon::parse('2026-08-12 10:00'), 'approved_at' => Carbon::parse('2026-08-13 16:00'), 'paid_at' => Carbon::parse('2026-08-14 10:30'),
                    'record' => ['provider_reference' => 'GIBL-2026080127', 'fee' => 120, 'status' => 'completed'],
                ],
            ],
            'transactions' => [
                ['type' => WalletTransactionType::CREDIT_EARNINGS, 'amount' => 220000, 'description' => 'Accumulated June–July order earnings'],
                ['type' => WalletTransactionType::DEBIT_COMMISSION, 'amount' => -26400, 'description' => 'Platform commission'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 128000, 'description' => 'Settlement STL-202606-04 credit', 'reference' => 'STL-202606-04'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -100000, 'description' => 'Payout POUT-202607-04 disbursed', 'reference' => 'POUT-202607-04'],
                ['type' => WalletTransactionType::DEBIT_REFUND, 'amount' => -3600, 'description' => 'Customer return refund'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 52000, 'description' => 'Settlement STL-202607-04 credit', 'reference' => 'STL-202607-04'],
                ['type' => WalletTransactionType::DEBIT_WITHDRAWAL, 'amount' => -60000, 'description' => 'Payout POUT-202608-04 disbursed', 'reference' => 'POUT-202608-04'],
                ['type' => WalletTransactionType::CREDIT_SETTLEMENT, 'amount' => 21000, 'description' => 'Settlement STL-202608-04 placed on hold', 'reference' => 'STL-202608-04'],
                ['type' => WalletTransactionType::CREDIT_ADJUSTMENT, 'amount' => 8000, 'description' => 'Peak season performance bonus'],
            ],
        ];
    }
}