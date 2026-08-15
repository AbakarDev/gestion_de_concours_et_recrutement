<?php

namespace Tests\Feature;

use App\Enums\RoleName;
use App\Models\Application;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_applications_with_pagination(): void
    {
        $this->actingAsRole(RoleName::Administrateur);
        Application::factory()->count(5)->create();

        $response = $this->getJson('/api/applications?per_page=10');

        $response->assertStatus(200)
                 ->assertJsonCount(5, 'data');
    }

    public function test_can_view_application_details(): void
    {
        $this->actingAsRole(RoleName::Administrateur);
        $application = Application::factory()->create();

        $response = $this->getJson("/api/applications/{$application->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('data.id', $application->id);
    }

    public function test_can_update_application_status(): void
    {
        $this->actingAsRole(RoleName::Administrateur);
        $application = Application::factory()->create(['status' => 'submitted']);

        $payload = [
            'status' => 'under_review',
            'admin_notes' => 'Le dossier est en cours d\'instruction.',
        ];

        $response = $this->patchJson("/api/applications/{$application->id}/status", $payload);

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'under_review');

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'under_review',
        ]);
    }

    public function test_status_change_notifies_the_candidate(): void
    {
        $this->actingAsRole(RoleName::Administrateur);
        $application = Application::factory()->create(['status' => 'submitted']);

        $this->patchJson("/api/applications/{$application->id}/status", [
            'status' => 'under_review',
            'admin_notes' => 'Instruction en cours.',
        ])->assertOk();

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $application->user_id,
            'notifiable_type' => \App\Models\User::class,
        ]);
    }

    public function test_new_application_notifies_administrators(): void
    {
        $this->seedRoles();
        $admin = \App\Models\User::factory()->create(['is_active' => true]);
        $admin->assignRole(RoleName::Administrateur->value);

        $this->actingAsRole(RoleName::Candidat);
        $competition = \App\Models\Competition::factory()->open()->create();
        $offer = \App\Models\JobOffer::factory()->published()->create([
            'competition_id' => $competition->id,
        ]);

        $this->postJson('/api/applications', ['job_offer_id' => $offer->id])
            ->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $admin->id,
            'notifiable_type' => \App\Models\User::class,
        ]);
    }

    public function test_accepted_application_notifies_jury(): void
    {
        $this->seedRoles();
        $jury = \App\Models\User::factory()->create(['is_active' => true]);
        $jury->assignRole(RoleName::Jury->value);

        $this->actingAsRole(RoleName::Administrateur);
        $application = Application::factory()->create(['status' => 'submitted']);

        $this->patchJson("/api/applications/{$application->id}/status", [
            'status' => 'accepted',
            'admin_notes' => 'Dossier complet.',
        ])->assertOk();

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $jury->id,
            'notifiable_type' => \App\Models\User::class,
        ]);
    }

    public function test_candidat_cannot_update_application_status(): void
    {
        $this->actingAsRole(RoleName::Candidat);
        $application = Application::factory()->create(['status' => 'submitted']);

        $this->patchJson("/api/applications/{$application->id}/status", [
            'status' => 'accepted',
        ])->assertForbidden();
    }
}
