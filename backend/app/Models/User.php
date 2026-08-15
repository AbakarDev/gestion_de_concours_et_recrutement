<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Enums\RoleName;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $guard_name = 'sanctum';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'nin',
        'phone',
        'otp_code',
        'otp_expires_at',
        'otp_channel',
        'phone_verified_at',
        'is_active',
        'failed_login_attempts',
        'locked_until',
        'last_login_at',
        'last_login_ip',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'otp_code',
        'otp_expires_at',
        'otp_channel',
        'failed_login_attempts',
        'locked_until',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'locked_until' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'failed_login_attempts' => 'integer',
        ];
    }

    // ─── Relationships ─────────────────────────────────────────────

    public function refreshTokens()
    {
        return $this->hasMany(RefreshToken::class);
    }

    public function authAuditLogs()
    {
        return $this->hasMany(AuthAuditLog::class);
    }

    public function candidate()
    {
        return $this->hasOne(Candidate::class);
    }

    // ─── Business Logic Helpers ────────────────────────────────────

    /**
     * Check if the account is currently locked.
     */
    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    /**
     * Check if the OTP code is valid and not expired.
     */
    public function isOtpValid(string $code): bool
    {
        return $this->otp_code === $code
            && $this->otp_expires_at
            && $this->otp_expires_at->isFuture();
    }

    /**
     * Clear OTP fields after successful verification.
     */
    public function clearOtp(): void
    {
        $this->update([
            'otp_code' => null,
            'otp_expires_at' => null,
            'otp_channel' => null,
        ]);
    }

    /**
     * Increment failed login attempts, lock account if threshold exceeded.
     */
    public function incrementFailedAttempts(int $maxAttempts = 5, int $lockMinutes = 15): void
    {
        $this->increment('failed_login_attempts');

        if ($this->failed_login_attempts >= $maxAttempts) {
            $this->update([
                'locked_until' => now()->addMinutes($lockMinutes),
                'failed_login_attempts' => 0,
            ]);
        }
    }

    /**
     * Reset failed login attempts on successful login.
     */
    public function resetFailedAttempts(): void
    {
        $this->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    /**
     * Get user's full name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function isStaff(): bool
    {
        return $this->hasAnyRole(RoleName::staff());
    }

    public function isJuryOnly(): bool
    {
        return $this->hasRole(RoleName::Jury->value)
            && ! $this->hasAnyRole([
                RoleName::SuperAdmin->value,
                RoleName::Administrateur->value,
                RoleName::ResponsableConcours->value,
                RoleName::Recruteur->value,
            ]);
    }
}
