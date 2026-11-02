@extends('mail.layout')

@section('content')
    <h1>Payment received — order confirmed</h1>
    <p>Hi {{ $billingName }},</p>
    <p>Your payment was received and order <strong>{{ $order->order_number }}</strong> is confirmed. It is now awaiting seller acceptance.</p>

    <table class="table" role="presentation">
        <thead>
            <tr><th>Product</th><th>Qty</th><th>Line total</th></tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    <td>@php($name = $item->product_name . ($item->variant_name ? ' (' . $item->variant_name . ')' : '')){{ $name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ \App\Modules\Marketing\Application\Services\MailBrand::money((float) $item->line_total) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals" role="presentation">
        <tr><td>Subtotal</td><td align="right">{{ \App\Modules\Marketing\Application\Services\MailBrand::money((float) $order->subtotal) }}</td></tr>
        @if ((float) $order->discount > 0)
            <tr><td>Discount</td><td align="right">−{{ \App\Modules\Marketing\Application\Services\MailBrand::money((float) $order->discount) }}</td></tr>
        @endif
        <tr><td>Delivery</td><td align="right">{{ \App\Modules\Marketing\Application\Services\MailBrand::money((float) $order->delivery_charge) }}</td></tr>
        @if ((float) $order->tax > 0)
            <tr><td>Tax</td><td align="right">{{ \App\Modules\Marketing\Application\Services\MailBrand::money((float) $order->tax) }}</td></tr>
        @endif
        <tr><td class="grand">Total</td><td class="grand" align="right">{{ $total }}</td></tr>
    </table>

    <p><strong>Payment method:</strong> {{ $methodLabel }}<br>
        <strong>Payment status:</strong> {{ $paymentStatusLabel }}<br>
        <strong>Order status:</strong> {{ $statusLabel }}</p>

    <p style="margin: 20px 0;"><a class="btn" href="{{ $orderUrl }}">View Order</a></p>

    <div class="alert">For online payments, your order is confirmed once the payment succeeds. If payment is interrupted, you can retry from the order page.</div>
@endsection