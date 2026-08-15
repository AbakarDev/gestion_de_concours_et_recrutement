<?php

namespace App\DTO;

use Illuminate\Http\Request;

class VerifyOtpDTO extends BaseDTO
{
    public function __construct(
        public readonly string $email,
        public readonly string $otp_code,
        public readonly string $channel, // 'sms' or 'email'
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            email: $request->validated('email'),
            otp_code: $request->validated('otp_code'),
            channel: $request->validated('channel', 'email'),
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'],
            otp_code: $data['otp_code'],
            channel: $data['channel'] ?? 'email',
        );
    }
}
