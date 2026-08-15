<?php

namespace App\Services;

use App\Enums\RoleName;
use App\Models\Application;
use App\Models\User;
use App\Notifications\StaffAlertNotification;

class StaffNotifier
{
    /**
     * @param  list<string>  $roles
     */
    public function notifyRoles(array $roles, StaffAlertNotification $notification, ?int $exceptUserId = null): void
    {
        User::role($roles, 'sanctum')
            ->where('is_active', true)
            ->when($exceptUserId, fn ($q) => $q->where('id', '!=', $exceptUserId))
            ->get()
            ->each(fn (User $user) => $user->notify($notification));
    }

    public function newApplication(Application $application): void
    {
        $application->loadMissing('jobOffer');
        $title = $application->jobOffer?->title ?? 'un poste';
        $number = $application->application_number ?? '#'.$application->id;

        $this->notifyRoles(
            [
                RoleName::SuperAdmin->value,
                RoleName::Administrateur->value,
                RoleName::ResponsableConcours->value,
                RoleName::Recruteur->value,
            ],
            new StaffAlertNotification(
                "Nouvelle candidature {$number} — {$title}",
                [
                    'type' => 'new_application',
                    'application_id' => $application->id,
                    'application_number' => $application->application_number,
                ],
            ),
        );
    }

    public function evaluationReady(Application $application): void
    {
        $label = $application->anonymat_number ?: 'anonyme';

        $this->notifyRoles(
            RoleName::evaluators(),
            new StaffAlertNotification(
                "Dossier {$label} accepté — prêt à évaluer.",
                [
                    'type' => 'evaluation_ready',
                    'application_id' => $application->id,
                    'anonymat_number' => $application->anonymat_number,
                ],
            ),
        );
    }
}
