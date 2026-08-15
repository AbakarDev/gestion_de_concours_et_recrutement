<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\Result;
use Illuminate\Database\Eloquent\Factories\Factory;

class ResultFactory extends Factory
{
    protected $model = Result::class;

    public function definition(): array
    {
        return [
            'application_id' => Application::factory(),
            'moyenne' => $this->faker->randomFloat(2, 0, 20),
            'rang' => $this->faker->numberBetween(1, 50),
            'decision' => $this->faker->randomElement(['admis', 'ajourne']),
            'is_admitted' => false,
            'locked_at' => null,
        ];
    }
}
