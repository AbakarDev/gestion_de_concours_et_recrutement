<?php

namespace App\Services;

use App\Models\Prescreening;
use App\Models\Application;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;

class PrescreeningService
{
    /**
     * Marque une candidature comme retenue ou non retenue en présélection.
     */
    public function updateDecision(int $applicationId, string $decision, ?string $comment): Prescreening
    {
        return DB::transaction(function () use ($applicationId, $decision, $comment) {
            $application = Application::findOrFail($applicationId);

            $prescreening = Prescreening::firstOrNew(['application_id' => $applicationId]);

            if ($prescreening->exists && $prescreening->isLocked()) {
                throw new \Exception('La décision de présélection est déjà verrouillée.');
            }

            $prescreening->recruiter_id = auth()->id();
            $prescreening->decision = $decision;
            $prescreening->comment = $comment;
            $prescreening->decided_at = now();
            $prescreening->save();

            AuditLog::record('prescreening.updated', $prescreening);

            return $prescreening;
        });
    }

    /**
     * Verrouille définitivement la décision de présélection.
     */
    public function lockDecision(int $applicationId): Prescreening
    {
        return DB::transaction(function () use ($applicationId) {
            $prescreening = Prescreening::where('application_id', $applicationId)->firstOrFail();
            
            if ($prescreening->isLocked()) {
                return $prescreening;
            }

            $prescreening->update(['locked_at' => now()]);

            // Mettre à jour le statut de la candidature en fonction
            $application = $prescreening->application;
            if ($prescreening->decision === 'retained') {
                $application->update(['status' => 'accepted']);
            } elseif ($prescreening->decision === 'rejected') {
                $application->update([
                    'status' => 'rejected',
                    'rejection_reason' => $prescreening->comment ?? 'Profil non retenu après présélection.'
                ]);
            }

            AuditLog::record('prescreening.locked', $prescreening);

            return $prescreening;
        });
    }
}
