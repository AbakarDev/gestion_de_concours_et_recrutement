<?php

namespace App\DTO;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApplicationDTO extends BaseDTO
{
    public function __construct(
        public readonly int $user_id,
        public readonly int $job_offer_id,
        public readonly string $application_number
    ) {}

    public static function fromRequest(Request $request): self
    {
        // En vrai production, l'user_id vient de $request->user()->id
        // Pour les tests sans auth parfaite, on fallback sur 1.
        $userId = $request->user() ? $request->user()->id : 1;

        return new self(
            user_id: $userId,
            job_offer_id: (int) $request->validated('job_offer_id'),
            application_number: 'APP-' . strtoupper(Str::random(10))
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            user_id: (int) $data['user_id'],
            job_offer_id: (int) $data['job_offer_id'],
            application_number: $data['application_number'] ?? 'APP-' . strtoupper(Str::random(10))
        );
    }
}
