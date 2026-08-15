<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Application;
use Illuminate\Auth\Access\HandlesAuthorization;

class ApplicationPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('applications.view');
    }

    public function view(User $user, Application $application): bool
    {
        if ($application->user_id === $user->id) {
            return true;
        }

        if (! $user->isStaff() || ! $user->hasPermissionTo('applications.view')) {
            return false;
        }

        if ($user->isJuryOnly()) {
            return in_array($application->status->value, ['accepted', 'evaluated'], true);
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('applications.create');
    }

    public function update(User $user, Application $application): bool
    {
        return $user->hasPermissionTo('applications.edit') || $application->user_id === $user->id;
    }

    public function delete(User $user, Application $application): bool
    {
        return $user->hasPermissionTo('applications.delete') || $application->user_id === $user->id;
    }

    public function validate(User $user, Application $application): bool
    {
        return $user->hasPermissionTo('applications.validate');
    }

    public function evaluate(User $user, Application $application): bool
    {
        if (! $user->hasPermissionTo('applications.evaluate')) {
            return false;
        }

        if ($user->isJuryOnly()) {
            return in_array($application->status->value, ['accepted', 'evaluated'], true);
        }

        return true;
    }
}
