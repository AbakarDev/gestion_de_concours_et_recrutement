<?php

namespace App\Actions;

use App\Enums\ApplicationStatus;
use App\Enums\DocumentType;
use App\Models\Application;
use App\Models\Document;
use App\Models\JobOffer;
use App\Models\User;
use App\Services\DossierCompletenessService;
use App\Services\StaffNotifier;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class SubmitApplicationAction extends BaseAction
{
    public function __construct(
        private DossierCompletenessService $completeness,
        private EnsureCandidateProfileAction $ensureCandidate,
        private GenerateOfficialCvAction $generateCv,
        private GenerateCoverLetterAction $generateLetter,
    ) {}

    /**
     * Dépose un dossier complet : une candidature par couple user/offre, uniquement
     * si l'avis est ouvert et si toutes les pièces ministérielles exigées sont présentes.
     */
    public function execute(
        User $user,
        int $jobOfferId,
        ?string $motivationObjet = null,
        ?string $motivationCorps = null,
    ): Application {
        $jobOffer = JobOffer::with('competition')->find($jobOfferId);

        if (! $jobOffer) {
            throw ValidationException::withMessages([
                'job_offer_id' => ['Offre introuvable.'],
            ]);
        }

        if (! $jobOffer->isOpenForApplications()) {
            throw ValidationException::withMessages([
                'job_offer_id' => ["Cette offre n'est pas ouverte aux candidatures."],
            ]);
        }

        if ($jobOffer->competition && ! $jobOffer->competition->isOpenForApplications()) {
            throw ValidationException::withMessages([
                'job_offer_id' => ["La fenêtre de candidature de ce concours est fermée."],
            ]);
        }

        $candidate = $this->ensureCandidate->execute($user);
        $user->setRelation('candidate', $candidate->load(['diplomas', 'documents', 'experiences']));

        $missing = $this->completeness->missingLabels(
            $user,
            $jobOffer->competition,
            $motivationCorps,
        );

        if ($missing !== []) {
            throw ValidationException::withMessages([
                'dossier' => [
                    'Dossier incomplet. Pièces manquantes : '.implode(', ', $missing).'.',
                ],
            ]);
        }

        try {
            $application = DB::transaction(function () use ($user, $candidate, $jobOffer, $jobOfferId, $motivationObjet, $motivationCorps) {
                $existing = Application::where('user_id', $user->id)
                    ->where('job_offer_id', $jobOfferId)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    throw ValidationException::withMessages([
                        'job_offer_id' => ['Vous avez déjà postulé à cette offre.'],
                    ]);
                }

                $application = Application::create([
                    'user_id' => $user->id,
                    'job_offer_id' => $jobOfferId,
                    'application_number' => 'APP-' . strtoupper(uniqid()),
                    'status' => ApplicationStatus::SUBMITTED,
                    'submitted_at' => now(),
                    'motivation_objet' => $motivationObjet,
                    'motivation_corps' => $motivationCorps,
                ]);

                $cvPath = $this->generateCv->execute($user, $application);
                $letterPath = null;
                $required = $this->completeness->requiredCodes($jobOffer->competition);
                if (in_array(DocumentType::LettreCandidature->value, $required, true) && filled($motivationCorps)) {
                    $letterPath = $this->generateLetter->execute($application);
                }

                $application->update([
                    'cv_pdf_path' => $cvPath,
                    'letter_pdf_path' => $letterPath,
                    'dossier_frozen_at' => now(),
                ]);

                $this->freezePieces($candidate->fresh('documents'), $application, $required, $cvPath, $letterPath);

                return $application->load(['user', 'jobOffer.competition', 'documents']);
            });

            app(StaffNotifier::class)->newApplication($application);

            return $application;
        } catch (UniqueConstraintViolationException $e) {
            throw ValidationException::withMessages([
                'job_offer_id' => ['Vous avez déjà postulé à cette offre.'],
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000' || str_contains($e->getMessage(), 'UNIQUE')) {
                throw ValidationException::withMessages([
                    'job_offer_id' => ['Vous avez déjà postulé à cette offre.'],
                ]);
            }
            throw $e;
        }
    }

    /**
     * Copie les pièces du coffre-fort vers le dossier figé de la candidature.
     *
     * @param  list<string>  $required
     */
    private function freezePieces($candidate, Application $application, array $required, string $cvPath, ?string $letterPath): void
    {
        $this->attachFrozen($application, $candidate->id, DocumentType::CvOfficiel, $cvPath);

        if ($letterPath) {
            $this->attachFrozen($application, $candidate->id, DocumentType::LettreCandidature, $letterPath);
        }

        foreach ($candidate->documents as $document) {
            $type = DocumentType::fromLegacy((string) $document->type);
            if (! $type || $type->isGenerated()) {
                continue;
            }
            if (! in_array($type->value, $required, true)) {
                continue;
            }
            if (! $document->path || ! Storage::disk('public')->exists($document->path)) {
                continue;
            }

            $extension = pathinfo($document->path, PATHINFO_EXTENSION) ?: 'pdf';
            $frozenPath = 'dossiers/'.$application->application_number.'/'.$type->value.'_'.$document->id.'.'.$extension;
            Storage::disk('public')->copy($document->path, $frozenPath);
            $this->attachFrozen($application, $candidate->id, $type, $frozenPath);
        }
    }

    private function attachFrozen(Application $application, int $candidateId, DocumentType $type, string $path): void
    {
        Document::create([
            'candidate_id' => $candidateId,
            'application_id' => $application->id,
            'type' => $type->value,
            'path' => $path,
            'status' => 'en attente',
        ]);
    }
}
