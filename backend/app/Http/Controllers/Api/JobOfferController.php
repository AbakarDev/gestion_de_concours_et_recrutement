<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\JobOffer\StoreJobOfferRequest;
use App\Http\Requests\JobOffer\UpdateJobOfferRequest;
use App\Http\Resources\JobOfferResource;
use App\Services\JobOfferService;
use App\DTO\JobOfferDTO;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="JobOffers",
 *     description="Gestion des postes/offres d'emploi"
 * )
 */
class JobOfferController extends Controller
{
    use ApiResponseTrait, \Illuminate\Foundation\Auth\Access\AuthorizesRequests;

    private JobOfferService $jobOfferService;

    public function __construct(JobOfferService $jobOfferService)
    {
        $this->jobOfferService = $jobOfferService;
    }

    /**
     * @OA\Get(
     *     path="/api/job-offers",
     *     tags={"JobOffers"},
     *     summary="Lister les postes avec filtres et pagination",
     *     operationId="getJobOffers",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="competition_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des postes",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/JobOfferResource")),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'competition_id', 'status', 'location', 'sort_by', 'sort_order']);
        $perPage = $request->input('per_page', 15);

        $user = auth('sanctum')->user();
        if (! $user || ! $user->isStaff()) {
            $allowed = ['published', 'open'];
            if (! empty($filters['status']) && ! in_array($filters['status'], $allowed, true)) {
                $filters['status'] = '__none__';
            } elseif (empty($filters['status'])) {
                $filters['statuses'] = $allowed;
            }
        }

        $paginator = $this->jobOfferService->getPaginatedWithFilters($filters, $perPage);

        return response()->json([
            'status' => 'Success',
            'message' => 'Postes récupérés avec succès.',
            'data' => JobOfferResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/job-offers",
     *     tags={"JobOffers"},
     *     summary="Créer un poste",
     *     operationId="storeJobOffer",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"competition_id","title","positions_count"},
     *             @OA\Property(property="competition_id", type="integer"),
     *             @OA\Property(property="title", type="string"),
     *             @OA\Property(property="positions_count", type="integer"),
     *             @OA\Property(property="location", type="string"),
     *             @OA\Property(property="requirements", type="object", @OA\AdditionalProperties(type="string"))
     *         )
     *     ),
     *     @OA\Response(response=201, description="Poste créé")
     * )
     */
    public function store(StoreJobOfferRequest $request): JsonResponse
    {
        $this->authorize('create', \App\Models\JobOffer::class);

        $dto = JobOfferDTO::fromRequest($request);
        $jobOffer = $this->jobOfferService->createJobOffer($dto);
        
        return $this->successResponse(new JobOfferResource($jobOffer), 'Poste créé avec succès.', 201);
    }

    /**
     * @OA\Get(
     *     path="/api/job-offers/{id}",
     *     tags={"JobOffers"},
     *     summary="Détails d'un poste",
     *     operationId="showJobOffer",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détails du poste")
     * )
     */
    public function show(int $id): JsonResponse
    {
        // Public endpoint — no auth required
        $jobOffer = $this->jobOfferService->getById($id);
        if (!$jobOffer) return $this->errorResponse('Poste introuvable.', 404);

        return $this->successResponse(new JobOfferResource($jobOffer));
    }

    /**
     * @OA\Put(
     *     path="/api/job-offers/{id}",
     *     tags={"JobOffers"},
     *     summary="Modifier un poste",
     *     operationId="updateJobOffer",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent()),
     *     @OA\Response(response=200, description="Poste modifié")
     * )
     */
    public function update(int $id, UpdateJobOfferRequest $request): JsonResponse
    {
        $jobOffer = $this->jobOfferService->getById($id);
        if (!$jobOffer) return $this->errorResponse('Poste introuvable.', 404);
        $this->authorize('update', $jobOffer);

        $dto = JobOfferDTO::fromRequest($request);
        $jobOffer = $this->jobOfferService->updateJobOffer($id, $dto);

        return $this->successResponse(new JobOfferResource($jobOffer), 'Poste modifié avec succès.');
    }

    /**
     * @OA\Delete(
     *     path="/api/job-offers/{id}",
     *     tags={"JobOffers"},
     *     summary="Supprimer un poste",
     *     operationId="deleteJobOffer",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Poste supprimé")
     * )
     */
    public function destroy(int $id): JsonResponse
    {
        $jobOffer = $this->jobOfferService->getById($id);
        if (!$jobOffer) return $this->errorResponse('Poste introuvable.', 404);
        $this->authorize('delete', $jobOffer);

        $this->jobOfferService->delete($id);
        return $this->successResponse(null, 'Poste supprimé avec succès.');
    }

    /**
     * @OA\Post(
     *     path="/api/job-offers/{id}/publish",
     *     tags={"JobOffers"},
     *     summary="Publier un poste",
     *     operationId="publishJobOffer",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Poste publié")
     * )
     */
    public function publish(int $id, \App\Actions\PublishJobOfferAction $action): JsonResponse
    {
        $jobOffer = $this->jobOfferService->getById($id);
        if (!$jobOffer) {
            return $this->errorResponse('Poste introuvable.', 404);
        }
        $this->authorize('update', $jobOffer);

        $jobOffer = $action->execute($jobOffer);
        return $this->successResponse(new JobOfferResource($jobOffer), 'Poste publié avec succès.');
    }
}
