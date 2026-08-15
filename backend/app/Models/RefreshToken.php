<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RefreshToken extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'expires_at',
        'revoked',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this refresh token is still valid.
     */
    public function isValid(): bool
    {
        return !$this->revoked && $this->expires_at->isFuture();
    }

    /**
     * Revoke this refresh token.
     */
    public function revoke(): bool
    {
        return $this->update(['revoked' => true]);
    }
}
