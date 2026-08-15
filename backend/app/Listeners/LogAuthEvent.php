<?php

namespace App\Listeners;

use App\Events\AuthEvent;
use App\Models\AuthAuditLog;
use Illuminate\Contracts\Queue\ShouldQueue;

class LogAuthEvent implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(AuthEvent $event): void
    {
        AuthAuditLog::create([
            'user_id' => $event->user?->id,
            'event' => $event->event,
            'ip_address' => $event->ipAddress,
            'user_agent' => $event->userAgent,
            'metadata' => $event->metadata,
            'success' => $event->success,
            'failure_reason' => $event->failureReason,
        ]);
    }
}
