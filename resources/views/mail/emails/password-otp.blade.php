@extends('mail.layout')

@section('content')
    <h1>Reset your password</h1>
    <p>Hi {{ $user->first_name ?: $user->full_name }},</p>
    <p>We received a request to reset the password for your {{ $brand['brand_name'] }} account. Use the verification code below to choose a new password. The code expires in <strong>10 minutes</strong>.</p>
    <p><span class="code">{{ $code }}</span></p>
    <p class="muted">Enter this code along with your new password on the reset page. If you did not request a password reset, no changes have been made — you can safely ignore this email.</p>
    <div class="alert">If you did not request a password reset, no changes have been made. You can safely ignore this email.</div>
    <div class="divider"></div>
    <p class="muted">Need help? Contact us at <a href="mailto:{{ $brand['support_email'] }}">{{ $brand['support_email'] }}</a></p>
@endsection