<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Competition\StoreCompetitionRequest;
use App\Http\Requests\Competition\UpdateCompetitionRequest;
use App\Http\Resources\CompetitionResource;
use App\Services\CompetitionService;
use App\DTO\CompetitionDTO;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Competitions",
 *     description="Gestion des concours"
 * )
 */
class CompetitionController extends Controller
{
    use ApiResponseTrait, \Illuminate\Foundation\Auth\Access\AuthorizesRequests;

    private CompetitionService $competitionService;

    public function __construct(CompetitionService $competitionService)
    {
        $this->competitionService = $competitionService;
    }

    /**
     * @OA\Get(
     *     path="/api/competitions",
     *     tags={"Competitions"},
     *     summary="Lister les concours avec filtres et pagination",
     *     description="Retourne une liste paginée de concours selon les filtres",
     *     operationId="getCompetitions",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="department_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des concours",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/CompetitionResource")),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'status', 'department_id', 'date_from', 'date_to', 'sort_by', 'sort_order']);
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

        $paginator = $this->competitionService->getPaginatedWithFilters($filters, $perPage);

        return response()->json([
            'status' => 'Success',
            'message' => 'Concours récupérés avec succès.',
            'data' => CompetitionResource::collection($paginator->items()),
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
     *     path="/api/competitions",
     *     tags={"Competitions"},
     *     summary="Créer un concours",
     *     operationId="storeCompetition",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"department_id","title","reference","quota","start_date","end_date"},
     *             @OA\Property(property="department_id", type="integer"),
     *             @OA\Property(property="title", type="string"),
     *             @OA\Property(property="reference", type="string"),
     *             @OA\Property(property="description", type="string"),
     *             @OA\Property(property="quota", type="integer"),
     *             @OA\Property(property="required_documents", type="array", @OA\Items(type="string")),
     *             @OA\Property(property="start_date", type="string", format="date"),
     *             @OA\Property(property="end_date", type="string", format="date")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Concours créé")
     * )
     */
    public function store(StoreCompetitionRequest $request): JsonResponse
    {
        $this->authorize('create', \App\Models\Competition::class);

        $dto = CompetitionDTO::fromRequest($request);
        $competition = $this->competitionService->createCompetition($dto);
        
        return $this->successResponse(new CompetitionResource($competition), 'Concours créé avec succès.', 201);
    }

    /**
     * @OA\Get(
     *     path="/api/competitions/{id}",
     *     tags={"Competitions"},
     *     summary="Détails d'un concours",
     *     operationId="showCompetition",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détails du concours")
     * )
     */
    public function show(int $id): JsonResponse
    {
        // Public endpoint — no auth required
        $competition = $this->competitionService->getById($id);
        if (!$competition) return $this->errorResponse('Concours introuvable.', 404);

        return $this->successResponse(new CompetitionResource($competition));
    }

    /**
     * @OA\Put(
     *     path="/api/competitions/{id}",
     *     tags={"Competitions"},
     *     summary="Modifier un concours",
     *     operationId="updateCompetition",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent()),
     *     @OA\Response(response=200, description="Concours modifié")
     * )
     */
    public function update(int $id, UpdateCompetitionRequest $request): JsonResponse
    {
        $this->authorize('update', $this->competitionService->getById($id) ?? abort(404));

        // Note: Realistically, UpdateCompetitionDTO might be better for partial updates, 
        // but since our DTO expects all fields, we assume the frontend sends the whole object, 
        // or we merge it with existing. For simplicity, we assume full DTO from request.
        $dto = CompetitionDTO::fromRequest($request);
        $competition = $this->competitionService->updateCompetition($id, $dto);

        return $this->successResponse(new CompetitionResource($competition), 'Concours modifié avec succès.');
    }

    /**
     * @OA\Delete(
     *     path="/api/competitions/{id}",
     *     tags={"Competitions"},
     *     summary="Supprimer un concours",
     *     operationId="deleteCompetition",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Concours supprimé")
     * )
     */
    public function destroy(int $id): JsonResponse
    {
        $competition = $this->competitionService->getById($id);
        if (!$competition) return $this->errorResponse('Concours introuvable.', 404);
        $this->authorize('delete', $competition);

        $this->competitionService->delete($id);
        return $this->successResponse(null, 'Concours supprimé avec succès.');
    }

    /**
     * @OA\Post(
     *     path="/api/competitions/{id}/publish",
     *     tags={"Competitions"},
     *     summary="Publier un concours",
     *     operationId="publishCompetition",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Concours publié")
     * )
     */
    public function publish(int $id, \App\Actions\PublishCompetitionAction $action): JsonResponse
    {
        $competition = $this->competitionService->getById($id);
        if (!$competition) {
            return $this->errorResponse('Concours introuvable.', 404);
        }
        $this->authorize('publish', $competition);

        $competition = $action->execute($competition);
        return $this->successResponse(new CompetitionResource($competition), 'Concours publié avec succès.');
    }

    /**
     * @OA\Post(
     *     path="/api/competitions/{id}/close",
     *     tags={"Competitions"},
     *     summary="Clôturer un concours",
     *     operationId="closeCompetition",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Concours clôturé")
     * )
     */
    public function close(int $id, \App\Actions\CloseCompetitionAction $action): JsonResponse
    {
        $competition = $this->competitionService->getById($id);
        if (!$competition) {
            return $this->errorResponse('Concours introuvable.', 404);
        }
        $this->authorize('publish', $competition);

        $competition = $action->execute($competition);
        return $this->successResponse(new CompetitionResource($competition), 'Concours clôturé avec succès.');
    }

    /**
     * @OA\Post(
     *     path="/api/competitions/{id}/unpublish",
     *     tags={"Competitions"},
     *     summary="Dépublier un concours",
     *     operationId="unpublishCompetition",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Concours dépublié")
     * )
     */
    public function unpublish(int $id): JsonResponse
    {
        $competition = $this->competitionService->getById($id);
        if (!$competition) {
            return $this->errorResponse('Concours introuvable.', 404);
        }
        $this->authorize('publish', $competition);

        $competition = $this->competitionService->unpublish($id);
        return $this->successResponse(new CompetitionResource($competition), 'Concours dépublié avec succès.');
    }

    /**
     * @OA\Post(
     *     path="/api/competitions/{id}/publish-results",
     *     tags={"Competitions"},
     *     summary="Publier les résultats finaux d'un concours",
     *     operationId="publishCompetitionResults",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Résultats publiés et notes verrouillées")
     * )
     */
    public function publishResults(int $id, \App\Actions\PublishCompetitionResultsAction $action): JsonResponse
    {
        $competition = $this->competitionService->getById($id);
        if (!$competition) {
            return $this->errorResponse('Concours introuvable.', 404);
        }
        $this->authorize('publish', $competition);

        try {
            $competition = $action->execute($competition);
            return $this->successResponse(new CompetitionResource($competition), 'Résultats publiés avec succès. Les notes sont désormais verrouillées.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
