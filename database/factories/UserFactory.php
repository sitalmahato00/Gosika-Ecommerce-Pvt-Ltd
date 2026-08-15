<?php

namespace Database\Factories;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The model the factory corresponds to.
     */
    protected $model = User::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->unique()->numerify('98########'),
            'password' => static::$password ??= Hash::make('password'),
            'email_verified_at' => now(),
            'status' => UserStatus::ACTIVE,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => UserStatus::SUSPENDED,
        ]);
    }
}
