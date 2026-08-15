<?php

namespace App\DTO;

use Illuminate\Http\Request;

class ForgotPasswordDTO extends BaseDTO
{
    public function __construct(
        public readonly string $email
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            email: $request->validated('email')
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email']
        );
    }
}
