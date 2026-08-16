<?php

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Enums\CompetitionStatus;

class CompetitionFactory extends Factory
{
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-1 month', '+1 month');
        $endDate = (clone $startDate)->modify('+'.rand(15, 60).' days');
        
        return [
            'department_id' => Department::factory(),
            'title' => 'Concours ' . $this->faker->words(3, true),
            'reference' => 'C-' . strtoupper($this->faker->unique()->lexify('????')) . '-' . date('Y'),
            'description' => $this->faker->paragraphs(3, true),
            'quota' => $this->faker->numberBetween(10, 500),
            'required_documents' => \App\Enums\DocumentType::concoursDefaults(),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => $this->faker->randomElement([CompetitionStatus::DRAFT, CompetitionStatus::PUBLISHED, CompetitionStatus::OPEN]),
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CompetitionStatus::PUBLISHED,
            'published_at' => now(),
        ]);
    }

    public function open(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CompetitionStatus::OPEN,
            'published_at' => now()->subDays(2),
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(30),
        ]);
    }
}
