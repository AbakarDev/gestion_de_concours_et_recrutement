<?php

namespace App\DTO;

use App\Enums\DiplomaLevel;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DiplomaDTO extends BaseDTO
{
    public function __construct(
        public readonly string $type_diplome,
        public readonly string $etablissement,
        public readonly int $annee,
        public readonly ?string $specialite,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $validated = $request->validate([
            'type_diplome' => ['required', 'string', Rule::in(DiplomaLevel::values())],
            'niveau' => ['nullable', 'string', 'max:100'],
            'etablissement' => ['required', 'string', 'max:255'],
            'annee' => ['required', 'integer', 'min:1950', 'max:'.(date('Y') + 1)],
            'specialite' => ['nullable', 'string', 'max:150'],
        ]);

        return self::fromArray($validated);
    }

    public static function fromArray(array $data): self
    {
        $type = $data['type_diplome'] ?? $data['niveau'] ?? DiplomaLevel::Autre->value;

        return new self(
            type_diplome: $type,
            etablissement: $data['etablissement'],
            annee: (int) $data['annee'],
            specialite: $data['specialite'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'type_diplome' => $this->type_diplome,
            'niveau' => $this->type_diplome,
            'etablissement' => $this->etablissement,
            'annee' => $this->annee,
            'specialite' => $this->specialite,
        ];
    }
}
