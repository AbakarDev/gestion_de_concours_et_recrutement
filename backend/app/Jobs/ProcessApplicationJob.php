<?php

namespace App\Jobs;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessApplicationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $applicationId
    ) {}

    public function handle(): void
    {
        $application = Application::with('jobOffer.criterias')->find($this->applicationId);

        if (!$application) {
            return;
        }

        // Simuler un traitement lourd (analyse des pièces jointes MinIO, évaluation stricte des critères)
        $application->update(['status' => 'processing']);
        
        Log::info("Début du traitement asynchrone de la candidature #{$application->id}");

        // Simulation de délai de traitement
        sleep(2);

        // Validation basique (simulée pour l'architecture)
        $isAccepted = (rand(1, 10) > 3);

        if ($isAccepted) {
            $application->update(['status' => 'accepted']);
            Log::info("Candidature #{$application->id} pré-approuvée avec succès.");
        } else {
            $application->update([
                'status' => 'rejected',
                'rejection_reason' => "Le dossier ne correspond pas aux critères stricts de l'offre (ex: Niveau d'expérience insuffisant)."
            ]);
            Log::info("Candidature #{$application->id} rejetée.");
        }
    }
}
