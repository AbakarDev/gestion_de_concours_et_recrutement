<?php

namespace App\Actions;

use App\Models\Candidate;
use App\Models\User;

class EnsureCandidateProfileAction extends BaseAction
{
    public function execute(User $user): Candidate
    {
        $candidate = Candidate::where('user_id', $user->id)->first();
        if ($candidate) {
            $user->setRelation('candidate', $candidate);

            return $candidate;
        }

        $payload = ['nationalite' => 'Tchadienne'];
        if ($user->nin && ! Candidate::where('nni', $user->nin)->exists()) {
            $payload['nni'] = $user->nin;
        }

        $candidate = $user->candidate()->create($payload);
        $user->setRelation('candidate', $candidate);

        return $candidate;
    }
}
