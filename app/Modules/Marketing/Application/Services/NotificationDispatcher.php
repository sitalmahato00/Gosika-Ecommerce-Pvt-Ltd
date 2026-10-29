<?php

namespace App\Modules\Marketing\Application\Services;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Infrastructure\Models\AdminNotification;
use App\Modules\Marketing\Infrastructure\Models\CustomerNotification;
use App\Modules\Marketing\Infrastructure\Models\DeliveryNotification;
use App\Modules\Marketing\Infrastructure\Models\VendorNotification;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Infrastructure\Models\Settlement;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Central dispatcher that fans out branded emails and in-app notifications
 * across the customer, vendor, admin, and delivery portals.
 */
class NotificationDispatcher
{
    public function emailVerificationCode(User $user, string $code): void
    {
        $this->email($user->email, new \App\Modules\Marketing\Application\Mail\EmailVerificationMail($user, $code));
    }

    public function passwordResetOtp(User $user, string $code): void
    {
        $this->email($user->email, new \App\Modules\Marketing\Application\Mail\PasswordResetOtpMail($user, $code));
    }

    public function orderConfirmation(Order $order): void
    {
        $order->loadMissing('user');

        if (! $order->user) {
            return;
        }

        $this->email($order->user->email, new \App\Modules\Marketing\Application\Mail\OrderConfirmationMail($order));
        $this->customer($order->user, 'order', 'Order '.$order->order_number.' confirmed', 'Your order has been placed and is being processed by our sellers.', [
            'link' => 'account/orders/'.$order->uuid,
        ]);
    }

    /**
     * Order delivery status updates for the customer (picked_up / out_for_delivery).
     */
    public function orderDeliveryUpdate(VendorOrder $vendorOrder, string $status): void
    {
        $vendorOrder->loadMissing('order.user', 'order.vendorOrders');

        $order = $vendorOrder->order;
        if (! $order || ! $order->user) {
            return;
        }

        $deliveredStates = [OrderStatus::DELIVERED->value, OrderStatus::COMPLETED->value];

        // Only announce the final delivery once every part of the order is delivered.
        // The invoice email carries the full delivered confirmation for the whole order.
        if ($status === 'delivered') {
            $allDelivered = $order->vendorOrders->isNotEmpty()
                && $order->vendorOrders->every(fn (VendorOrder $vo) => in_array($vo->status->value, $deliveredStates, true));
            if (! $allDelivered) {
                return;
            }
        }

        [$headline, $message, $type] = match ($status) {
            'confirmed', 'accepted' => ['Your order has been confirmed', 'Your order '.$order->order_number.' was confirmed by the seller and is being prepared.', 'order'],
            'ready_for_pickup' => ['Your order is ready for pickup', 'Your order '.$order->order_number.' is packed by the seller and is awaiting courier pickup.', 'order'],
            'picked_up' => ['Your order is picked up', 'Your order '.$order->order_number.' has been picked up from the seller and is on its way.', 'delivery'],
            'out_for_delivery' => ['Your order is out for delivery', 'Your order '.$order->order_number.' is out for delivery and should arrive shortly.', 'delivery'],
            'delivered' => ['Your order has been delivered', 'Your order '.$order->order_number.' has been delivered. Thank you for shopping with us!', 'delivery'],
            'cancelled' => ['Your order was cancelled', 'One part of order '.$order->order_number.' was cancelled. Please check your order details.', 'order'],
            default => ['Your order has been updated', 'Your order '.$order->order_number.' has a new status: '.str_replace('_', ' ', $status).'.', 'order'],
        };

        $this->email($order->user->email, new \App\Modules\Marketing\Application\Mail\OrderStatusMail($order, $status, $headline, $message));
        $this->customer($order->user, $type, $headline.' — '.$order->order_number, $message, [
            'link' => 'account/orders/'.$order->uuid,
        ]);
    }

    /**
     * Full-order delivered: sends the invoice email with the complete bill once
     * every vendor order belonging to the order has been delivered.
     */
    public function orderInvoiceWhenAllDelivered(Order $order): void
    {
        $order->loadMissing('user', 'vendorOrders');

        if (! $order->user || $order->vendorOrders->isEmpty()) {
            return;
        }

        $delivered = [OrderStatus::DELIVERED->value, OrderStatus::COMPLETED->value];
        $allDelivered = $order->vendorOrders->every(
            fn (VendorOrder $vendorOrder) => in_array($vendorOrder->status->value, $delivered, true)
        );

        if (! $allDelivered) {
            return;
        }

        $this->email($order->user->email, new \App\Modules\Marketing\Application\Mail\OrderInvoiceMail($order->fresh()));
    }

