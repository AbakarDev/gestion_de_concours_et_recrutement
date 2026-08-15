<?php

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\RoleName;
use App\Models\Competition;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompetitionTest extends TestCase
{
    use RefreshDatabase;

    protected Department $department;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsRole(RoleName::ResponsableConcours);
        $this->department = Department::factory()->create();
    }

    public function test_can_list_competitions_with_pagination_and_filters(): void
    {
        Competition::factory()->count(20)->create(['department_id' => $this->department->id]);
        Competition::factory()->create([
            'department_id' => $this->department->id,
            'title' => 'Concours Spécial 2026',
            'status' => CompetitionStatus::DRAFT
        ]);

        $response = $this->getJson('/api/competitions?per_page=10&search=Spécial');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.title', 'Concours Spécial 2026');
    }

    public function test_can_create_competition(): void
    {
        $payload = [
            'department_id' => $this->department->id,
            'title' => 'Nouveau Concours',
            'reference' => 'REF-1234',
            'description' => 'Test',
            'quota' => 50,
            'required_documents' => ['CV', 'Lettre de motivation'],
            'start_date' => now()->addDay()->format('Y-m-d'),
            'end_date' => now()->addDays(30)->format('Y-m-d'),
        ];

        $response = $this->postJson('/api/competitions', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('data.title', 'Nouveau Concours')
                 ->assertJsonPath('data.status', 'draft');

        $this->assertDatabaseHas('competitions', ['reference' => 'REF-1234']);
    }

    public function test_can_publish_competition(): void
    {
        $competition = Competition::factory()->create([
            'department_id' => $this->department->id,
            'status' => CompetitionStatus::DRAFT
        ]);

        $response = $this->postJson("/api/competitions/{$competition->id}/publish");

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'published');

        $this->assertDatabaseHas('competitions', [
            'id' => $competition->id,
            'status' => 'published',
        ]);
        $this->assertNotNull($competition->fresh()->published_at);
    }

    public function test_can_unpublish_competition(): void
    {
        $competition = Competition::factory()->create([
            'department_id' => $this->department->id,
            'status' => CompetitionStatus::PUBLISHED,
            'published_at' => now(),
        ]);

        $response = $this->postJson("/api/competitions/{$competition->id}/unpublish");

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'draft');

        $this->assertDatabaseHas('competitions', [
            'id' => $competition->id,
            'status' => 'draft',
            'published_at' => null,
        ]);
    }
}
