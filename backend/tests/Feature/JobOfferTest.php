<?php

namespace Tests\Feature;

use App\Enums\RoleName;
use App\Models\Competition;
use App\Models\JobOffer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobOfferTest extends TestCase
{
    use RefreshDatabase;

    protected Competition $competition;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsRole(RoleName::Recruteur);
        $this->competition = Competition::factory()->create();
    }

    public function test_can_list_job_offers_with_pagination_and_filters(): void
    {
        JobOffer::factory()->count(10)->create(['competition_id' => $this->competition->id]);
        JobOffer::factory()->create([
            'competition_id' => $this->competition->id,
            'title' => 'Développeur Fullstack',
        ]);

        $response = $this->getJson('/api/job-offers?per_page=10&search=Fullstack');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.title', 'Développeur Fullstack');
    }

    public function test_can_create_job_offer(): void
    {
        $payload = [
            'competition_id' => $this->competition->id,
            'title' => 'Ingénieur Système',
            'positions_count' => 5,
            'location' => 'N\'Djamena',
            'requirements' => ['Diplôme' => 'Bac+5', 'Expérience' => '2 ans'],
        ];

        $response = $this->postJson('/api/job-offers', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('data.title', 'Ingénieur Système');

        $this->assertDatabaseHas('job_offers', ['title' => 'Ingénieur Système']);
    }

    public function test_can_update_job_offer(): void
    {
        $jobOffer = JobOffer::factory()->create([
            'competition_id' => $this->competition->id,
            'title' => 'Old Title',
            'positions_count' => 2,
        ]);

        $payload = [
            'competition_id' => $this->competition->id,
            'title' => 'New Title',
            'positions_count' => 10,
        ];

        $response = $this->putJson("/api/job-offers/{$jobOffer->id}", $payload);

        $response->assertStatus(200)
                 ->assertJsonPath('data.title', 'New Title');

        $this->assertDatabaseHas('job_offers', [
            'id' => $jobOffer->id,
            'title' => 'New Title',
            'positions_count' => 10,
        ]);
    }

    public function test_can_delete_job_offer(): void
    {
        $jobOffer = JobOffer::factory()->create([
            'competition_id' => $this->competition->id,
        ]);

        $response = $this->deleteJson("/api/job-offers/{$jobOffer->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('job_offers', ['id' => $jobOffer->id]);
    }
}
