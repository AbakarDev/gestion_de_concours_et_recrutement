<?php

namespace App\DTO;

use Illuminate\Http\Request;

class ExperienceDTO extends BaseDTO
{
    public function __construct(
        public readonly string $poste,
        public readonly string $employeur,
        public readonly string $date_debut,
        public readonly ?string $date_fin,
        public readonly ?string $description,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $validated = $request->validate([
            'poste' => ['required', 'string', 'max:150'],
            'employeur' => ['required', 'string', 'max:150'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        return self::fromArray($validated);
    }

    public static function fromArray(array $data): self
    {
        return new self(
            poste: $data['poste'],
            employeur: $data['employeur'],
            date_debut: $data['date_debut'],
            date_fin: $data['date_fin'] ?? null,
            description: $data['description'] ?? null,
        );
    }
}
