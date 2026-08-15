<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('users.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('users.create');
    }

    public function updateRole(User $user): bool
    {
        return $user->hasPermissionTo('users.edit');
    }

    public function update(User $user): bool
    {
        return $user->hasPermissionTo('users.edit');
    }
}
