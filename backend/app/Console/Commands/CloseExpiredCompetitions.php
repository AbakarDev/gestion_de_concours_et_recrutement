<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Competition;
use App\Enums\CompetitionStatus;
use App\Actions\CloseCompetitionAction;
use Carbon\Carbon;

class CloseExpiredCompetitions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'competitions:close-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Close all competitions that have passed their end date';

    /**
     * Execute the console command.
     */
    public function handle(CloseCompetitionAction $closeCompetitionAction)
    {
        $this->info('Starting expired competitions closure process...');

        $expiredCompetitions = Competition::whereIn('status', [CompetitionStatus::PUBLISHED->value, CompetitionStatus::OPEN->value])
            ->whereDate('end_date', '<', Carbon::today())
            ->get();

        if ($expiredCompetitions->isEmpty()) {
            $this->info('No expired competitions found to close.');
            return;
        }

        foreach ($expiredCompetitions as $competition) {
            $this->info("Closing competition: {$competition->title} (ID: {$competition->id})");
            $closeCompetitionAction->execute($competition);
        }

        $this->info('Successfully closed ' . $expiredCompetitions->count() . ' competitions.');
    }
}
