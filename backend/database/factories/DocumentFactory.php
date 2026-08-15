<?php

namespace Database\Factories;

use App\Models\Application;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'application_id' => Application::factory(),
            'type' => $this->faker->randomElement(['CV', 'Lettre de motivation', 'Diplôme', 'CNI']),
            'path' => 'documents/' . $this->faker->uuid() . '.pdf',
            'status' => $this->faker->randomElement(['en attente', 'validé', 'rejeté']),
        ];
    }
}
