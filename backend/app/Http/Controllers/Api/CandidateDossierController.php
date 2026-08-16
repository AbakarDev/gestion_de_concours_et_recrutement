<?php

namespace App\Http\Controllers\Api;

use App\Actions\EnsureCandidateProfileAction;
use App\DTO\CandidateProfileDTO;
use App\DTO\DiplomaDTO;
use App\DTO\ExperienceDTO;
use App\Enums\DocumentType;
use App\Http\Controllers\Controller;
use App\Models\Diploma;
use App\Models\Experience;
use App\Services\CandidateDossierService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CandidateDossierController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private CandidateDossierService $dossierService)
    {
    }

    public function types(): JsonResponse
    {
        return $this->successResponse(DocumentType::catalog(), 'Catalogue des pièces ministérielles.');
    }

    public function show(Request $request): JsonResponse
    {
        $data = $this->dossierService->show(
            $request->user(),
            $request->integer('job_offer_id') ?: null,
        );

        return $this->successResponse($data);
    }

    public function update(Request $request): JsonResponse
    {
        $dto = CandidateProfileDTO::fromRequest($request);
        $this->dossierService->updateProfile($request->user(), $dto);

        return $this->successResponse(
            $this->dossierService->show($request->user()),
            'État civil enregistré.'
        );
    }

    public function uploadPhoto(Request $request, EnsureCandidateProfileAction $ensure): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
        ], [
            'photo.required' => 'Joignez une photo d\'identité (JPG ou PNG, 5 Mo max).',
            'photo.file' => 'Joignez une photo d\'identité (JPG ou PNG, 5 Mo max).',
            'photo.mimes' => 'La photo d\'identité doit être un fichier JPG ou PNG.',
            'photo.max' => 'La photo d\'identité ne doit pas dépasser 5 Mo.',
        ]);

        $ensure->execute($request->user());
        $this->dossierService->storePhoto($request->user(), $request->file('photo'));

        return $this->successResponse(
            $this->dossierService->show($request->user()),
            'Photo d\'identité enregistrée.'
        );
    }

    public function showPhoto(Request $request)
    {
        $candidate = $request->user()->candidate;
        if (! $candidate?->photo_path || ! Storage::disk('public')->exists($candidate->photo_path)) {
            abort(404, 'Aucune photo d\'identité.');
        }

        return Storage::disk('public')->response($candidate->photo_path);
    }

    public function storeDiploma(Request $request): JsonResponse
    {
        $dto = DiplomaDTO::fromRequest($request);
        $request->validate([
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $diploma = $this->dossierService->storeDiploma(
            $request->user(),
            $dto,
            $request->file('file'),
        );

        return $this->successResponse($diploma, 'Diplôme ajouté au cursus.', 201);
    }

    public function updateDiploma(Request $request, int $id): JsonResponse
    {
        $diploma = Diploma::findOrFail($id);
        $dto = DiplomaDTO::fromRequest($request);
        $request->validate([
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $diploma = $this->dossierService->updateDiploma(
            $request->user(),
            $diploma,
            $dto,
            $request->file('file'),
        );

        return $this->successResponse($diploma, 'Diplôme mis à jour.');
    }

    public function destroyDiploma(Request $request, int $id): JsonResponse
    {
        $diploma = Diploma::findOrFail($id);
        $this->dossierService->deleteDiploma($request->user(), $diploma);

        return $this->successResponse(null, 'Diplôme retiré du cursus.');
    }

    public function storeExperience(Request $request): JsonResponse
    {
        $dto = ExperienceDTO::fromRequest($request);
        $experience = $this->dossierService->storeExperience($request->user(), $dto);

        return $this->successResponse($experience, 'Expérience ajoutée.', 201);
    }

    public function updateExperience(Request $request, int $id): JsonResponse
    {
        $experience = Experience::findOrFail($id);
        $dto = ExperienceDTO::fromRequest($request);
        $experience = $this->dossierService->updateExperience($request->user(), $experience, $dto);

        return $this->successResponse($experience, 'Expérience mise à jour.');
    }

    public function destroyExperience(Request $request, int $id): JsonResponse
    {
        $experience = Experience::findOrFail($id);
        $this->dossierService->deleteExperience($request->user(), $experience);

        return $this->successResponse(null, 'Expérience retirée.');
    }

    public function downloadCv(Request $request)
    {
        $path = $this->dossierService->downloadCv($request->user());

        return Storage::disk('public')->download($path, 'CV_administratif.pdf');
    }
}
