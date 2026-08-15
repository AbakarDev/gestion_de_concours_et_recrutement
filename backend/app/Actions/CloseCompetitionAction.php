<?php

namespace App\Actions;

use App\Models\Competition;
use App\Enums\CompetitionStatus;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CloseCompetitionAction extends BaseAction
{
    public function execute(Competition $competition): Competition
    {
        return DB::transaction(function () use ($competition) {
            if (!in_array($competition->status, [CompetitionStatus::PUBLISHED, CompetitionStatus::OPEN])) {
                throw ValidationException::withMessages(['status' => 'Seul un concours publié ou ouvert peut être clôturé.']);
            }

            $competition->update([
                'status' => CompetitionStatus::CLOSED,
            ]);

            $competition->jobOffers()->update(['status' => 'closed']);

            AuditLog::record(
                'competition.closed',
                $competition,
                [],
                ['status' => 'closed']
            );

            return $competition->fresh();
        });
    }
}
