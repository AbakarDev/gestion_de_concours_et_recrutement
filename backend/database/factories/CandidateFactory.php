<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CandidateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'date_naissance' => $this->faker->dateTimeBetween('-45 years', '-18 years')->format('Y-m-d'),
            'lieu_naissance' => $this->faker->city(),
            'nationalite' => 'Tchadienne',
            'situation_familiale' => $this->faker->randomElement(['celibataire', 'marie', 'veuf', 'divorce']),
            'sexe' => $this->faker->randomElement(['M', 'F']),
            'adresse' => $this->faker->address(),
            'nni' => $this->faker->unique()->numerify('#########'),
            'langues' => [
                ['langue' => 'Français', 'niveau' => 'courant'],
                ['langue' => 'Arabe', 'niveau' => 'intermediaire'],
            ],
        ];
    }
}
