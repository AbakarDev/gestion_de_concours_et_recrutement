<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'job_offer_id',
        'application_number',
        'anonymat_number',
        'status',
        'admin_notes',
        'rejection_reason',
        'motivation_objet',
        'motivation_corps',
        'cv_pdf_path',
        'letter_pdf_path',
        'dossier_frozen_at',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'status'            => ApplicationStatus::class,
            'submitted_at'      => 'datetime',
            'dossier_frozen_at' => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobOffer(): BelongsTo
    {
        return $this->belongsTo(JobOffer::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function scores(): HasMany
    {
        return $this->hasMany(Score::class);
    }

    public function convocation(): HasOne
    {
        return $this->hasOne(Convocation::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(ApplicationStatusHistory::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(Result::class);
    }

    public function prescreening(): HasOne
    {
        return $this->hasOne(Prescreening::class);
    }

    // ── Business Logic ───────────────────────────────────────────────

    /**
     * Vérifie si le paiement requis est confirmé.
     */
    public function isPaymentConfirmed(): bool
    {
        $this->loadMissing(['jobOffer.competition', 'payment']);

        if (!$this->jobOffer) {
            return true;
        }

        $feeRequired = $this->jobOffer->fee_required
            || ($this->jobOffer->competition?->fee_required ?? false);

        if (!$feeRequired) {
            return true;
        }

        return $this->payment && $this->payment->status === 'confirmed';
    }

    /**
     * Génère et attribue un numéro d'anonymat unique.
     */
    public function generateAnonymatNumber(): void
    {
        if ($this->anonymat_number) {
            return; // déjà assigné
        }

        $prefix = 'ANON-' . now()->format('Y');
        do {
            $number = $prefix . '-' . str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (static::where('anonymat_number', $number)->exists());

        $this->update(['anonymat_number' => $number]);
    }
}
