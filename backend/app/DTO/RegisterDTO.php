<?php

namespace App\DTO;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class RegisterDTO extends BaseDTO
{
    public function __construct(
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $email,
        public readonly string $password,
        public readonly ?string $nin = null,
        public readonly ?string $phone = null
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            first_name: $request->validated('first_name'),
            last_name: $request->validated('last_name'),
            email: $request->validated('email'),
            password: Hash::make($request->validated('password')),
            nin: $request->validated('nin'),
            phone: $request->validated('phone')
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            first_name: $data['first_name'],
            last_name: $data['last_name'],
            email: $data['email'],
            password: Hash::make($data['password']),
            nin: $data['nin'] ?? null,
            phone: $data['phone'] ?? null
        );
    }
}
