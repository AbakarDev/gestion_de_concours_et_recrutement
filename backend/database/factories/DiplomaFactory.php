<?php

namespace Database\Factories;

use App\Models\Candidate;
use Illuminate\Database\Eloquent\Factories\Factory;

class DiplomaFactory extends Factory
{
    public function definition(): array
    {
        $level = $this->faker->randomElement(['BAC', 'Licence', 'Master']);

        return [
            'candidate_id' => Candidate::factory(),
            'niveau' => $level,
            'type_diplome' => $level,
            'etablissement' => 'Université de N\'Djamena',
            'specialite' => $this->faker->randomElement(['Droit', 'Gestion', 'Informatique', 'Lettres']),
            'annee' => (int) $this->faker->year(),
        ];
    }
}
