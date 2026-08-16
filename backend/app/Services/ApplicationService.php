<?php

namespace App\Services;

use App\Enums\ApplicationStatus;
use App\Interfaces\ApplicationRepositoryInterface;
use App\Models\Application;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\AuditLog;
use App\Models\ApplicationStatusHistory;
use App\Events\ApplicationStatusChanged;

class ApplicationService extends BaseService
{
    public function __construct(ApplicationRepositoryInterface $repository)
    {
        parent::__construct($repository);
    }

    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        /** @var \App\Interfaces\ApplicationRepositoryInterface $repo */
        $repo = $this->repository;
        return $repo->getPaginatedWithFilters($filters, $perPage);
    }

    public function getById(int $id): ?Application
    {
        return $this->repository->find($id);
    }

    public function updateStatus(int $id, ApplicationStatus $status, ?string $notes = null, ?string $rejectionReason = null): Application
    {
        return DB::transaction(function () use ($id, $status, $notes, $rejectionReason) {
            $application = $this->repository->find($id);
            
            if (!$application) {
                throw ValidationException::withMessages(['id' => 'Candidature introuvable.']);
            }

            // Vérifier que si rejeté, le motif est fourni
            if ($status === ApplicationStatus::REJECTED && empty($rejectionReason)) {
                throw ValidationException::withMessages(['rejection_reason' => 'Le motif de rejet est obligatoire.']);
            }

            $application->loadMissing(['jobOffer.competition', 'payment']);

            $blocksInstruction = in_array($status, [
                ApplicationStatus::UNDER_REVIEW,
                ApplicationStatus::ACCEPTED,
                ApplicationStatus::EVALUATED,
            ], true);

            if ($blocksInstruction && ! $application->isPaymentConfirmed()) {
                throw ValidationException::withMessages([
                    'payment' => ['Le paiement des frais de dossier n\'est pas confirmé. L\'instruction est bloquée.'],
                ]);
            }

            $oldStatus = $application->status->value;
            $newStatus = $status->value;

            // Mise à jour de la candidature
            $updateData = [
                'status' => $newStatus,
                'admin_notes' => $notes,
            ];
            
            if ($status === ApplicationStatus::REJECTED) {
                $updateData['rejection_reason'] = $rejectionReason;
            }

            $this->repository->update($id, $updateData);

            // Enregistrer l'historique
            ApplicationStatusHistory::create([
                'application_id' => $id,
                'changed_by' => auth()->id(),
                'from_status' => $oldStatus,
                'to_status' => $newStatus,
                'reason' => $status === ApplicationStatus::REJECTED ? $rejectionReason : $notes,
                'ip_address' => request()?->ip(),
            ]);

            // Logger l'action métier
            AuditLog::record(
                'application.status_changed',
                $application,
                ['status' => $oldStatus],
                ['status' => $newStatus]
            );

            $fresh = $this->repository->find($id);

            DB::afterCommit(function () use ($fresh, $oldStatus, $newStatus) {
                event(new ApplicationStatusChanged($fresh, $oldStatus, $newStatus));
            });

            return $fresh;
        });
    }

    public function delete(int $id): bool
    {
        $application = $this->repository->find($id);
        
        if (!$application) {
            throw ValidationException::withMessages(['id' => 'Candidature introuvable.']);
        }
        
        return $this->repository->delete($id);
    }
}
