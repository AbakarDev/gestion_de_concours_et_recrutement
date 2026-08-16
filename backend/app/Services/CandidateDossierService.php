<?php

namespace App\Services;

use App\Actions\EnsureCandidateProfileAction;
use App\Actions\GenerateOfficialCvAction;
use App\DTO\CandidateProfileDTO;
use App\DTO\DiplomaDTO;
use App\DTO\ExperienceDTO;
use App\Enums\DocumentType;
use App\Models\Candidate;
use App\Models\Diploma;
use App\Models\Document;
use App\Models\Experience;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CandidateDossierService
{
    public function __construct(
        private EnsureCandidateProfileAction $ensureCandidate,
        private DossierCompletenessService $completeness,
        private GenerateOfficialCvAction $generateCv,
    ) {}

    public function show(User $user, ?int $jobOfferId = null): array
    {
        $candidate = $this->ensureCandidate->execute($user);
        $candidate->load(['diplomas.document', 'experiences', 'documents', 'user']);

        $competition = null;
        if ($jobOfferId) {
            $offer = \App\Models\JobOffer::with('competition')->find($jobOfferId);
            $competition = $offer?->competition;
        }

        return [
            'profile' => $this->profilePayload($user, $candidate),
            'diplomas' => $candidate->diplomas,
            'experiences' => $candidate->experiences,
            'documents' => $candidate->documents,
            'completeness' => [
                'ready' => $this->completeness->isReady($user->fresh('candidate'), $competition),
                'can_generate_cv' => $this->completeness->canGenerateCv($candidate),
                'checklist' => $this->completeness->checklist($user->fresh(['candidate.diplomas', 'candidate.documents']), $competition),
            ],
            'document_types' => DocumentType::catalog(),
            'diploma_levels' => \App\Enums\DiplomaLevel::values(),
        ];
    }

    public function updateProfile(User $user, CandidateProfileDTO $dto): Candidate
    {
        return DB::transaction(function () use ($user, $dto) {
            $candidate = $this->ensureCandidate->execute($user);
            $candidate->update($dto->candidatePayload());

            if ($dto->phone) {
                $user->update(['phone' => $dto->phone]);
            }

            return $candidate->fresh(['diplomas', 'experiences', 'documents']);
        });
    }

    public function storePhoto(User $user, UploadedFile $file): Candidate
    {
        $candidate = $this->ensureCandidate->execute($user);

        return DB::transaction(function () use ($user, $candidate, $file) {
            if ($candidate->photo_path) {
                Storage::disk('public')->delete($candidate->photo_path);
            }

            $path = $file->store('candidates/'.$candidate->id.'/photo', 'public');
            $candidate->update(['photo_path' => $path]);

            $this->upsertVaultDocument($candidate, DocumentType::PhotoIdentite, $path);

            return $candidate->fresh();
        });
    }

    public function storeDiploma(User $user, DiplomaDTO $dto, ?UploadedFile $scan): Diploma
    {
        $candidate = $this->ensureCandidate->execute($user);

        return DB::transaction(function () use ($candidate, $dto, $scan) {
            $documentId = null;
            if ($scan) {
                $path = $scan->store('candidates/'.$candidate->id.'/diplomes', 'public');
                $document = $this->upsertVaultDocument($candidate, DocumentType::Diplome, $path, unique: false);
                $documentId = $document->id;
            }

            return Diploma::create(array_merge($dto->toArray(), [
                'candidate_id' => $candidate->id,
                'document_id' => $documentId,
            ]));
        });
    }

    public function updateDiploma(User $user, Diploma $diploma, DiplomaDTO $dto, ?UploadedFile $scan): Diploma
    {
        $this->assertOwns($user, $diploma->candidate_id);

        return DB::transaction(function () use ($user, $diploma, $dto, $scan) {
            $payload = $dto->toArray();
            if ($scan) {
                $candidate = $this->ensureCandidate->execute($user);
                $path = $scan->store('candidates/'.$candidate->id.'/diplomes', 'public');
                $document = $this->upsertVaultDocument($candidate, DocumentType::Diplome, $path, unique: false);
                $payload['document_id'] = $document->id;
            }
            $diploma->update($payload);

            return $diploma->fresh('document');
        });
    }

    public function deleteDiploma(User $user, Diploma $diploma): void
    {
        $this->assertOwns($user, $diploma->candidate_id);
        $diploma->delete();
    }

    public function storeExperience(User $user, ExperienceDTO $dto): Experience
    {
        $candidate = $this->ensureCandidate->execute($user);

        return Experience::create(array_merge($dto->toArray(), [
            'candidate_id' => $candidate->id,
        ]));
    }

    public function updateExperience(User $user, Experience $experience, ExperienceDTO $dto): Experience
    {
        $this->assertOwns($user, $experience->candidate_id);
        $experience->update($dto->toArray());

        return $experience->fresh();
    }

    public function deleteExperience(User $user, Experience $experience): void
    {
        $this->assertOwns($user, $experience->candidate_id);
        $experience->delete();
    }

    public function downloadCv(User $user): string
    {
        $candidate = $this->ensureCandidate->execute($user);
        if (! $this->completeness->canGenerateCv($candidate->load('diplomas'))) {
            throw ValidationException::withMessages([
                'cv' => ['Complétez l\'état civil, la photo d\'identité et au moins un diplôme avant de générer le CV.'],
            ]);
        }

        return $this->generateCv->execute($user);
    }

    private function upsertVaultDocument(Candidate $candidate, DocumentType $type, string $path, bool $unique = true): Document
    {
        if ($unique) {
            $existing = $candidate->documents()->where('type', $type->value)->whereNull('application_id')->first();
            if ($existing) {
                if ($existing->path && Storage::disk('public')->exists($existing->path) && $existing->path !== $path) {
                    Storage::disk('public')->delete($existing->path);
                }
                $existing->update(['path' => $path, 'status' => 'en attente']);

                return $existing;
            }
        }

        return Document::create([
            'candidate_id' => $candidate->id,
            'application_id' => null,
            'type' => $type->value,
            'path' => $path,
            'status' => 'en attente',
        ]);
    }

    private function assertOwns(User $user, int $candidateId): void
    {
        if ((int) $user->candidate?->id !== $candidateId && ! $user->isStaff()) {
            throw ValidationException::withMessages(['id' => ['Pièce introuvable.']]);
        }
    }

    private function profilePayload(User $user, Candidate $candidate): array
    {
        return [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'nin' => $user->nin,
            'date_naissance' => $candidate->date_naissance?->format('Y-m-d'),
            'lieu_naissance' => $candidate->lieu_naissance,
            'nationalite' => $candidate->nationalite ?: 'Tchadienne',
            'situation_familiale' => $candidate->situation_familiale,
            'sexe' => $candidate->sexe,
            'adresse' => $candidate->adresse,
            'photo_url' => $candidate->photo_path ? url('/api/candidate/dossier/photo') : null,
            'has_photo' => filled($candidate->photo_path),
            'langues' => $candidate->langues ?? [],
        ];
    }
}
