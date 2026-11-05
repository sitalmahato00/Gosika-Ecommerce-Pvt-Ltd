<?php

namespace App\Modules\Analytics\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Payment\Infrastructure\Models\Refund;
use App\Modules\Wallet\Infrastructure\Models\PayoutRequest;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminExportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('ensure:admin');
        $this->middleware('permission:' . Permissions::ANALYTICS_VIEW);
    }

    /**
     * Export orders as CSV.
     * Query params: range (7d|30d|90d|365d|year), status (optional)
     */
    public function orders(Request $request): StreamedResponse
    {
        $from = $this->fromDate($request->input('range', '30d'));
        $status = $request->input('status');

        $query = Order::query()
            ->with(['user'])
            ->where('created_at', '>=', $from)
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderByDesc('created_at');

        $filename = 'gosika-orders-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'Order #', 'Date', 'Customer Name', 'Customer Email',
                'Payment Method', 'Payment Status', 'Order Status',
                'Subtotal', 'Discount', 'Delivery Charge', 'Tax', 'Grand Total', 'Currency',
            ]);

            $query->chunk(200, function ($orders) use ($handle) {
                foreach ($orders as $order) {
                    fputcsv($handle, [
                        $order->order_number ?? $order->id,
                        optional($order->placed_at ?? $order->created_at)->format('Y-m-d H:i'),
                        trim(($order->user->first_name ?? '') . ' ' . ($order->user->last_name ?? '')),
                        $order->user->email ?? '',
                        $order->payment_method ?? '',
                        $order->payment_status instanceof \BackedEnum
                            ? $order->payment_status->value
                            : ($order->payment_status ?? ''),
                        $order->status instanceof \BackedEnum
                            ? $order->status->value
                            : ($order->status ?? ''),
                        number_format((float) $order->subtotal, 2, '.', ''),
                        number_format((float) $order->discount, 2, '.', ''),
                        number_format((float) $order->delivery_charge, 2, '.', ''),
                        number_format((float) $order->tax, 2, '.', ''),
                        number_format((float) $order->grand_total, 2, '.', ''),
                        $order->currency ?? 'NPR',
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Export vendor payouts as CSV.
     * Query params: range (7d|30d|90d|365d|year)
     */
    public function payouts(Request $request): StreamedResponse
    {
        $from = $this->fromDate($request->input('range', '30d'));

        $query = PayoutRequest::query()
            ->with(['vendor.user'])
            ->where('created_at', '>=', $from)
            ->orderByDesc('created_at');

        $filename = 'gosika-payouts-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'Payout #', 'Date Requested', 'Vendor Company', 'Vendor Email',
                'Amount (NPR)', 'Status', 'Paid At',
            ]);

            $query->chunk(200, function ($payouts) use ($handle) {
                foreach ($payouts as $payout) {
                    fputcsv($handle, [
                        $payout->payout_number ?? $payout->id,
                        optional($payout->requested_at ?? $payout->created_at)->format('Y-m-d H:i'),
                        $payout->vendor?->company_name ?? $payout->vendor?->user?->first_name ?? '',
                        $payout->vendor?->business_email ?? $payout->vendor?->user?->email ?? '',
                        number_format((float) $payout->amount, 2, '.', ''),
                        $payout->status instanceof \BackedEnum
                            ? $payout->status->value
                            : ($payout->status ?? ''),
                        optional($payout->paid_at)->format('Y-m-d H:i') ?? '',
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Export refunds as CSV.
     * Query params: range (7d|30d|90d|365d|year)
     */
    public function refunds(Request $request): StreamedResponse
    {
        $from = $this->fromDate($request->input('range', '30d'));

        $query = Refund::query()
            ->with(['order.user'])
            ->where('created_at', '>=', $from)
            ->orderByDesc('created_at');

        $filename = 'gosika-refunds-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'Refund #', 'Order #', 'Date', 'Customer Name', 'Customer Email',
                'Amount (NPR)', 'Status', 'Reason', 'Completed At',
            ]);

            $query->chunk(200, function ($refunds) use ($handle) {
                foreach ($refunds as $refund) {
                    fputcsv($handle, [
                        $refund->refund_number ?? $refund->id,
                        $refund->order?->order_number ?? $refund->order_id,
                        optional($refund->initiated_at ?? $refund->created_at)->format('Y-m-d H:i'),
                        trim(($refund->order?->user?->first_name ?? '') . ' ' . ($refund->order?->user?->last_name ?? '')),
                        $refund->order?->user?->email ?? '',
                        number_format((float) $refund->amount, 2, '.', ''),
                        $refund->status instanceof \BackedEnum
                            ? $refund->status->value
                            : ($refund->status ?? ''),
                        $refund->reason ?? '',
                        optional($refund->completed_at)->format('Y-m-d H:i') ?? '',
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function fromDate(string $range): \Carbon\Carbon
    {
        return match ($range) {
            '7d'   => now()->subDays(7),
            '90d'  => now()->subDays(90),
            '365d' => now()->subDays(365),
            'year' => now()->startOfYear(),
            default => now()->subDays(30), // 30d and anything unrecognised
        };
    }
}
