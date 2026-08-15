<?php

namespace App\Actions;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\JobOffer;
use App\Models\User;
use App\Services\StaffNotifier;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmitApplicationAction extends BaseAction
{
    /**
     * Dépose une candidature si l'offre et le concours sont ouverts, une seule fois par couple user/offre.
     */
    public function execute(User $user, int $jobOfferId): Application
    {
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

        try {
            $application = DB::transaction(function () use ($user, $jobOfferId) {
                $existing = Application::where('user_id', $user->id)
                    ->where('job_offer_id', $jobOfferId)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    throw ValidationException::withMessages([
                        'job_offer_id' => ['Vous avez déjà postulé à cette offre.'],
                    ]);
                }

                return Application::create([
                    'user_id' => $user->id,
                    'job_offer_id' => $jobOfferId,
                    'application_number' => 'APP-' . strtoupper(uniqid()),
                    'status' => ApplicationStatus::SUBMITTED,
                    'submitted_at' => now(),
                ]);
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
}
