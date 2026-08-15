<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PrescreeningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrescreeningController extends Controller
{
    protected PrescreeningService $prescreeningService;

    public function __construct(PrescreeningService $prescreeningService)
    {
        $this->prescreeningService = $prescreeningService;
    }

    /**
     * @OA\Post(
     *     path="/api/applications/{id}/prescreening",
     *     tags={"Prescreening"},
     *     summary="Mettre à jour la décision de présélection",
     *     security={{"sanctum":{}}}
     * )
     */
    public function updateDecision(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => 'required|in:retained,rejected,pending',
            'comment'  => 'nullable|string'
        ]);

        try {
            $prescreening = $this->prescreeningService->updateDecision($id, $validated['decision'], $validated['comment'] ?? null);
            return response()->json(['status' => 'Success', 'message' => 'Présélection mise à jour.', 'data' => $prescreening]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/applications/{id}/prescreening/lock",
     *     tags={"Prescreening"},
     *     summary="Verrouiller la décision de présélection",
     *     security={{"sanctum":{}}}
     * )
     */
    public function lockDecision(int $id): JsonResponse
    {
        try {
            $prescreening = $this->prescreeningService->lockDecision($id);
            return response()->json(['status' => 'Success', 'message' => 'Présélection verrouillée définitivement.', 'data' => $prescreening]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
