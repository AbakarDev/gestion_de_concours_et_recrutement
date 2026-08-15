<?php

namespace App\Actions;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Services\ApplicationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateApplicationStatusAction extends BaseAction
{
    public function __construct(
        private ApplicationService $applicationService,
        private GenerateConvocationAction $generateConvocationAction,
    ) {}

    /**
     * Change le statut, journalise l'historique, et si acceptation :
     * numéro d'anonymat + convocation PDF dans la même transaction.
     */
    public function execute(
        Application $application,
        ApplicationStatus $status,
        ?string $adminNotes,
        ?string $rejectionReason,
    ): Application {
        $application->loadMissing(['jobOffer.competition', 'payment']);

        if (in_array($status, [
            ApplicationStatus::ACCEPTED,
            ApplicationStatus::UNDER_REVIEW,
            ApplicationStatus::EVALUATED,
        ], true) && ! $application->isPaymentConfirmed()) {
            throw ValidationException::withMessages([
                'status' => ["Le paiement requis pour cette candidature n'est pas confirmé. L'instruction est bloquée."],
            ]);
        }

        return DB::transaction(function () use ($application, $status, $adminNotes, $rejectionReason) {
            $updated = $this->applicationService->updateStatus(
                $application->id,
                $status,
                $adminNotes,
                $rejectionReason,
            );

            if ($updated->status === ApplicationStatus::ACCEPTED) {
                $updated->loadMissing(['jobOffer.competition', 'user']);
                $updated->generateAnonymatNumber();
                $this->generateConvocationAction->execute($updated->fresh(['jobOffer.competition', 'user']));
            }

            return $updated->fresh([
                'user',
                'jobOffer.competition',
                'documents',
                'scores',
                'convocation',
                'statusHistory.changedBy',
            ]);
        });
    }
}
