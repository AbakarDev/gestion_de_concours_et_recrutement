<?php

namespace App\Enums;

/**
 * Catalogue des pièces d'un dossier de concours / recrutement public.
 * Les codes sont stockés en base ; les libellés officiels s'affichent à l'UI.
 *
 * Les libellés historiques (CV, CNI, etc.) sont normalisés via fromLegacy().
 */
enum DocumentType: string
{
    case PhotoIdentite = 'photo_identite';
    case Cni = 'cni';
    case ActeNaissance = 'acte_naissance';
    case CertificatNationalite = 'certificat_nationalite';
    case CertificatResidence = 'certificat_residence';
    case Diplome = 'diplome';
    case ReleveNotes = 'releve_notes';
    case CasierJudiciaire = 'casier_judiciaire';
    case CertificatMedical = 'certificat_medical';
    case Quittance = 'quittance';
    case CvOfficiel = 'cv_officiel';
    case LettreCandidature = 'lettre_candidature';

    public function label(): string
    {
        return match ($this) {
            self::PhotoIdentite => 'Photo d\'identité',
            self::Cni => 'Carte nationale d\'identité (recto-verso)',
            self::ActeNaissance => 'Acte de naissance',
            self::CertificatNationalite => 'Certificat de nationalité',
            self::CertificatResidence => 'Certificat de résidence',
            self::Diplome => 'Copie du diplôme exigé',
            self::ReleveNotes => 'Relevé de notes',
            self::CasierJudiciaire => 'Casier judiciaire (bulletin n°3)',
            self::CertificatMedical => 'Certificat de visite médicale',
            self::Quittance => 'Quittance des droits d\'inscription',
            self::CvOfficiel => 'Curriculum vitae administratif',
            self::LettreCandidature => 'Lettre de candidature',
        };
    }

    public function category(): string
    {
        return match ($this) {
            self::PhotoIdentite, self::Cni, self::ActeNaissance,
            self::CertificatNationalite, self::CertificatResidence => 'etat_civil',
            self::Diplome, self::ReleveNotes => 'formation',
            self::CasierJudiciaire, self::CertificatMedical, self::Quittance => 'administratif',
            self::CvOfficiel, self::LettreCandidature => 'genere',
        };
    }

    public function categoryLabel(): string
    {
        return match ($this->category()) {
            'etat_civil' => 'État civil',
            'formation' => 'Formation',
            'administratif' => 'Pièces administratives',
            'genere' => 'Documents générés par la plateforme',
            default => 'Autres',
        };
    }

    /** Pièce produite par un formulaire interne, pas par un téléversement libre. */
    public function isGenerated(): bool
    {
        return in_array($this, [self::CvOfficiel, self::LettreCandidature], true);
    }

    public function acceptMimes(): array
    {
        return $this === self::PhotoIdentite
            ? ['jpg', 'jpeg', 'png']
            : ['pdf', 'jpg', 'jpeg', 'png'];
    }

    public static function codes(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Socle ministériel proposé par défaut à la création d'un concours.
     *
     * @return list<string>
     */
    public static function concoursDefaults(): array
    {
        return [
            self::PhotoIdentite->value,
            self::Cni->value,
            self::ActeNaissance->value,
            self::Diplome->value,
            self::CasierJudiciaire->value,
            self::CvOfficiel->value,
        ];
    }

    /**
     * Recrutement direct : même socle + lettre de candidature.
     *
     * @return list<string>
     */
    public static function recrutementDefaults(): array
    {
        return array_merge(self::concoursDefaults(), [self::LettreCandidature->value]);
    }

    public static function fromLegacy(string $raw): ?self
    {
        $normalized = mb_strtolower(trim($raw));

        return match ($normalized) {
            'photo_identite', 'photo', 'photo d\'identité', 'photo d’identité' => self::PhotoIdentite,
            'cni', 'copie cni', 'carte nationale d\'identité', 'carte nationale d’identité' => self::Cni,
            'acte_naissance', 'acte de naissance' => self::ActeNaissance,
            'certificat_nationalite', 'certificat de nationalité', 'certificat de nationalite' => self::CertificatNationalite,
            'certificat_residence', 'certificat de résidence', 'certificat de residence', 'attestation' => self::CertificatResidence,
            'diplome', 'diplôme', 'copie diplôme', 'copie diplome' => self::Diplome,
            'releve_notes', 'relevé de notes', 'releve de notes' => self::ReleveNotes,
            'casier_judiciaire', 'casier judiciaire', 'bulletin n°3', 'bulletin n3' => self::CasierJudiciaire,
            'certificat_medical', 'certificat de visite médicale', 'certificat medical' => self::CertificatMedical,
            'quittance', 'quittance de paiement' => self::Quittance,
            'cv_officiel', 'cv', 'curriculum vitae' => self::CvOfficiel,
            'lettre_candidature', 'lettre de motivation', 'lettre de candidature' => self::LettreCandidature,
            default => self::tryFrom($raw),
        };
    }

    /**
     * @param  list<string>|null  $raw
     * @return list<string>
     */
    public static function normalizeList(?array $raw): array
    {
        if (! $raw) {
            return [];
        }

        $codes = [];
        foreach ($raw as $item) {
            $type = is_string($item) ? self::fromLegacy($item) : null;
            if ($type) {
                $codes[] = $type->value;
            }
        }

        return array_values(array_unique($codes));
    }

    /**
     * @return list<array{code: string, label: string, category: string, category_label: string, generated: bool, accept: list<string>}>
     */
    public static function catalog(): array
    {
        return array_map(fn (self $type) => [
            'code' => $type->value,
            'label' => $type->label(),
            'category' => $type->category(),
            'category_label' => $type->categoryLabel(),
            'generated' => $type->isGenerated(),
            'accept' => $type->acceptMimes(),
        ], self::cases());
    }
}
