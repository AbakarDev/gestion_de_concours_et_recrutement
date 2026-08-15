<?php

namespace App\DTO;

use Illuminate\Http\Request;

class SendOtpDTO extends BaseDTO
{
    public function __construct(
        public readonly string $email,
        public readonly string $channel, // 'sms' or 'email'
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            email: $request->validated('email'),
            channel: $request->validated('channel', 'email'),
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'],
            channel: $data['channel'] ?? 'email',
        );
    }
}
