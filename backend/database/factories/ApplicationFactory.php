<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\JobOffer;
use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApplicationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'job_offer_id' => JobOffer::factory(),
            'application_number' => 'APP-' . strtoupper($this->faker->unique()->bothify('????-####')),
            'status' => $this->faker->randomElement([
                ApplicationStatus::SUBMITTED,
                ApplicationStatus::UNDER_REVIEW,
                ApplicationStatus::ACCEPTED,
                ApplicationStatus::REJECTED,
            ]),
            'admin_notes' => $this->faker->optional()->sentence(),
            'submitted_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }
}
