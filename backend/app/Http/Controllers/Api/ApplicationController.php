<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApplicationResource;
use App\Actions\SubmitApplicationAction;
use App\Actions\UpdateApplicationStatusAction;
use App\Services\ApplicationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;

/**
 * @OA\Tag(
 *     name="Applications",
 *     description="Gestion des candidatures"
 * )
 */
class ApplicationController extends Controller
{
    use ApiResponseTrait, \Illuminate\Foundation\Auth\Access\AuthorizesRequests;

    private ApplicationService $applicationService;

    public function __construct(ApplicationService $applicationService)
    {
        $this->applicationService = $applicationService;
    }

    /**
     * @OA\Get(
     *     path="/api/applications",
     *     tags={"Applications"},
     *     summary="Lister les candidatures",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="job_offer_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Liste des candidatures")
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $isStaff = $user->isStaff();

        $filters = $request->only(['search', 'status', 'job_offer_id', 'user_id', 'sort_by', 'sort_order']);

        // Le candidat ne voit que ses propres candidatures
        if (!$isStaff) {
            $filters['user_id'] = $user->id;
        }

        // Le jury-only ne voit que les copies déjà anonymisées (acceptées / évaluées).
        if ($user->isJuryOnly()) {
            $juryStatuses = ['accepted', 'evaluated'];
            if (! empty($filters['status'])) {
                if (! in_array($filters['status'], $juryStatuses, true)) {
                    $filters['status'] = '__none__';
                }
            } else {
                unset($filters['status']);
                $filters['statuses'] = $juryStatuses;
            }
            if (! empty($filters['search'])) {
                $filters['search_anonymat'] = $filters['search'];
                unset($filters['search']);
            }
        }

        $perPage = $request->input('per_page', 15);
        $paginator = $this->applicationService->getPaginatedWithFilters($filters, $perPage);

        return response()->json([
            'status' => 'Success',
            'message' => 'Candidatures récupérées avec succès.',
            'data' => ApplicationResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/applications/{id}",
     *     tags={"Applications"},
     *     summary="Détails d'une candidature",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détails")
     * )
     */
    public function show(int $id): JsonResponse
    {
        $application = $this->applicationService->getById($id);
        if (!$application)
            return $this->errorResponse('Candidature introuvable.', 404);

        $this->authorize('view', $application);

        $application->load(['scores', 'convocation', 'statusHistory.changedBy']);
        return $this->successResponse(new ApplicationResource($application));
    }

    /**
     * @OA\Patch(
     *     path="/api/applications/{id}/status",
     *     tags={"Applications"},
     *     summary="Changer le statut d'une candidature",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"status"},
     *             @OA\Property(property="status", type="string", enum={"submitted", "under_review", "accepted", "rejected"}),
     *             @OA\Property(property="admin_notes", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Statut mis à jour")
     * )
     */
    public function updateStatus(int $id, Request $request, UpdateApplicationStatusAction $updateStatusAction): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', new Enum(ApplicationStatus::class)],
            'admin_notes' => ['nullable', 'string'],
            'rejection_reason' => ['required_if:status,rejected', 'nullable', 'string', 'min:5'],
        ]);

        $applicationModel = \App\Models\Application::findOrFail($id);
        $this->authorize('validate', $applicationModel);

        $application = $updateStatusAction->execute(
            $applicationModel,
            ApplicationStatus::from($validated['status']),
            $validated['admin_notes'] ?? null,
            $validated['rejection_reason'] ?? null,
        );

        return $this->successResponse(new ApplicationResource($application), 'Statut de la candidature mis à jour.');
    }

    /**
     * @OA\Post(
     *     path="/api/applications",
     *     tags={"Applications"},
     *     summary="Soumettre une candidature",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"job_offer_id"},
     *             @OA\Property(property="job_offer_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Candidature créée")
     * )
     */
    public function store(Request $request, SubmitApplicationAction $submitApplicationAction): JsonResponse
    {
        $this->authorize('create', \App\Models\Application::class);

        $validated = $request->validate([
            'job_offer_id' => 'required|exists:job_offers,id'
        ]);

        $application = $submitApplicationAction->execute($request->user(), (int) $validated['job_offer_id']);

        return $this->successResponse(new ApplicationResource($application->load(['user', 'jobOffer.competition'])), 'Candidature soumise avec succès.', 201);
    }

    public function storeScore(Request $request, $id, \App\Actions\RecordScoreAction $recordScoreAction): JsonResponse
    {
        $request->validate([
            'epreuve' => 'required|string',
            'note' => 'required|numeric|min:0|max:20',
            'commentaire' => 'nullable|string'
        ]);

        $application = \App\Models\Application::findOrFail($id);
        $this->authorize('evaluate', $application);

        $score = $recordScoreAction->execute(
            $application,
            $request->user(),
            $request->epreuve,
            (float) $request->note,
            $request->commentaire
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Note enregistrée avec succès. Un cachet d\'intégrité HMAC a été stocké.',
            'data' => $score
        ]);
    }
}
