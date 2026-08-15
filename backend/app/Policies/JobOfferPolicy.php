<?php

namespace App\Policies;

use App\Models\User;
use App\Models\JobOffer;
use Illuminate\Auth\Access\HandlesAuthorization;

class JobOfferPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('job_offers.view');
    }

    public function view(User $user, JobOffer $jobOffer): bool
    {
        return $user->hasPermissionTo('job_offers.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('job_offers.create');
    }

    public function update(User $user, JobOffer $jobOffer): bool
    {
        return $user->hasPermissionTo('job_offers.edit');
    }

    public function delete(User $user, JobOffer $jobOffer): bool
    {
        return $user->hasPermissionTo('job_offers.delete');
    }
}
