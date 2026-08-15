<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Role;
use Illuminate\Http\JsonResponse;
use App\Traits\ApiResponseTrait;

/**
 * @OA\Tag(
 *     name="RBAC",
 *     description="Gestion des rôles et permissions (Spatie)"
 * )
 */
class RoleController extends Controller
{
    use ApiResponseTrait;

    /**
     * @OA\Get(
     *     path="/api/roles",
     *     tags={"RBAC"},
     *     summary="Lister tous les rôles",
     *     description="Retourne la liste des rôles disponibles",
     *     operationId="getRoles",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des rôles",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 @OA\Property(property="id", type="integer"),
     *                 @OA\Property(property="name", type="string")
     *             ))
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié"),
     *     @OA\Response(response=403, description="Non autorisé")
     * )
     */
    public function index(): JsonResponse
    {
        $this->authorize('roles.view');
        $roles = Role::select('id', 'name')->get();
        return $this->successResponse($roles);
    }
}
