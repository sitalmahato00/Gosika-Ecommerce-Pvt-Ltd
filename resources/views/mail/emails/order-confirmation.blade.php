@extends('mail.layout')

@section('content')
    <h1>Order confirmed</h1>
    <p>Hi {{ $billingName }},</p>
    <p>Your order <strong>{{ $order->order_number }}</strong> has been placed successfully and is now being processed by our sellers.</p>

    <table class="table" role="presentation">
        <thead>
            <tr><th>Product</th><th>Qty</th><th>Total</th></tr>
        </thead>
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

    <p><strong>Order total: {{ $total }}</strong><br>
    <span class="muted">Payment method: {{ $methodLabel }}</span></p>

    <p style="margin: 20px 0;"><a class="btn" href="{{ $orderUrl }}">View Order</a></p>

    <div class="alert">For online payments, your order is confirmed once the payment succeeds. If payment is interrupted, you can retry from the order page.</div>
@endsection