    public function returnRequested(ReturnRequest $return): void
    {
        $return->loadMissing('user');

        if (! $return->user) {
            return;
        }

        $this->email($return->user->email, new \App\Modules\Marketing\Application\Mail\ReturnClaimMail($return));
        $this->customer($return->user, 'return', 'Return '.$return->return_number.' received', 'Your return request has been received and is under review. See the next steps in your email.', [
            'link' => 'account/returns',
        ]);

        $this->adminNotify(
            'return',
            'New return request '.$return->return_number,
            ($return->user->full_name ?: $return->user->email).' requested a return for '.($return->orderItem?->product_name ?? 'an item').' ('.str_replace('_', ' ', (string) $return->reason_type).').',
            ['link' => 'admin/orders/returns']
        );
    }

    public function vendorNewOrder(VendorOrder $vendorOrder): void
    {
        $vendorOrder->loadMissing('vendor');

        $vendor = $vendorOrder->vendor;
        if (! $vendor) {
            return;
        }

        $this->vendor($vendor, 'new_order', 'New order '.$vendorOrder->vendor_order_number, 'A customer just placed an order. Review and accept it to start fulfilment.', [
            'link' => 'vendor/orders/'.$vendorOrder->uuid,
        ]);

        if (! empty($vendor->business_email)) {
            $this->email($vendor->business_email, new \App\Modules\Marketing\Application\Mail\VendorNewOrderMail($vendorOrder->fresh()));
        }
    }

    public function settlementNotice(Settlement $settlement, string $event): void
    {
        $settlement->loadMissing('vendor');

        $vendor = $settlement->vendor;
        if (! $vendor) {
            return;
        }

        $headline = match ($event) {
            'eligible' => 'Settlement '.$settlement->settlement_number.' ready',
            'held' => 'Settlement '.$settlement->settlement_number.' placed on hold',
            'released' => 'Settlement '.$settlement->settlement_number.' released',
            'distributed' => 'Settlement '.$settlement->settlement_number.' paid out',
            'paid' => 'Settlement '.$settlement->settlement_number.' completed',
            default => 'Settlement '.$settlement->settlement_number.' updated',
        };

        $this->vendor($vendor, 'settlement', $headline, 'Your settlement of '.MailBrand::money((float) $settlement->net_payable).' has been updated ('.str_replace('_', ' ', $event).').', [
            'link' => 'vendor/settlements',
        ]);

        if (! empty($vendor->business_email)) {
            $this->email($vendor->business_email, new \App\Modules\Marketing\Application\Mail\SettlementNoticeMail($settlement, $event));
        }

        if ($event === 'held') {
            $this->adminNotify(
                'settlement',
                'Settlement '.$settlement->settlement_number.' held',
                ($this->vendorName($vendor)."'s settlement of ").MailBrand::money((float) $settlement->net_payable).' was placed on hold'.($settlement->hold_reason ? ': '.$settlement->hold_reason : '').'.',
                ['link' => 'admin/finance/settlements']
            );
        }
    }

    public function payoutRequested(\App\Modules\Wallet\Infrastructure\Models\PayoutRequest $payout): void
    {
        $payout->loadMissing('vendor', 'settlement');

        $this->adminNotify(
            'payout',
            'Payout request '.$payout->payout_number,
            ($payout->vendor ? $this->vendorName($payout->vendor) : 'A vendor').' requested a payout of '.MailBrand::money((float) $payout->amount).' for settlement '.($payout->settlement?->settlement_number ?? '').'.',
            ['link' => 'admin/finance/payouts']
        );
    }

    public function vendorApplied(Vendor $vendor): void
    {
        $this->adminNotify(
            'vendor',
            'New seller application',
            $this->vendorName($vendor).' submitted a seller application and is awaiting review.',
            ['link' => 'admin/marketplace/kyc']
        );
    }

    public function deliveryAssigned(DeliveryAssignment $assignment): void
    {
        $partner = $assignment->deliveryPartner;
        if (! $partner) {
            return;
        }

        $this->delivery($partner, 'assignment', 'New delivery assignment', 'You have been assigned '.($assignment->vendorOrder?->vendor_order_number ?? 'a delivery').'. Accept it to start pickup.', [
            'link' => 'delivery/deliveries/'.($assignment->vendorOrder?->uuid ?? ''),
        ]);

        if (! empty($partner->email)) {
            $this->email($partner->email, new \App\Modules\Marketing\Application\Mail\DeliveryAssignedMail($assignment));
        }
    }

