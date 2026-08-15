<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuthEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $event,
        public readonly ?User $user = null,
        public readonly bool $success = true,
        public readonly ?string $failureReason = null,
        public readonly ?string $ipAddress = null,
        public readonly ?string $userAgent = null,
        public readonly array $metadata = [],
    ) {}
}
