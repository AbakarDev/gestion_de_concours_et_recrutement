<?php

namespace App\Actions;

use App\Models\Application;
use App\Models\Score;
use App\Models\User;
use App\Events\ApplicationStatusChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordScoreAction extends BaseAction
{
    /**
     * Enregistre (ou met à jour) une note de jury et pose un cachet HMAC d'intégrité.
     * Le hash couvre : candidature + épreuve + note + évaluateur + horodatage.
     * Toute modification ultérieure de ces champs invaliderait le cachet.
     */
    public function execute(Application $application, User $jury, string $epreuve, float $note, ?string $commentaire): Score
    {
        return DB::transaction(function () use ($application, $jury, $epreuve, $note, $commentaire) {
            $application->loadMissing('result');
            $oldStatus = $application->status instanceof \BackedEnum
                ? $application->status->value
                : (string) $application->status;

            if ($application->result && $application->result->isLocked()) {
                throw ValidationException::withMessages([
                    'note' => ['Les résultats sont déjà publiés et verrouillés. Impossible de modifier les notes.'],
                ]);
            }

            $existingScore = Score::where('application_id', $application->id)
                ->where('epreuve', $epreuve)
                ->first();

            if ($existingScore && $existingScore->isLocked()) {
                throw ValidationException::withMessages([
                    'note' => ['Cette note a été verrouillée et ne peut plus être modifiée.'],
                ]);
            }

            $hashedAt = now();
            $integrityHash = Score::computeIntegrityHash(
                $application->id,
                $epreuve,
                $note,
                $jury->id,
                $hashedAt->getTimestamp(),
            );

            $score = Score::updateOrCreate(
                ['application_id' => $application->id, 'epreuve' => $epreuve],
                [
                    'jury_id' => $jury->id,
                    'note' => $note,
                    'commentaire' => $commentaire,
                    'integrity_hash' => $integrityHash,
                    'hashed_at' => $hashedAt,
                ]
            );

            $application->update(['status' => 'evaluated']);

            $score = $score->fresh();
            $fresh = $application->fresh();

            if ($oldStatus !== 'evaluated' && $fresh) {
                DB::afterCommit(function () use ($fresh, $oldStatus) {
                    event(new ApplicationStatusChanged($fresh, $oldStatus, 'evaluated'));
                });
            }

            return $score;
        });
    }
}
