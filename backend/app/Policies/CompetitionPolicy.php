<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Competition;
use Illuminate\Auth\Access\HandlesAuthorization;

class CompetitionPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('competitions.view');
    }

    public function view(User $user, Competition $competition): bool
    {
        return $user->hasPermissionTo('competitions.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('competitions.create');
    }

    public function update(User $user, Competition $competition): bool
    {
        return $user->hasPermissionTo('competitions.edit');
    }

    public function delete(User $user, Competition $competition): bool
    {
        return $user->hasPermissionTo('competitions.delete');
    }

    public function publish(User $user, Competition $competition): bool
    {
        return $user->hasPermissionTo('competitions.publish');
    }
}
