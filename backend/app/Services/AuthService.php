<?php

namespace App\Services;

use App\DTO\ForgotPasswordDTO;
use App\DTO\LoginDTO;
use App\DTO\RegisterDTO;
use App\DTO\ResetPasswordDTO;
use App\DTO\SendOtpDTO;
use App\DTO\VerifyOtpDTO;
use App\Events\AuthEvent;
use App\Interfaces\UserRepositoryInterface;
use App\Models\RefreshToken;
use App\Models\User;
use App\Notifications\OtpEmailNotification;
use App\Notifications\OtpSmsNotification;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService extends BaseService
{
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCK_DURATION_MINUTES = 15;
    private const OTP_LENGTH = 6;
    private const OTP_EXPIRY_MINUTES = 10;
    private const ACCESS_TOKEN_EXPIRY_MINUTES = 60; // 1 hour
    private const REFRESH_TOKEN_EXPIRY_DAYS = 30;

    public function __construct(UserRepositoryInterface $repository)
    {
        parent::__construct($repository);
    }

    // ─── Registration ───────────────────────────────────────────────

    /**
     * Register a new candidate user.
     *
     * @param RegisterDTO $dto
     * @param string|null $ip
     * @param string|null $userAgent
     * @return array{user: User, access_token: string, refresh_token: string}
     */
    public function registerCandidate(RegisterDTO $dto, ?string $ip = null, ?string $userAgent = null): array
    {
        return DB::transaction(function () use ($dto, $ip, $userAgent) {
            $user = $this->repository->create($dto->toArray());
            $user->assignRole(\App\Enums\RoleName::Candidat->value);
            $user->candidate()->create([
                'nni' => $user->nin,
                'nationalite' => 'Tchadienne',
            ]);
            $user->load('roles', 'permissions');

            $tokens = $this->generateTokenPair($user, $ip, $userAgent);

            Log::channel('auth')->info('User registered', ['user_id' => $user->id, 'email' => $user->email]);
            AuthEvent::dispatch('register', $user, true, null, $ip, $userAgent);

            return [
                'user' => $user,
                'access_token' => $tokens['access_token'],
                'refresh_token' => $tokens['refresh_token'],
            ];
        });
    }

    // ─── Login ──────────────────────────────────────────────────────

    /**
     * Authenticate user and generate token pair.
     *
     * @param LoginDTO $dto
     * @param string|null $ip
     * @param string|null $userAgent
     * @return array{user: User, access_token: string, refresh_token: string}
     * @throws ValidationException
     */
    public function login(LoginDTO $dto, ?string $ip = null, ?string $userAgent = null): array
    {
        $user = $this->repository->findByEmail($dto->email);

        // OWASP: Generic error message to prevent user enumeration
        if (!$user) {
            AuthEvent::dispatch('login_failed', null, false, 'User not found', $ip, $userAgent, ['email' => $dto->email]);
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        // Check if account is locked
        if ($user->isLocked()) {
            $minutesRemaining = now()->diffInMinutes($user->locked_until);
            AuthEvent::dispatch('login_locked', $user, false, 'Account locked', $ip, $userAgent);

            throw ValidationException::withMessages([
                'email' => ["Compte verrouillé. Réessayez dans {$minutesRemaining} minute(s)."],
            ]);
        }

        // Check if account is active
        if (!$user->is_active) {
            AuthEvent::dispatch('login_inactive', $user, false, 'Account inactive', $ip, $userAgent);
            throw ValidationException::withMessages([
                'email' => ['Ce compte a été désactivé. Contactez l\'administrateur.'],
            ]);
        }

        // Verify password
        if (!Hash::check($dto->password, $user->password)) {
            $user->incrementFailedAttempts(self::MAX_LOGIN_ATTEMPTS, self::LOCK_DURATION_MINUTES);
            AuthEvent::dispatch('login_failed', $user, false, 'Invalid password', $ip, $userAgent);

            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        // Successful login
        $user->resetFailedAttempts();
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);

        $user->load('roles', 'permissions');

        $tokens = $this->generateTokenPair($user, $ip, $userAgent);

        Log::channel('auth')->info('User logged in', ['user_id' => $user->id, 'ip' => $ip]);
        AuthEvent::dispatch('login', $user, true, null, $ip, $userAgent);

        return [
            'user' => $user,
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ];
    }

    // ─── Logout ─────────────────────────────────────────────────────

    /**
     * Logout user — revoke current access token and all refresh tokens.
     */
    public function logout(User $user, ?string $ip = null, ?string $userAgent = null): bool
    {
        // Revoke current access token
        $user->currentAccessToken()->delete();

        // Revoke all refresh tokens
        $user->refreshTokens()->where('revoked', false)->update(['revoked' => true]);

        Log::channel('auth')->info('User logged out', ['user_id' => $user->id]);
        AuthEvent::dispatch('logout', $user, true, null, $ip, $userAgent);

        return true;
    }

    // ─── OTP ────────────────────────────────────────────────────────

    /**
     * Generate and send OTP via SMS or Email.
     */
    public function sendOtp(SendOtpDTO $dto, ?string $ip = null, ?string $userAgent = null): void
    {
        $user = $this->repository->findByEmail($dto->email);

        if (!$user) {
            // OWASP: Don't reveal if email exists
            return;
        }

        $otpCode = $this->generateOtpCode();

        $user->update([
            'otp_code' => Hash::make($otpCode),
            'otp_expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
            'otp_channel' => $dto->channel,
        ]);

        // Send notification based on channel
        if ($dto->channel === 'email') {
            $user->notify(new OtpEmailNotification($otpCode, self::OTP_EXPIRY_MINUTES));
        } else {
            if (empty($user->phone)) {
                throw ValidationException::withMessages([
                    'channel' => ['Aucun numéro de téléphone associé à ce compte.'],
                ]);
            }
            $user->notify(new OtpSmsNotification($otpCode, self::OTP_EXPIRY_MINUTES));
        }

        Log::channel('auth')->info('OTP sent', [
            'user_id' => $user->id,
            'channel' => $dto->channel,
        ]);
        AuthEvent::dispatch('otp_sent', $user, true, null, $ip, $userAgent, ['channel' => $dto->channel]);
    }

    /**
     * Verify OTP code.
     */
    public function verifyOtp(VerifyOtpDTO $dto, ?string $ip = null, ?string $userAgent = null): array
    {
        $user = $this->repository->findByEmail($dto->email);

        if (!$user) {
            throw ValidationException::withMessages([
                'otp_code' => ['Code OTP invalide ou expiré.'],
            ]);
        }

        // Check expiry
        if (!$user->otp_expires_at || $user->otp_expires_at->isPast()) {
            AuthEvent::dispatch('otp_expired', $user, false, 'OTP expired', $ip, $userAgent);
            throw ValidationException::withMessages([
                'otp_code' => ['Code OTP expiré. Veuillez en demander un nouveau.'],
            ]);
        }

        // Verify hashed OTP
        if (!Hash::check($dto->otp_code, $user->otp_code)) {
            AuthEvent::dispatch('otp_failed', $user, false, 'Invalid OTP', $ip, $userAgent);
            throw ValidationException::withMessages([
                'otp_code' => ['Code OTP invalide ou expiré.'],
            ]);
        }

        // Mark verified based on channel
        $updates = [
            'otp_code' => null,
            'otp_expires_at' => null,
            'otp_channel' => null,
        ];

        if ($dto->channel === 'email') {
            $updates['email_verified_at'] = now();
        } else {
            $updates['phone_verified_at'] = now();
        }

        $user->update($updates);
        $user->load('roles', 'permissions');

        $tokens = $this->generateTokenPair($user, $ip, $userAgent);

        Log::channel('auth')->info('OTP verified', ['user_id' => $user->id, 'channel' => $dto->channel]);
        AuthEvent::dispatch('otp_verified', $user, true, null, $ip, $userAgent, ['channel' => $dto->channel]);

        return [
            'user' => $user,
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ];
    }

    // ─── Password Reset ─────────────────────────────────────────────

    /**
     * Send password reset link.
     */
    public function forgotPassword(ForgotPasswordDTO $dto, ?string $ip = null, ?string $userAgent = null): void
    {
        $user = $this->repository->findByEmail($dto->email);

        // OWASP: Always return success to prevent user enumeration
        if (!$user) {
            return;
        }

        $token = Password::createToken($user);
        $user->notify(new ResetPasswordNotification($token));

        Log::channel('auth')->info('Password reset requested', ['user_id' => $user->id]);
        AuthEvent::dispatch('password_reset_requested', $user, true, null, $ip, $userAgent);
    }

    /**
     * Reset password with token.
     */
    public function resetPassword(ResetPasswordDTO $dto, ?string $ip = null, ?string $userAgent = null): void
    {
        $status = Password::reset(
            [
                'email' => $dto->email,
                'password' => $dto->password,
                'password_confirmation' => $dto->password,
                'token' => $dto->token,
            ],
            function (User $user, string $password) use ($ip, $userAgent) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Revoke all tokens on password reset (OWASP best practice)
                $user->tokens()->delete();
                $user->refreshTokens()->update(['revoked' => true]);

                Log::channel('auth')->info('Password reset completed', ['user_id' => $user->id]);
                AuthEvent::dispatch('password_reset', $user, true, null, $ip, $userAgent);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['Le lien de réinitialisation est invalide ou expiré.'],
            ]);
        }
    }

    // ─── Refresh Token ──────────────────────────────────────────────

    /**
     * Refresh access token using refresh token (token rotation).
     */
    public function refreshToken(string $refreshTokenValue, ?string $ip = null, ?string $userAgent = null): array
    {
        $hashedToken = hash('sha256', $refreshTokenValue);
        $refreshToken = RefreshToken::where('token', $hashedToken)->first();

        if (!$refreshToken || !$refreshToken->isValid()) {
            // If token was already used (revoked), this might be a token theft
            if ($refreshToken && $refreshToken->revoked) {
                // Revoke ALL tokens for this user (security measure)
                $refreshToken->user->tokens()->delete();
                $refreshToken->user->refreshTokens()->update(['revoked' => true]);

                Log::channel('auth')->warning('Refresh token reuse detected — possible token theft', [
                    'user_id' => $refreshToken->user_id,
                    'ip' => $ip,
                ]);
                AuthEvent::dispatch('token_theft_detected', $refreshToken->user, false, 'Refresh token reuse', $ip, $userAgent);
            }

            throw ValidationException::withMessages([
                'refresh_token' => ['Jeton de rafraîchissement invalide ou expiré.'],
            ]);
        }

        $user = $refreshToken->user;
        $user->load('roles', 'permissions');

        // Revoke old refresh token (rotation)
        $refreshToken->revoke();

        // Revoke old access tokens
        $user->tokens()->delete();

        // Generate new token pair
        $tokens = $this->generateTokenPair($user, $ip, $userAgent);

        Log::channel('auth')->info('Token refreshed', ['user_id' => $user->id]);
        AuthEvent::dispatch('token_refreshed', $user, true, null, $ip, $userAgent);

        return [
            'user' => $user,
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ];
    }

    // ─── Private Helpers ────────────────────────────────────────────

    /**
     * Generate an access + refresh token pair.
     */
    private function generateTokenPair(User $user, ?string $ip = null, ?string $userAgent = null): array
    {
        // Access token (Sanctum)
        $accessToken = $user->createToken('auth_token', ['*'], now()->addMinutes(self::ACCESS_TOKEN_EXPIRY_MINUTES));

        // Refresh token
        $rawRefreshToken = Str::random(64);
        RefreshToken::create([
            'user_id' => $user->id,
            'token' => hash('sha256', $rawRefreshToken),
            'expires_at' => now()->addDays(self::REFRESH_TOKEN_EXPIRY_DAYS),
            'ip_address' => $ip,
            'user_agent' => $userAgent,
        ]);

        return [
            'access_token' => $accessToken->plainTextToken,
            'refresh_token' => $rawRefreshToken,
        ];
    }

    /**
     * Generate a secure random numeric OTP code.
     */
    private function generateOtpCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::OTP_LENGTH, '0', STR_PAD_LEFT);
    }
}
