<?php

namespace App\DTO;

use Illuminate\Http\Request;

class LoginDTO extends BaseDTO
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
        public readonly string $device_name
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            email: $request->validated('email'),
            password: $request->validated('password'),
            device_name: $request->header('User-Agent', 'unknown-device')
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'],
            password: $data['password'],
            device_name: $data['device_name'] ?? 'unknown-device'
        );
    }
}