    public function deliveryFailed(DeliveryAssignment $assignment, string $reason): void
    {
        $partner = $assignment->deliveryPartner;

        if ($partner) {
            $this->delivery($partner, 'delivery', 'Delivery failed', 'The delivery '.($assignment->vendorOrder?->vendor_order_number ?? '').' could not be completed. '.$reason, [
                'link' => 'delivery/failures',
            ]);
        }

        $this->adminNotify(
            'delivery',
            'Delivery needs attention',
            'Delivery '.($assignment->vendorOrder?->vendor_order_number ?? '').' failed ('.($reason ?: 'no reason').'). Please reassign or arrange return to vendor.',
            ['link' => 'admin/fulfillment/assignments']
        );
    }

    public function deliveryReturned(DeliveryAssignment $assignment): void
    {
        $this->adminNotify(
            'delivery',
            'Parcel returned to vendor',
            'Delivery '.($assignment->vendorOrder?->vendor_order_number ?? '').' was returned to the vendor (RTO). Stock has been restored.',
            ['link' => 'admin/fulfillment/assignments']
        );
    }

    public function payoutUpdated(\App\Modules\Wallet\Infrastructure\Models\PayoutRequest $payout, string $event): void
    {
        $payout->loadMissing('vendor');

        $vendor = $payout->vendor;
        if (! $vendor) {
            return;
        }

        $headline = match ($event) {
            'approved' => 'Payout '.$payout->payout_number.' approved',
            'rejected' => 'Payout '.$payout->payout_number.' rejected',
            'paid' => 'Payout '.$payout->payout_number.' paid',
            default => 'Payout '.$payout->payout_number.' updated',
        };

        $this->vendor($vendor, 'settlement', $headline, 'Your payout of '.MailBrand::money((float) $payout->amount).' has been '.str_replace('_', ' ', $event).'.', [
            'link' => 'vendor/settlements',
        ]);
    }

    public function deliveryPartnerApplied(DeliveryPartner $partner): void
    {
        $this->adminNotify(
            'delivery',
            'New delivery partner application',
            ($partner->name ?? 'A partner').' submitted a delivery partner application and awaits review.',
            ['link' => 'admin/marketplace/partners']
        );
    }

    protected function vendorName(Vendor $vendor): string
    {
        return (string) ($vendor->company_name ?: $vendor->user?->full_name ?: 'A seller');
    }

    // ------------------------------------------------------------------
    // Low-level builders
    // ------------------------------------------------------------------

    protected function customer(User $user, string $type, string $title, string $body, array $data = []): void
    {
        CustomerNotification::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    protected function vendor(Vendor $vendor, string $type, string $title, string $body, array $data = []): void
    {
        VendorNotification::query()->create([
            'vendor_id' => $vendor->id,
            'user_id' => $vendor->user_id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    protected function delivery(\App\Modules\Shipping\Infrastructure\Models\DeliveryPartner $partner, string $type, string $title, string $body, array $data = []): void
    {
        DeliveryNotification::query()->create([
            'delivery_partner_id' => $partner->id,
            'user_id' => $partner->user_id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => array_merge(['priority' => 'normal'], $data),
        ]);
    }

    protected function adminNotify(string $type, string $title, string $body, array $data = []): void
    {
        $admins = User::query()
            ->role(Roles::SUPER_ADMIN)
            ->where('status', UserStatus::ACTIVE)
            ->get();

        foreach ($admins as $admin) {
            AdminNotification::query()->create([
                'user_id' => $admin->id,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'data' => array_merge(['priority' => 'normal'], $data),
            ]);
        }
    }

    protected function email(string $recipient, Mailable $mailable): void
    {
        if ($recipient === '' || $recipient === null) {
            return;
        }

        if ($this->emailsEnabled() === false) {
            Log::channel('notification')->info('Email suppressed by settings', ['to' => $recipient, 'subject' => $mailable->subject]);

            return;
        }

        try {
            Mail::to($recipient)->send($mailable);
        } catch (\Throwable $e) {
            Log::channel('notification')->error('Email dispatch failed', [
                'to' => $recipient,
                'subject' => $mailable->subject,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function emailsEnabled(): bool
    {
        return Setting::get('notifications.email_enabled', true) !== false
            && Setting::get('notifications.email_enabled', 'true') !== 'false';
    }
}