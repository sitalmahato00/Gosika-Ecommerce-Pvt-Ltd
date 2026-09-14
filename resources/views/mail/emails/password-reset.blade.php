@extends('mail.layout')

@section('content')
    <h1>Reset your password</h1>
    <p>Hi {{ $user->first_name ?: $user->full_name }},</p>
    <p>We received a request to reset the password for your {{ $brand['brand_name'] }} account. Click the button below to choose a new password. This link expires in <strong>30 minutes</strong>.</p>
    <p style="margin: 20px 0;">
        <a class="btn" href="{{ $resetUrl }}">Reset Password</a>
    </p>
    <p class="muted">If the button does not work, copy and paste this link into your browser:</p>
    <p class="muted" style="word-break: break-all;">{{ $resetUrl }}</p>
    <div class="alert">If you did not request a password reset, no changes have been made. You can safely ignore this email.</div>
@endsection