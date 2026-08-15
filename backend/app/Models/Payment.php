<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'montant',
        'provider',
        'payment_type',
        'transaction_ref',
        'status',
        'webhook_payload',
        'confirmed_at',
        'failure_reason',
        'retry_count',
        'receipt_path',
    ];

    protected function casts(): array
    {
        return [
            'montant'         => 'decimal:2',
            'webhook_payload' => 'array',
            'confirmed_at'    => 'datetime',
            'retry_count'     => 'integer',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }
}
