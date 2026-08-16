<?php

namespace Database\Factories;

use App\Models\Candidate;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExperienceFactory extends Factory
{
    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('-8 years', '-2 years');

        return [
            'candidate_id' => Candidate::factory(),
            'poste' => $this->faker->jobTitle(),
            'employeur' => $this->faker->company(),
            'date_debut' => $start->format('Y-m-d'),
            'date_fin' => (clone $start)->modify('+18 months')->format('Y-m-d'),
            'description' => $this->faker->sentence(12),
        ];
    }
}
