@extends('mail.layout')

@section('content')
    <h1>New order for {{ $storeName }}</h1>
    <p>You have a new order to fulfil: <strong>{{ $vendorOrder->vendor_order_number }}</strong> (customer order {{ $orderNumber }}).</p>
    <p class="muted">Customer: {{ $customerName }}{{ $customerPhone ? ' &middot; '.$customerPhone : '' }}<br>Payment: {{ $paymentMethod }}</p>

    <table class="table" role="presentation">
        <thead><tr><th>Product</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    <td>@php($name = $item->product_name . ($item->variant_name ? ' (' . $item->variant_name . ')' : '')){{ $name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format((float) $item->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals" role="presentation">
        <tr><td>Subtotal</td><td align="right">{{ $subtotal }}</td></tr>
        <tr><td>Delivery charge</td><td align="right">{{ $delivery }}</td></tr>
        <tr><td>Tax</td><td align="right">{{ $tax }}</td></tr>
        <tr><td>Marketplace commission</td><td align="right">&minus; {{ $commission }}</td></tr>
        <tr><td class="grand">Your net payable</td><td align="right" class="grand">{{ $netPayable }}</td></tr>
    </table>

    <p style="margin: 20px 0;"><a class="btn" href="{{ $orderUrl }}">Review &amp; Accept Order</a></p>
    <p class="muted">Status: {{ $statusLabel }} &middot; Please accept or prepare this order promptly to keep dispatch on schedule.</p>
@endsection