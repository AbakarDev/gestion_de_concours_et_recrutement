<?php

namespace App\Models;

use App\Enums\CompetitionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Competition extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'ministry',
        'title',
        'reference',
        'description',
        'quota',
        'required_documents',
        'start_date',
        'end_date',
        'registration_open_date',
        'registration_close_date',
        'fee_required',
        'fee_amount',
        'published_at',
        'results_published_at',
        'results_locked_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_date'              => 'date',
            'end_date'                => 'date',
            'registration_open_date'  => 'date',
            'registration_close_date' => 'date',
            'published_at'            => 'datetime',
            'results_published_at'    => 'datetime',
            'results_locked_at'       => 'datetime',
            'required_documents'      => 'array',
            'status'                  => CompetitionStatus::class,
            'fee_required'            => 'boolean',
            'fee_amount'              => 'decimal:2',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function jobOffers(): HasMany
    {
        return $this->hasMany(JobOffer::class);
    }

    // ── Business Logic ───────────────────────────────────────────────

    /**
     * Vérifie si la fenêtre de candidature est ouverte.
     */
    public function isOpenForApplications(): bool
    {
        if ($this->status !== CompetitionStatus::PUBLISHED && $this->status !== CompetitionStatus::OPEN) {
            return false;
        }

        $now = now()->startOfDay();
        $openDate  = $this->registration_open_date  ?? $this->start_date;
        $closeDate = $this->registration_close_date ?? $this->end_date;

        if (! $openDate || ! $closeDate) {
            return false;
        }

        return $now->between($openDate->copy()->startOfDay(), $closeDate->copy()->endOfDay());
    }

    /**
     * Vérifie si les résultats sont verrouillés.
     */
    public function areResultsLocked(): bool
    {
        return $this->results_locked_at !== null;
    }
}
