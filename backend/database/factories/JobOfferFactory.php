<?php

namespace Database\Factories;

use App\Models\Competition;
use Illuminate\Database\Eloquent\Factories\Factory;

class JobOfferFactory extends Factory
{
    public function definition(): array
    {
        return [
            'competition_id' => Competition::factory(),
            'title' => 'Poste de ' . $this->faker->jobTitle(),
            'positions_count' => $this->faker->numberBetween(1, 20),
            'location' => $this->faker->city(),
            'requirements' => [
                'Niveau' => $this->faker->randomElement(['Bac+3', 'Bac+5', 'Doctorat']),
                'Expérience' => $this->faker->randomElement(['1 an', '3 ans', '5 ans']),
                'Compétences' => $this->faker->words(3, true),
            ],
            'status' => 'draft',
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
        ]);
    }
}
