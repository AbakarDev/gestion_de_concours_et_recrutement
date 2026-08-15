<?php

namespace App\DTO;

use Illuminate\Http\Request;

class DepartmentDTO extends BaseDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $code,
        public readonly ?int $parent_id = null
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            code: $request->validated('code'),
            parent_id: $request->validated('parent_id')
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            code: $data['code'],
            parent_id: $data['parent_id'] ?? null
        );
    }
}
