<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * Alerte in-app pour le personnel (database uniquement).
 * Pas d'e-mail / SMS : une panne SMTP ne doit pas bloquer la cloche.
 */
class StaffAlertNotification extends Notification
{
    public function __construct(
        public string $message,
        public array $payload = [],
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return array_merge($this->payload, [
            'message' => $this->message,
        ]);
    }
}
