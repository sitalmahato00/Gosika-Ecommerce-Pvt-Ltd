@extends('mail.layout')

@section('content')
    <h1>{{ $eventHeadline }}</h1>
    <p>Hi @php($vendorName = optional($settlement->vendor)->company_name ?: optional($settlement->vendor)->user?->full_name ?: 'there'){{ $vendorName }},</p>
    <p>Settlement <strong>{{ $settlement->settlement_number }}</strong> ({{ $settlement->period_start }} to {{ $settlement->period_end }}) has been updated.</p>

    <table class="totals" role="presentation">
        <tr><td>Gross sales</td><td align="right">{{ $gross }}</td></tr>
        <tr><td>Marketplace commission</td><td align="right">&minus; {{ $commission }}</td></tr>
        <tr><td>Refunds</td><td align="right">&minus; {{ $refunds }}</td></tr>
        <tr><td>Adjustments</td><td align="right">{{ $adjustments }}</td></tr>
        <tr><td class="grand">Net payable</td><td align="right" class="grand">{{ $netPayable }}</td></tr>
        <tr><td>Status</td><td align="right">{{ $statusLabel }}</td></tr>
    </table>

    @if ($holdReason)
        <div class="alert"><strong>Hold reason:</strong> {{ $holdReason }}</div>
    @endif

    <p style="margin: 20px 0;"><a class="btn" href="{{ $settlementUrl }}">View Settlements</a></p>
    <p class="muted">This is an automated settlement notice from {{ $brand['brand_name'] }}. Contact <a href="mailto:{{ $brand['support_email'] }}">{{ $brand['support_email'] }}</a> if you believe there is an error.</p>
@endsection