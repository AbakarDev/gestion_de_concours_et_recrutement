<?php

namespace App\Http\Controllers\Api;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $query = User::with(['roles', 'permissions'])->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('nin', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->role($request->input('role'));
        }

        $users = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'total' => $users->total(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', 'string', Rule::in(RoleName::all())],
        ]);

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        $user->syncRoles([$validated['role']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Utilisateur créé.',
            'data' => new UserResource($user->load(['roles', 'permissions'])),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorize('update', User::class);

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $payload = collect($validated)->except('password')->all();
        if (! empty($validated['password'])) {
            $payload['password'] = $validated['password'];
        }

        $user->update($payload);

        return response()->json([
            'status' => 'success',
            'message' => 'Utilisateur mis à jour.',
            'data' => new UserResource($user->fresh()->load(['roles', 'permissions'])),
        ]);
    }

    public function updateRole(Request $request, $id)
    {
        $this->authorize('updateRole', User::class);
        $request->validate([
            'role' => ['required', 'string', Rule::in(RoleName::all())],
        ]);

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id && $request->role !== RoleName::SuperAdmin->value) {
            return response()->json([
                'status' => 'error',
                'message' => 'Vous ne pouvez pas retirer votre propre rôle SuperAdmin.',
            ], 422);
        }

        if (
            $user->hasRole(RoleName::SuperAdmin->value)
            && $request->role !== RoleName::SuperAdmin->value
            && User::role(RoleName::SuperAdmin->value)->count() <= 1
        ) {
            return response()->json([
                'status' => 'error',
                'message' => 'Impossible de retirer le dernier SuperAdmin.',
            ], 422);
        }

        $user->syncRoles([$request->role]);

        return response()->json([
            'status' => 'success',
            'message' => 'Rôle mis à jour avec succès',
            'data' => new UserResource($user->load(['roles', 'permissions'])),
        ]);
    }

    public function syncPermissions(Request $request, $id)
    {
        $this->authorize('update', User::class);

        $validated = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ]);

        $user = User::findOrFail($id);
        $user->syncPermissions($validated['permissions']);

        return response()->json([
            'status' => 'success',
            'message' => 'Permissions directes mises à jour.',
            'data' => new UserResource($user->load(['roles', 'permissions'])),
        ]);
    }

    public function toggleActive(Request $request, $id)
    {
        $this->authorize('update', User::class);

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Vous ne pouvez pas désactiver votre propre compte.',
            ], 422);
        }

        $user->update(['is_active' => ! $user->is_active]);

        return response()->json([
            'status' => 'success',
            'message' => $user->is_active ? 'Compte activé.' : 'Compte désactivé.',
            'data' => new UserResource($user->load(['roles', 'permissions'])),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $this->authorize('delete', User::class);

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Vous ne pouvez pas supprimer votre propre compte.',
            ], 422);
        }

        if (
            $user->hasRole(RoleName::SuperAdmin->value)
            && User::role(RoleName::SuperAdmin->value)->count() <= 1
        ) {
            return response()->json([
                'status' => 'error',
                'message' => 'Impossible de supprimer le dernier SuperAdmin.',
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Utilisateur supprimé.',
        ]);
    }

    public function permissionsCatalog()
    {
        $this->authorize('viewAny', User::class);

        $permissions = Permission::query()
            ->where('guard_name', 'sanctum')
            ->orderBy('name')
            ->pluck('name')
            ->values();

        $roles = Role::query()
            ->where('guard_name', 'sanctum')
            ->with('permissions')
            ->get()
            ->mapWithKeys(fn (Role $role) => [
                $role->name => $role->permissions->pluck('name')->values(),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'permissions' => $permissions,
                'roles' => $roles,
            ],
        ]);
    }
}
