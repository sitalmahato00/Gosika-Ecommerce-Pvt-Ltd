@extends('mail.layout')

@section('content')
    <h1>{{ $headline }}</h1>
    <p>{{ $message }}</p>
    @if (! empty($link))
        <p style="margin: 20px 0;"><a class="btn" href="{{ $link }}">{{ $linkLabel ?: 'View Details' }}</a></p>
    @endif
    <p class="muted">Automated alert from the {{ $brand['brand_name'] }} Marketplace Control team.</p>
@endsection