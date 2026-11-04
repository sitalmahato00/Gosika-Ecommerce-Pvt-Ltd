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
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
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
    public function adminAccountInvitation(User $user, string $invitationUrl, string $accountType): bool
    {
        return $this->email(
            $user->email,
            new \App\Modules\Marketing\Application\Mail\AdminAccountInvitationMail($user, $invitationUrl, $accountType)
        );
    }

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

        if (! $order->user
            || $order->status !== OrderStatus::CONFIRMED
            || (in_array($order->payment_method, [PaymentMethod::ESEWA->value, PaymentMethod::KHALTI->value], true)
                && $order->payment_status?->value !== OrderPaymentStatus::PAID->value)) {
            return;
        }

        $this->email($order->user->email, new \App\Modules\Marketing\Application\Mail\OrderConfirmationMail($order));
        $this->customer($order->user, 'order', 'Order '.$order->order_number.' confirmed', 'Your payment was received and your order is confirmed. It is now awaiting seller acceptance.', [
            'link' => 'account/orders/'.$order->uuid,
            'event' => 'order_confirmed',
            'order_uuid' => $order->uuid,
            'order_number' => $order->order_number,
            'status' => $order->status->value,
            'payment_status' => $order->payment_status?->value,
            'payment_method' => $order->payment_method,
            'total' => (float) $order->grand_total,
            'currency' => $order->currency,
        ]);
    }

    public function orderPlaced(Order $order): void
    {
        $order->loadMissing(['user', 'items']);

        if (! $order->user) {
            return;
        }

        $isPaymentPending = in_array($order->payment_method, [PaymentMethod::ESEWA->value, PaymentMethod::KHALTI->value], true)
            && $order->payment_status?->value !== OrderPaymentStatus::PAID->value;

        if ($isPaymentPending) {
            $title = 'Payment pending for order '.$order->order_number;
            $message = 'We received your order, but your online payment is still pending. The order will be confirmed only after the payment succeeds.';
            $type = 'payment';
        } else {
            $title = 'Order '.$order->order_number.' received';
            $message = 'Your order has been placed and is awaiting seller confirmation.';
            $type = 'order';
        }

        $this->email($order->user->email, new \App\Modules\Marketing\Application\Mail\OrderStatusMail(
            $order,
            $order->status->value,
            $title,
            $message,
        ));
        $this->customer($order->user, $type, $title, $message, [
            'link' => 'account/orders/'.$order->uuid,
            'event' => 'order_placed',
            'order_uuid' => $order->uuid,
            'order_number' => $order->order_number,
            'status' => $order->status->value,
            'payment_status' => $order->payment_status?->value,
            'payment_method' => $order->payment_method,
            'total' => (float) $order->grand_total,
            'currency' => $order->currency,
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

        if (in_array($order->payment_method, [PaymentMethod::ESEWA->value, PaymentMethod::KHALTI->value], true)
            && $order->payment_status?->value !== OrderPaymentStatus::PAID->value
            && $status !== 'cancelled') {
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
            'event' => 'order_status',
            'order_uuid' => $order->uuid,
            'order_number' => $order->order_number,
            'status' => $order->status->value,
            'vendor_order_status' => $vendorOrder->status->value,
            'payment_status' => $order->payment_status?->value,
            'payment_method' => $order->payment_method,
            'total' => (float) $order->grand_total,
            'currency' => $order->currency,
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

    /**
     * Notify customer (and optionally vendor) when a return request status changes.
     * Called at every step transition after the initial submission.
     */
    public function returnStatusChanged(ReturnRequest $return, ?User $actor = null): void
    {
        $return->loadMissing(['user', 'orderItem', 'store.vendor']);

        $status   = $return->status;
        $rn       = $return->return_number;
        $product  = $return->orderItem?->product_name ?? 'your item';

        // ── Customer notification ─────────────────────────────────────────
        if ($return->user) {
            [$title, $body] = match ($status) {
                \App\Modules\Shared\Domain\Enums\ReturnStatus::UNDER_REVIEW  => ["Return {$rn} is under review", "Your return request is being reviewed. We will update you shortly."],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::APPROVED       => ["Return {$rn} approved", "Your return request for {$product} has been approved. Please follow the return instructions provided."],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::REJECTED       => ["Return {$rn} rejected", "Your return request for {$product} was not approved. Reason: ".($return->review_notes ?: 'See details in your account.')],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::PICKUP_ARRANGED => ["Return pickup arranged for {$rn}", "Return logistics for {$product} have been arranged. ".($return->pickup_instructions ?: 'Check your return details for instructions.')],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::COLLECTED      => ["Return {$rn} received by seller", "The seller has received your returned {$product}. Inspection is in progress."],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::INSPECTED      => ["Return {$rn} inspected", "Your returned {$product} has been inspected. We are now processing your resolution."],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::EXCHANGE_DISPATCHED   => ["Exchange dispatched for {$rn}", "Your replacement product for {$product} has been dispatched. You will receive it shortly."],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::REPLACEMENT_DISPATCHED => ["Replacement dispatched for {$rn}", "A replacement for {$product} has been dispatched. You will receive it shortly."],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::REFUND_PENDING  => ["Refund pending for {$rn}", "Your refund for {$product} is being processed. It will be credited soon."],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::REFUNDED        => ["Refund processed for {$rn}", "Your refund for {$product} has been processed. Please allow 3–5 business days for it to reflect."],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::COMPLETED       => ["Return {$rn} closed", "Your return request has been completed. Thank you for shopping with us."],
                \App\Modules\Shared\Domain\Enums\ReturnStatus::CANCELLED       => ["Return {$rn} cancelled", "Your return request for {$product} has been cancelled."],
                default => ["Return {$rn} updated", "Your return request status has been updated to: {$status->label()}."],
            };

            $this->customer($return->user, 'return', $title, $body, [
                'link'          => 'account/returns/'.$return->uuid,
                'event'         => 'return_status_changed',
                'return_uuid'   => $return->uuid,
                'return_number' => $rn,
                'status'        => $status->value,
            ]);
        }

        // ── Vendor notification (for relevant statuses) ───────────────────
        $vendor = $return->store?->vendor;
        if ($vendor && in_array($status, [
            \App\Modules\Shared\Domain\Enums\ReturnStatus::REQUESTED,
            \App\Modules\Shared\Domain\Enums\ReturnStatus::COLLECTED,
        ], true)) {
            $vendorMsg = $status === \App\Modules\Shared\Domain\Enums\ReturnStatus::COLLECTED
                ? "Return {$rn} has been collected from the customer. Please inspect the product."
                : "New return request {$rn} received for {$product}. Please review it in your seller dashboard.";

            $this->vendor($vendor, 'return', "Return {$rn}: ".ucfirst($status->value), $vendorMsg, [
                'link' => 'vendor/returns/'.$return->uuid,
            ]);
        }

        // ── Admin notification (only for escalations) ─────────────────────
        if (in_array($status, [
            \App\Modules\Shared\Domain\Enums\ReturnStatus::REFUND_PENDING,
            \App\Modules\Shared\Domain\Enums\ReturnStatus::REFUNDED,
        ], true)) {
            $this->adminNotify(
                'return',
                "Return {$rn} — {$status->label()}",
                "Return request {$rn} for {$product} requires financial processing.",
                ['link' => 'admin/orders/returns']
            );
        }
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

    protected function email(string $recipient, Mailable $mailable): bool
    {
        if ($recipient === '' || $recipient === null) {
            return false;
        }

        if ($this->emailsEnabled() === false) {
            Log::channel('notification')->info('Email suppressed by settings', ['to' => $recipient, 'subject' => $mailable->subject]);

            return false;
        }

        try {
            Mail::to($recipient)->send($mailable);
            return true;
        } catch (\Throwable $e) {
            Log::channel('notification')->error('Email dispatch failed', [
                'to' => $recipient,
                'subject' => $mailable->subject,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    protected function emailsEnabled(): bool
    {
        return Setting::get('notifications.email_enabled', true) !== false
            && Setting::get('notifications.email_enabled', 'true') !== 'false';
    }
}