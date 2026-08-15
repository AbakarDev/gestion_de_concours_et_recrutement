<?php

namespace App\Actions;

use App\Models\Competition;
use App\Models\Application;
use App\Models\Result;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;

class PublishCompetitionResultsAction
{
    public function execute(Competition $competition): Competition
    {
        return DB::transaction(function () use ($competition) {
            // Seulement si le concours n'est pas déjà publié ou si on veut recalculer
            if ($competition->areResultsLocked()) {
                throw new \Exception('Les résultats de ce concours sont déjà publiés et verrouillés.');
            }

            foreach ($competition->jobOffers as $jobOffer) {
                $applications = Application::with('scores')
                    ->where('job_offer_id', $jobOffer->id)
                    ->whereIn('status', ['evaluated', 'accepted'])
                    ->get();

                $ranked = $applications->map(function ($app) {
                    $scores = $app->scores;
                    $avg = $scores->count() > 0 ? round($scores->avg('note'), 2) : 0;
                    return [
                        'application' => $app,
                        'average' => $avg,
                    ];
                })->sortByDesc('average')->values();

                $quota = $jobOffer->positions_count; // the quota is per job offer now or the main competition quota

                foreach ($ranked as $index => $data) {
                    $app = $data['application'];
                    $rank = $index + 1;
                    $isAdmitted = $rank <= $quota;

                    Result::updateOrCreate(
                        ['application_id' => $app->id],
                        [
                            'moyenne' => $data['average'],
                            'rang' => $rank,
                            'decision' => $isAdmitted ? 'admis' : 'recalé',
                            'is_admitted' => $isAdmitted,
                            'locked_at' => now(), // Verrouillage
                        ]
                    );

                    // Verrouiller les scores
                    $app->scores()->update(['locked_at' => now()]);
                }
            }

            $competition->update([
                'results_published_at' => now(),
                'results_locked_at' => now(),
            ]);

            AuditLog::record(
                'competition.results_published',
                $competition,
                [],
                ['results_published_at' => now()]
            );

            return $competition->fresh();
        });
    }
}
