@extends('mail.layout')

@section('content')
    <h1>New delivery assignment</h1>
    <p>Hi {{ $partnerName }},</p>
    <p>You have been assigned delivery <strong>{{ $vendorOrderNumber }}</strong> (customer order {{ $orderNumber }}).</p>

    <table class="table" role="presentation">
        <tr><td><strong>Pickup</strong></td><td>{{ $pickup }}</td></tr>
        <tr><td><strong>Drop-off</strong></td><td>{{ $dropoff }}</td></tr>
        <tr><td><strong>Recipient</strong></td><td>{{ $recipientName }} &middot; {{ $recipientPhone }}</td></tr>
        <tr><td><strong>Delivery fee</strong></td><td>{{ $deliveryFee }}</td></tr>
        @if ($hasCod)
            <tr><td><strong>COD to collect</strong></td><td>{{ $codAmount }}</td></tr>
        @endif
    </table>

    <p style="margin: 20px 0;"><a class="btn" href="{{ $brand['frontend_url'] }}/delivery/deliveries">Open Delivery Dashboard</a></p>
    <p class="muted">Please accept the assignment in your app and proceed with pickup at your earliest availability.</p>
@endsection