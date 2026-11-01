<?php

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Identity\Infrastructure\Services\IdentityNotificationService;
use App\Modules\Marketing\Application\Mail\EmailVerificationMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailVerificationOtpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    public function test_email_verification_code_works_within_sixty_seconds_and_ignores_email_case(): void
    {
        $user = User::factory()->create([
            'email' => 'VerifyMe@example.test',
            'email_verified_at' => null,
        ]);
        $code = $this->sendVerificationCode($user);
        $this->travel(59)->seconds();

        $response = $this->postJson('/api/v1/auth/email/verify', [
            'email' => 'verifyme@example.test',
            'code' => $code,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Email verified successfully.');
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_resend_response_explains_the_sixty_second_expiry(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $this->postJson('/api/v1/auth/email/resend', [
            'email' => $user->email,
        ])->assertOk()
            ->assertJsonPath('message', 'Verification code sent. It expires in 60 seconds.');
    }

    public function test_expired_email_verification_code_returns_an_expiry_message(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);
        $code = $this->sendVerificationCode($user);
        $this->travel(61)->seconds();

        $this->postJson('/api/v1/auth/email/verify', [
            'email' => $user->email,
            'code' => $code,
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Your verification code has expired. Codes are valid for 60 seconds. Please request a new code.');

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_incorrect_email_verification_code_returns_an_invalid_code_message(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);
        $this->sendVerificationCode($user);

        $this->postJson('/api/v1/auth/email/verify', [
            'email' => $user->email,
            'code' => '000000',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Invalid verification code. Check the code in your email and try again.');
    }

    private function sendVerificationCode(User $user): string
    {
        app(IdentityNotificationService::class)->sendEmailVerification($user);

        $code = null;
        Mail::assertSent(EmailVerificationMail::class, function (EmailVerificationMail $mail) use (&$code): bool {
            $code = $mail->code;

            return str_contains($mail->render(), '60 seconds');
        });

        $this->assertNotNull($code);

        return $code;
    }
}
