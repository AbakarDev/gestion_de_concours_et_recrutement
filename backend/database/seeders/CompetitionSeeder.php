<?php

namespace Database\Seeders;

use App\Models\Competition;
use App\Models\Department;
use Illuminate\Database\Seeder;

class CompetitionSeeder extends Seeder
{
    public function run(): void
    {
        if (Department::count() === 0) {
            Department::factory()->count(5)->create();
        }

        $departments = Department::all();

        foreach ($departments as $department) {
            Competition::factory()->count(3)->create([
                'department_id' => $department->id,
            ]);
            
            // Create at least one open competition per department
            Competition::factory()->open()->create([
                'department_id' => $department->id,
            ]);
        }
    }
}
