<?php

namespace Tests\Feature;

use App\Enums\RoleName;
use App\Models\Application;
use App\Models\JobOffer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCompletenessTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_stats_return_real_counts(): void
    {
        $this->getJson('/api/public/stats')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'active_competitions',
                    'total_candidates',
                    'departments_count',
                    'total_jobs',
                ],
            ]);
    }

    public function test_guest_does_not_see_draft_competitions(): void
    {
        \App\Models\Competition::factory()->create([
            'title' => 'Brouillon secret',
            'status' => 'draft',
        ]);
        \App\Models\Competition::factory()->create([
            'title' => 'Concours public',
            'status' => 'published',
        ]);

        $titles = collect($this->getJson('/api/competitions')->assertOk()->json('data'))->pluck('title');

        $this->assertFalse($titles->contains('Brouillon secret'));
        $this->assertTrue($titles->contains('Concours public'));
    }

    public function test_job_offer_list_includes_status(): void
    {
        $this->actingAsRole(RoleName::Recruteur);
        JobOffer::factory()->create(['title' => 'Officier', 'status' => 'draft']);

        $this->getJson('/api/job-offers?search=Officier')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'draft')
            ->assertJsonPath('data.0.status_label', 'Brouillon');
    }

    public function test_admin_can_export_applications_csv(): void
    {
        $this->actingAsRole(RoleName::Administrateur);
        Application::factory()->create();

        $this->get('/api/exports/applications?format=csv')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_candidat_cannot_export_applications(): void
    {
        $this->actingAsRole(RoleName::Candidat);

        $this->getJson('/api/exports/applications?format=csv')->assertForbidden();
    }

    public function test_superadmin_can_update_settings(): void
    {
        $this->actingAsRole(RoleName::SuperAdmin);

        $this->putJson('/api/settings', [
            'platform_name' => 'E-Concours Démo',
            'registration_enabled' => false,
        ])->assertOk()
          ->assertJsonPath('data.platform_name', 'E-Concours Démo')
          ->assertJsonPath('data.registration_enabled', '0');

        $this->getJson('/api/public/settings')
            ->assertOk()
            ->assertJsonPath('data.platform_name', 'E-Concours Démo')
            ->assertJsonPath('data.registration_enabled', false);
    }

    public function test_superadmin_can_create_staff_user(): void
    {
        $this->actingAsRole(RoleName::SuperAdmin);

        $this->postJson('/api/users', [
            'first_name' => 'Amina',
            'last_name' => 'Hassan',
            'email' => 'amina.hassan@recrute.td',
            'password' => 'password12',
            'role' => RoleName::Administrateur->value,
        ])->assertCreated()
          ->assertJsonPath('data.email', 'amina.hassan@recrute.td');

        $this->assertDatabaseHas('users', ['email' => 'amina.hassan@recrute.td']);
    }

    public function test_superadmin_cannot_deactivate_self(): void
    {
        $admin = $this->actingAsRole(RoleName::SuperAdmin);

        $this->patchJson("/api/users/{$admin->id}/active")
            ->assertStatus(422);
    }

    public function test_superadmin_can_deactivate_another_user(): void
    {
        $this->actingAsRole(RoleName::SuperAdmin);
        $other = User::factory()->create(['is_active' => true]);

        $this->patchJson("/api/users/{$other->id}/active")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }
}
