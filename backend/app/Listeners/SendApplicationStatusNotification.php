<?php

namespace App\Listeners;

use App\Events\ApplicationStatusChanged;
use App\Notifications\ApplicationStatusNotification;
use App\Services\StaffNotifier;

class SendApplicationStatusNotification
{
    public function __construct(private StaffNotifier $staffNotifier) {}

    public function handle(ApplicationStatusChanged $event): void
    {
        $application = $event->application->loadMissing(['user', 'jobOffer']);

        if ($application->user) {
            try {
                $application->user->notify(
                    new ApplicationStatusNotification($application, $event->oldStatus, $event->newStatus)
                );
            } catch (\Throwable $e) {
                report($e);
            }
        }

        if ($event->newStatus === 'accepted') {
            $this->staffNotifier->evaluationReady($application);
        }
    }
}
