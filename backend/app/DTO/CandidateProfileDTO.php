<?php

namespace App\DTO;

use Illuminate\Http\Request;

class CandidateProfileDTO extends BaseDTO
{
    public function __construct(
        public readonly ?string $date_naissance,
        public readonly ?string $lieu_naissance,
        public readonly ?string $nationalite,
        public readonly ?string $situation_familiale,
        public readonly ?string $sexe,
        public readonly ?string $adresse,
        public readonly ?array $langues,
        public readonly ?string $phone,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $validated = $request->validate([
            'date_naissance' => ['nullable', 'date', 'before:today'],
            'lieu_naissance' => ['nullable', 'string', 'max:150'],
            'nationalite' => ['nullable', 'string', 'max:100'],
            'situation_familiale' => ['nullable', 'in:celibataire,marie,veuf,divorce'],
            'sexe' => ['nullable', 'in:M,F'],
            'adresse' => ['nullable', 'string', 'max:500'],
            'langues' => ['nullable', 'array', 'max:10'],
            'langues.*.langue' => ['required_with:langues', 'string', 'max:80'],
            'langues.*.niveau' => ['required_with:langues', 'in:scolaire,intermediaire,courant'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        return self::fromArray($validated);
    }

    public static function fromArray(array $data): self
    {
        return new self(
            date_naissance: $data['date_naissance'] ?? null,
            lieu_naissance: $data['lieu_naissance'] ?? null,
            nationalite: $data['nationalite'] ?? 'Tchadienne',
            situation_familiale: $data['situation_familiale'] ?? null,
            sexe: $data['sexe'] ?? null,
            adresse: $data['adresse'] ?? null,
            langues: $data['langues'] ?? null,
            phone: $data['phone'] ?? null,
        );
    }

    public function candidatePayload(): array
    {
        return array_filter([
            'date_naissance' => $this->date_naissance,
            'lieu_naissance' => $this->lieu_naissance,
            'nationalite' => $this->nationalite,
            'situation_familiale' => $this->situation_familiale,
            'sexe' => $this->sexe,
            'adresse' => $this->adresse,
            'langues' => $this->langues,
        ], fn ($value) => $value !== null);
    }
}
