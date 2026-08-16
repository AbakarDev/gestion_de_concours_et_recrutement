<?php

namespace App\Services;

use App\Enums\DocumentType;
use App\Models\Candidate;
use App\Models\Competition;
use App\Models\JobOffer;
use App\Models\User;

class DossierCompletenessService
{
    /**
     * Checklist ministérielle : pièces de l'avis + socle d'état civil.
     *
     * @return list<array{code: string, label: string, required: bool, present: bool, generated: bool, hint: string}>
     */
    public function checklist(User $user, ?Competition $competition = null, ?string $letterBody = null): array
    {
        $candidate = $user->candidate;
        $required = $this->requiredCodes($competition);
        $items = [];

        foreach ($required as $code) {
            $type = DocumentType::tryFrom($code);
            if (! $type) {
                continue;
            }
            $items[] = [
                'code' => $type->value,
                'label' => $type->label(),
                'required' => true,
                'present' => $this->isPresent($user, $candidate, $type, $letterBody),
                'generated' => $type->isGenerated(),
                'hint' => $this->hint($type),
            ];
        }

        return $items;
    }

    /**
     * @return list<string>
     */
    public function missingLabels(User $user, ?Competition $competition = null, ?string $letterBody = null): array
    {
        return collect($this->checklist($user, $competition, $letterBody))
            ->filter(fn (array $item) => $item['required'] && ! $item['present'])
            ->pluck('label')
            ->values()
            ->all();
    }

    public function isReady(User $user, ?Competition $competition = null, ?string $letterBody = null): bool
    {
        return $this->missingLabels($user, $competition, $letterBody) === [];
    }

    /**
     * @return list<string>
     */
    public function requiredCodes(?Competition $competition): array
    {
        $fromAvis = DocumentType::normalizeList($competition?->required_documents);

        if ($fromAvis === []) {
            $fromAvis = DocumentType::concoursDefaults();
        }

        // Socle toujours exigé pour un dépôt ministériel, même si l'avis est incomplet.
        $core = [
            DocumentType::PhotoIdentite->value,
            DocumentType::Cni->value,
            DocumentType::Diplome->value,
            DocumentType::CvOfficiel->value,
        ];

        return array_values(array_unique(array_merge($core, $fromAvis)));
    }

    private function isPresent(User $user, ?Candidate $candidate, DocumentType $type, ?string $letterBody): bool
    {
        return match ($type) {
            DocumentType::CvOfficiel => $this->canGenerateCv($candidate),
            DocumentType::LettreCandidature => is_string($letterBody) && mb_strlen(trim($letterBody)) >= 200,
            DocumentType::PhotoIdentite => filled($candidate?->photo_path) || $this->hasVaultDocument($candidate, $type),
            DocumentType::Diplome => $this->hasDiplomaProof($candidate),
            default => $this->hasVaultDocument($candidate, $type),
        };
    }

    public function canGenerateCv(?Candidate $candidate): bool
    {
        if (! $candidate) {
            return false;
        }

        return $candidate->hasCivilStatus()
            && $candidate->diplomas()->exists();
    }

    private function hasDiplomaProof(?Candidate $candidate): bool
    {
        if (! $candidate) {
            return false;
        }

        $hasStructured = $candidate->diplomas()
            ->whereNotNull('document_id')
            ->exists();

        return $hasStructured || $this->hasVaultDocument($candidate, DocumentType::Diplome);
    }

    private function hasVaultDocument(?Candidate $candidate, DocumentType $type): bool
    {
        if (! $candidate) {
            return false;
        }

        return $candidate->documents()->where('type', $type->value)->exists();
    }

    private function hint(DocumentType $type): string
    {
        return match ($type) {
            DocumentType::CvOfficiel => 'Généré automatiquement à partir de votre état civil, diplômes et expériences.',
            DocumentType::LettreCandidature => 'Rédigée dans le formulaire de candidature (style administratif, 200 caractères minimum).',
            DocumentType::PhotoIdentite => 'Photo récente, fond uni, visage dégagé — format d’identité.',
            DocumentType::Cni => 'Recto et verso de la carte nationale d’identité en cours de validité.',
            DocumentType::Diplome => 'Déclarez le diplôme dans votre cursus et joignez la copie scannée.',
            default => 'Téléversez la pièce officielle (PDF ou image lisible).',
        };
    }

    public function competitionFromOffer(JobOffer $jobOffer): ?Competition
    {
        return $jobOffer->relationLoaded('competition')
            ? $jobOffer->competition
            : $jobOffer->competition()->first();
    }
}
