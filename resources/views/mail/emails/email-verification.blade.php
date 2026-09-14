@extends('mail.layout')

@section('content')
    <h1>Verify your email</h1>
    <p>Hi {{ $user->first_name ?: $user->full_name }},</p>
    <p>Welcome to {{ $brand['brand_name'] }}. Use the verification code below to activate your account. The code expires in <strong>60 minutes</strong>.</p>
    <p><span class="code">{{ $code }}</span></p>
    <div class="alert">If you did not create this account, you can safely ignore this email.</div>
    <div class="divider"></div>
    <p class="muted">Need help? Contact us at <a href="mailto:{{ $brand['support_email'] }}">{{ $brand['support_email'] }}</a></p>
@endsection