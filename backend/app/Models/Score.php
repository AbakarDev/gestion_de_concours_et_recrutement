<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Score extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'jury_id',
        'epreuve',
        'note',
        'commentaire',
        'locked_at',
        'integrity_hash',
        'hashed_at',
    ];

    protected function casts(): array
    {
        return [
            'note'      => 'decimal:2',
            'locked_at' => 'datetime',
            'hashed_at' => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function jury(): BelongsTo
    {
        return $this->belongsTo(User::class, 'jury_id');
    }

    public function isLocked(): bool
    {
        return $this->locked_at !== null;
    }

    /**
     * HMAC-SHA256 : candidature|épreuve|note|jury|timestamp Unix, clé = APP_KEY.
     * Recalculable pour vérifier qu'aucun de ces champs n'a été altéré hors du flux officiel.
     */
    public static function computeIntegrityHash(
        int $applicationId,
        string $epreuve,
        float $note,
        int $juryId,
        int $hashedAtTimestamp,
    ): string {
        $payload = implode('|', [
            $applicationId,
            $epreuve,
            number_format($note, 2, '.', ''),
            $juryId,
            $hashedAtTimestamp,
        ]);

        return hash_hmac('sha256', $payload, (string) config('app.key'));
    }

    public function integrityHolds(): bool
    {
        if (! $this->integrity_hash || ! $this->hashed_at || ! $this->jury_id) {
            return false;
        }

        $expected = self::computeIntegrityHash(
            $this->application_id,
            $this->epreuve,
            (float) $this->note,
            $this->jury_id,
            $this->hashed_at->getTimestamp(),
        );

        return hash_equals($expected, $this->integrity_hash);
    }
}
