@extends('mail.layout')

@section('content')
    <h1>{{ $headline }}</h1>
    <p>Hi {{ optional($order->user)->first_name ?: 'there' }},</p>
    <p>{{ $message }}</p>

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

    <p><strong>Order {{ $order->order_number }}</strong> &middot; {{ $order->placed_at?->format('M d, Y') }}</p>
    <p style="margin: 20px 0;"><a class="btn" href="{{ $trackUrl }}">Track Order</a></p>
@endsection