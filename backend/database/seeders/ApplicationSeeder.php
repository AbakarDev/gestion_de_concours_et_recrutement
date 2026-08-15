<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\JobOffer;
use App\Models\Application;
use App\Models\Document;
use Illuminate\Database\Seeder;

class ApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::factory()->count(10)->create();
        $jobOffers = JobOffer::all();

        if ($jobOffers->isEmpty()) {
            return;
        }

        foreach ($users as $user) {
            $offers = $jobOffers->random(rand(1, 3));
            foreach ($offers as $offer) {
                $application = Application::factory()->create([
                    'user_id' => $user->id,
                    'job_offer_id' => $offer->id,
                ]);

                Document::factory()->count(rand(1, 3))->create([
                    'application_id' => $application->id,
                ]);
            }
        }
    }
}
