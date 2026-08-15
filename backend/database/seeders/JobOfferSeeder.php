<?php

namespace Database\Seeders;

use App\Models\Competition;
use App\Models\JobOffer;
use Illuminate\Database\Seeder;

class JobOfferSeeder extends Seeder
{
    public function run(): void
    {
        $competitions = Competition::all();

        if ($competitions->isEmpty()) {
            return;
        }

        foreach ($competitions as $competition) {
            JobOffer::factory()->count(rand(2, 5))->create([
                'competition_id' => $competition->id,
            ]);
        }
    }
}
