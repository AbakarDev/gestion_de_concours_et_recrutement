<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\Score;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ScoreFactory extends Factory
{
    protected $model = Score::class;

    public function definition(): array
    {
        return [
            'application_id' => Application::factory(),
            'jury_id' => User::factory(),
            'epreuve' => $this->faker->randomElement(['Épreuve Écrite', 'Entretien Oral', 'Test Technique']),
            'note' => $this->faker->randomFloat(2, 0, 20),
            'commentaire' => $this->faker->optional()->sentence(),
            'locked_at' => null,
        ];
    }
}
