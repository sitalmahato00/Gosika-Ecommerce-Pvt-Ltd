@extends('mail.layout')

@section('content')
    <h1>Invoice &mdash; {{ $order->order_number }}</h1>
    <p>Hi {{ $customerName }},</p>
    <p>Thank you for shopping with {{ $brand['brand_name'] }}. Your order has been <strong>delivered</strong>. Please find your invoice below.</p>

    <div class="divider"></div>

    <p style="margin: 0 0 4px;"><strong>Delivered to</strong></p>
    <p style="margin: 0 0 14px;" class="muted">
        {{ $deliveryName }} &middot; {{ $deliveryPhone }}<br>
        @foreach ($addressLines as $line){{ $line }}<br>@endforeach
    </p>

    <table class="table" role="presentation">
        <thead>
            <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    <td>@php($name = $item->product_name . ($item->variant_name ? ' (' . $item->variant_name . ')' : '')){{ $name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format((float) $item->unit_price, 2) }}</td>
                    <td>{{ number_format((float) $item->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals" role="presentation">
        <tr><td>Subtotal</td><td align="right">{{ $subtotal }}</td></tr>
        @if ((float) $discount > 0)<tr><td>Discount</td><td align="right">&minus; {{ $discount }}</td></tr>@endif
        <tr><td>Delivery charge</td><td align="right">{{ $delivery }}</td></tr>
        <tr><td>Tax</td><td align="right">{{ $tax }}</td></tr>
        <tr><td class="grand">Grand Total</td><td align="right" class="grand">{{ $grandTotal }}</td></tr>
        <tr><td>Payment method</td><td align="right">{{ $methodLabel }}</td></tr>
    </table>

    @if ($vendorRows->isNotEmpty())
        <div class="divider"></div>
        <p style="margin: 0 0 6px;"><strong>Seller-wise summary</strong></p>
        <table class="table" role="presentation">
            <thead><tr><th>Seller</th><th>Items</th><th>Total</th></tr></thead>
            <tbody>
                @foreach ($vendorRows as $row)
                    <tr><td>{{ $row['store'] }}</td><td>{{ $row['item_count'] }}</td><td>{{ $row['total'] }}</td></tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="divider"></div>
    <p class="muted">Status: {{ $statusLabel }} &middot; Order {{ $order->order_number }} &middot; Placed {{ $order->placed_at?->format('M d, Y') }}</p>
    <p style="margin: 16px 0;"><a class="btn" href="{{ $invoiceUrl }}">View in Account</a></p>
@endsection