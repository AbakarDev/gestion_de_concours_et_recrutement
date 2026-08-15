<?php

namespace App\Actions;

use App\Models\Competition;
use App\Enums\CompetitionStatus;
use Illuminate\Validation\ValidationException;

class PublishCompetitionAction extends BaseAction
{
    public function execute(Competition $competition): Competition
    {
        if ($competition->status !== CompetitionStatus::DRAFT) {
            throw ValidationException::withMessages(['status' => 'Seul un concours en brouillon peut être publié.']);
        }

        $competition->update([
            'status' => CompetitionStatus::PUBLISHED,
            'published_at' => now(),
        ]);

        return $competition->fresh();
    }
}
