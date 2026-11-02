@extends('mail.layout')

@section('content')
    <h1>{{ $headline }}</h1>
    <p>Hi {{ optional($order->user)->first_name ?: 'there' }},</p>
    <p>{{ $bodyMessage }}</p>

    <p>
        <strong>Order:</strong> {{ $order->order_number }}<br>
        <strong>Placed:</strong> {{ $placedAt ?: '—' }}<br>
        <strong>Order status:</strong> {{ $statusLabel }}<br>
        <strong>Payment:</strong> {{ $paymentMethod }} — {{ $paymentStatus }}
    </p>

    <table class="table" role="presentation">
        <thead><tr><th>Product</th><th>Qty</th><th>Line total</th></tr></thead>
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
        <tr><td>Subtotal</td><td align="right">{{ $subtotal }}</td></tr>
        @if ((float) $order->discount > 0)
            <tr><td>Discount</td><td align="right">−{{ $discount }}</td></tr>
        @endif
        <tr><td>Delivery</td><td align="right">{{ $deliveryCharge }}</td></tr>
        @if ((float) $order->tax > 0)
            <tr><td>Tax</td><td align="right">{{ $tax }}</td></tr>
        @endif
        <tr><td class="grand">Total</td><td class="grand" align="right">{{ $total }}</td></tr>
    </table>

    @if (!empty($shippingAddress))
        <div class="divider"></div>
        <p><strong>Delivery address</strong><br>
            {{ $shippingAddress['full_name'] ?? '' }}<br>
            {{ $shippingAddress['address_line_1'] ?? '' }}
            @if (!empty($shippingAddress['address_line_2']))<br>{{ $shippingAddress['address_line_2'] }}@endif
            @if (!empty($shippingAddress['municipality']) || !empty($shippingAddress['district']))
                <br>{{ collect([$shippingAddress['municipality'] ?? null, $shippingAddress['district'] ?? null])->filter()->implode(', ') }}
            @endif
            @if (!empty($shippingAddress['province']))<br>{{ $shippingAddress['province'] }}@endif
            @if (!empty($shippingAddress['phone']))<br>Phone: {{ $shippingAddress['phone'] }}@endif
        </p>
    @endif

    <p style="margin: 20px 0;"><a class="btn" href="{{ $trackUrl }}">Track Order</a></p>
@endsection