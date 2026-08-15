<?php

namespace Tests\Feature;

use App\Enums\RoleName;
use App\Enums\CompetitionStatus;
use App\Models\Application;
use App\Models\Competition;
use App\Models\JobOffer;
use App\Models\Result;
use App\Models\Score;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CriticalBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_application_rejection_requires_reason(): void
    {
        $this->actingAsRole(RoleName::Administrateur);
        $application = Application::factory()->create(['status' => 'submitted']);

        $response = $this->postJson("/api/applications/{$application->id}/status", [
            'status' => 'rejected',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['rejection_reason']);
    }

    public function test_jury_cannot_modify_locked_scores(): void
    {
        $this->actingAsRole(RoleName::Jury);

        $application = Application::factory()->create(['status' => 'evaluated']);

        Result::factory()->create([
            'application_id' => $application->id,
            'locked_at' => now(),
        ]);

        Score::factory()->create([
            'application_id' => $application->id,
            'locked_at' => now(),
        ]);

        $response = $this->postJson("/api/applications/{$application->id}/scores", [
            'epreuve' => 'Test',
            'note' => 15,
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Les données fournies ne sont pas valides.']);
    }

    public function test_score_stores_integrity_hash(): void
    {
        $jury = $this->actingAsRole(RoleName::Jury);
        $application = Application::factory()->create(['status' => 'accepted']);

        $response = $this->postJson("/api/applications/{$application->id}/scores", [
            'epreuve' => 'Épreuve Écrite',
            'note' => 14.5,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('scores', [
            'application_id' => $application->id,
            'epreuve' => 'Épreuve Écrite',
            'jury_id' => $jury->id,
        ]);
        $this->assertNotNull($application->fresh()->scores()->first()->integrity_hash);
        $this->assertTrue($application->fresh()->scores()->first()->integrityHolds());
    }

    public function test_jury_sees_only_anonymat_number_in_api_response(): void
    {
        $this->actingAsRole(RoleName::Jury);

        $application = Application::factory()->create([
            'status' => 'accepted',
            'anonymat_number' => 'ANON-2026-12345',
        ]);

        $response = $this->getJson("/api/applications/{$application->id}");

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertNull($data['user']);
        $this->assertNull($data['application_number']);
        $this->assertNull($data['submitted_at']);
        $this->assertNull($data['convocation_url']);
        $this->assertNull($data['admin_notes']);
        $this->assertEquals('ANON-2026-12345', $data['anonymat_number']);
        $this->assertEquals($application->id, $data['id']);
    }

    public function test_administrator_still_sees_application_number(): void
    {
        $this->actingAsRole(RoleName::Administrateur);

        $application = Application::factory()->create([
            'status' => 'accepted',
            'anonymat_number' => 'ANON-2026-12345',
            'application_number' => 'APP-VISIBLE',
        ]);

        $response = $this->getJson("/api/applications/{$application->id}");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertNotNull($data['user']);
        $this->assertEquals('APP-VISIBLE', $data['application_number']);
        $this->assertEquals('ANON-2026-12345', $data['anonymat_number']);
    }

    public function test_jury_cannot_view_application_before_anonymat(): void
    {
        $this->actingAsRole(RoleName::Jury);

        $application = Application::factory()->create(['status' => 'submitted']);

        $this->getJson("/api/applications/{$application->id}")->assertForbidden();
    }

    public function test_jury_index_lists_only_accepted_and_evaluated(): void
    {
        $this->actingAsRole(RoleName::Jury);

        Application::factory()->create(['status' => 'submitted']);
        Application::factory()->create(['status' => 'under_review']);
        $accepted = Application::factory()->create([
            'status' => 'accepted',
            'anonymat_number' => 'ANON-OK',
        ]);

        $response = $this->getJson('/api/applications?per_page=50');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($accepted->id, $response->json('data.0.id'));
        $this->assertNull($response->json('data.0.application_number'));
        $this->assertNull($response->json('data.0.user'));
    }

    public function test_jury_ranking_omits_application_number(): void
    {
        $this->actingAsRole(RoleName::Jury);

        $offer = JobOffer::factory()->create();
        $application = Application::factory()->create([
            'job_offer_id' => $offer->id,
            'status' => 'evaluated',
            'anonymat_number' => 'ANON-RANK-1',
            'application_number' => 'APP-SECRET',
        ]);
        Score::factory()->create([
            'application_id' => $application->id,
            'note' => 16.5,
        ]);

        $response = $this->getJson("/api/job-offers/{$offer->id}/ranking");

        $response->assertOk();
        $row = $response->json('data.0');
        $this->assertEquals('ANON-RANK-1', $row['anonymat_number']);
        $this->assertArrayNotHasKey('application_number', $row);
    }

    public function test_administrator_ranking_includes_application_number(): void
    {
        $this->actingAsRole(RoleName::Administrateur);

        $offer = JobOffer::factory()->create();
        $application = Application::factory()->create([
            'job_offer_id' => $offer->id,
            'status' => 'evaluated',
            'anonymat_number' => 'ANON-RANK-1',
            'application_number' => 'APP-VISIBLE',
        ]);
        Score::factory()->create([
            'application_id' => $application->id,
            'note' => 14,
        ]);

        $response = $this->getJson("/api/job-offers/{$offer->id}/ranking");

        $response->assertOk();
        $row = $response->json('data.0');
        $this->assertEquals('ANON-RANK-1', $row['anonymat_number']);
        $this->assertEquals('APP-VISIBLE', $row['application_number']);
    }

    public function test_cannot_apply_outside_competition_window(): void
    {
        $this->actingAsRole(RoleName::Candidat);

        $competition = Competition::factory()->create([
            'status' => CompetitionStatus::PUBLISHED,
            'published_at' => now()->subDays(40),
            'start_date' => now()->subDays(40),
            'end_date' => now()->subDay(),
            'registration_open_date' => now()->subDays(40),
            'registration_close_date' => now()->subDay(),
        ]);

        $offer = JobOffer::factory()->published()->create([
            'competition_id' => $competition->id,
        ]);

        $this->postJson('/api/applications', [
            'job_offer_id' => $offer->id,
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['job_offer_id']);
    }

    public function test_cannot_apply_twice_to_the_same_offer(): void
    {
        $user = $this->actingAsRole(RoleName::Candidat);
        $competition = Competition::factory()->open()->create();
        $offer = JobOffer::factory()->published()->create([
            'competition_id' => $competition->id,
        ]);

        $this->postJson('/api/applications', ['job_offer_id' => $offer->id])
            ->assertCreated();

        $this->postJson('/api/applications', ['job_offer_id' => $offer->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['job_offer_id']);

        $this->assertEquals(1, Application::where('user_id', $user->id)->where('job_offer_id', $offer->id)->count());
    }

    public function test_accepting_application_writes_history_and_generates_anonymat(): void
    {
        $this->actingAsRole(RoleName::Administrateur);
        $competition = Competition::factory()->open()->create();
        $offer = JobOffer::factory()->published()->create([
            'competition_id' => $competition->id,
            'fee_required' => false,
        ]);
        $application = Application::factory()->create([
            'job_offer_id' => $offer->id,
            'status' => 'submitted',
        ]);

        $response = $this->patchJson("/api/applications/{$application->id}/status", [
            'status' => 'accepted',
            'admin_notes' => 'Dossier complet.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'accepted');

        $this->assertNotNull($application->fresh()->anonymat_number);
        $this->assertDatabaseHas('application_status_history', [
            'application_id' => $application->id,
            'to_status' => 'accepted',
        ]);
        $this->assertNotEmpty($response->json('data.status_history'));
    }
}
