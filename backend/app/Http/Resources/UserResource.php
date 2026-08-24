<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @OA\Schema(
 *     schema="UserResource",
 *     title="User Resource",
 *     description="Ressource utilisateur",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="first_name", type="string", example="Abakar"),
 *     @OA\Property(property="last_name", type="string", example="Brahim"),
 *     @OA\Property(property="full_name", type="string", example="Abakar Brahim"),
 *     @OA\Property(property="email", type="string", format="email", example="abakar@example.td"),
 *     @OA\Property(property="nin", type="string", example="123456789", nullable=true),
 *     @OA\Property(property="phone", type="string", example="+23566000000", nullable=true),
 *     @OA\Property(property="email_verified_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="phone_verified_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="roles", type="array", @OA\Items(type="string"), example={"candidat"}),
 *     @OA\Property(property="permissions", type="array", @OA\Items(type="string"), example={"applications.create"}),
 *     @OA\Property(property="last_login_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'nin' => $this->nin,
            'phone' => $this->phone,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),
            'is_active' => $this->is_active,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')->values()),
            'permissions' => $this->when(
                $this->relationLoaded('roles') || $this->relationLoaded('permissions'),
                fn () => $this->getAllPermissions()->pluck('name')->values()
            ),
            'direct_permissions' => $this->when(
                $this->relationLoaded('permissions'),
                fn () => $this->getDirectPermissions()->pluck('name')->values()
            ),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
