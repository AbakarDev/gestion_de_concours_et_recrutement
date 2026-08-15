<?php

namespace App\Models;

use App\Enums\CompetitionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class JobOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'title',
        'description',
        'positions_count',
        'location',
        'requirements',
        'fee_required',
        'fee_amount',
        'closing_date',
        'decision_locked_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'requirements'       => 'array',
            'fee_required'       => 'boolean',
            'fee_amount'         => 'decimal:2',
            'closing_date'       => 'date',
            'decision_locked_at' => 'datetime',
            'status'             => CompetitionStatus::class,
        ];
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    // ── Business Logic ───────────────────────────────────────────────

    /**
     * Vérifie si l'offre est ouverte aux candidatures.
     */
    public function isOpenForApplications(): bool
    {
        if ($this->status !== CompetitionStatus::PUBLISHED && $this->status !== CompetitionStatus::OPEN) {
            return false;
        }

        if ($this->closing_date && now()->startOfDay()->gt($this->closing_date)) {
            return false;
        }

        return true;
    }
}
