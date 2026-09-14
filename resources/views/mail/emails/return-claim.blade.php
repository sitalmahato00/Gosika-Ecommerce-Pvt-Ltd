@extends('mail.layout')

@section('content')
    <h1>Return received &mdash; what happens next</h1>
    <p>Hi {{ $customerName }},</p>
    <p>We received your return request <strong>{{ $return->return_number }}</strong> for <strong>{{ $productName }}</strong> from order {{ $orderNumber }} ({{ $reasonLabel }}). Our team will review it within <strong>1&ndash;2 business days</strong>.</p>

    <div class="divider"></div>
    <p style="margin: 0 0 12px;"><strong>Your return &amp; claim guide</strong></p>
    <span class="step"><span class="step-badge">1</span> Our team reviews your request. Approved returns are picked from your address.</span>
    <span class="step"><span class="step-badge">2</span> The returned item is checked at our quality centre for condition and eligibility.</span>
    <span class="step"><span class="step-badge">3</span> On verification, the refund
        @if ($refundAmount) of <strong>{{ $refundAmount }}</strong> @endif
        is processed back to your original payment method (or {{ $brand['currency_symbol'] }} wallet / COD refund) within <strong>3&ndash;5 business days</strong>.</span>

    <div class="alert">
        Keep the product, packaging, invoice, and any accessories safely until the pickup.
        Items must be unused and in their original condition to be eligible.
    </div>

    @if ($return->reason)
        <p class="muted"><strong>Your note:</strong> {{ $return->reason }}</p>
    @endif

    <p style="margin: 20px 0;"><a class="btn" href="{{ $returnsUrl }}">Track My Returns</a></p>
    <p class="muted">Need to change or cancel this request? Reply to this email or contact <a href="mailto:{{ $brand['support_email'] }}">{{ $brand['support_email'] }}</a></p>
@endsection