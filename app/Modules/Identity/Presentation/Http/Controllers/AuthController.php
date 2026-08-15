<?php

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Application\DataTransferObjects\LoginDTO;
use App\Modules\Identity\Application\DataTransferObjects\RegisterUserDTO;
use App\Modules\Identity\Application\Services\AuthService;
use App\Modules\Identity\Presentation\Http\Requests\ForgotPasswordRequest;
use App\Modules\Identity\Presentation\Http\Requests\LoginRequest;
use App\Modules\Identity\Presentation\Http\Requests\RegisterRequest;
use App\Modules\Identity\Presentation\Http\Requests\ResetPasswordRequest;
use App\Modules\Identity\Presentation\Http\Requests\VerifyEmailRequest;
use App\Modules\Identity\Presentation\Http\Requests\VerifyPhoneRequest;
use App\Modules\Identity\Presentation\Resources\UserResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
    public function __construct(protected AuthService $auth)
    {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->auth->register(RegisterUserDTO::fromArray($request->validated()));

        return Response::success([
            'user' => new UserResource($user),
            'token' => $this->auth->createToken($user, $request->input('device_name')),
            'requires_email_verification' => true,
            'requires_phone_verification' => (bool) $user->phone,
        ], 'Registration successful. Please verify your email' . ($user->phone ? ' and phone OTP' : '') . '.', [], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = $this->auth->login(LoginDTO::fromArray($request->validated()));

        return Response::success([
            'user' => new UserResource($user->load('roles')),
            'token' => $this->auth->createToken($user, $request->input('device_name')),
        ], 'Login successful.');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user());

        return Response::noContent('Logged out.');
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $this->auth->logout($request->user(), allDevices: true);

        return Response::noContent('Logged out from all devices.');
    }

    public function me(Request $request): JsonResponse
    {
        return Response::success(new UserResource($request->user()->load('roles')), 'Authenticated user.');
    }

    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        $user = $this->auth->verifyEmail($request->input('email'), $request->input('token'));

        return Response::success(new UserResource($user), 'Email verified successfully.');
    }

    public function resendEmailVerification(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = \App\Modules\Identity\Infrastructure\Models\User::where('email', $request->input('email'))->first();
        if (! $user) {
            return Response::error('User not found.', [], 404);
        }

        app(\App\Modules\Identity\Infrastructure\Services\IdentityNotificationService::class)
            ->sendEmailVerification($user);

        return Response::success(null, 'Verification email sent.');
    }

    public function sendPhoneOtp(Request $request): JsonResponse
    {
        $this->auth->sendPhoneOtp($request->user());

        return Response::success(null, 'OTP sent to your phone.');
    }

    public function verifyPhone(VerifyPhoneRequest $request): JsonResponse
    {
        $user = $this->auth->verifyPhone($request->user(), $request->input('code'));

        return Response::success(new UserResource($user), 'Phone verified successfully.');
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $message = $this->auth->forgotPassword($request->input('email'));

        return Response::success(null, $message);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->auth->resetPassword($request->only('token', 'email', 'password', 'password_confirmation'));

        return Response::success(null, 'Password reset successfully.');
    }
}
