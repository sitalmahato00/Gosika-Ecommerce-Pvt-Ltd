@extends('mail.layout')

@section('content')
    <h1>Set up your {{ $accountType }} account</h1>
    <p>Hi {{ $user->first_name ?: $user->full_name }},</p>
    <p>An administrator created a {{ $accountType }} account for you at {{ $brand['brand_name'] }}. Verify your email and choose a password using the secure link below.</p>
    <p style="text-align:center; margin:24px 0;">
        <a href="{{ $invitationUrl }}" class="btn">Verify email and set password</a>
    </p>
    <p class="muted">This one-time link expires in <strong>24 hours</strong>. If you were not expecting this account, you can ignore this email.</p>
    <div class="divider"></div>
    <p class="muted">If the button does not work, copy and paste this link into your browser:</p>
    <p style="word-break:break-all; font-size:12px;">{{ $invitationUrl }}</p>
@endsection
