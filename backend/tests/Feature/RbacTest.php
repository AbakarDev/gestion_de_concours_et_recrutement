<?php

namespace Tests\Feature;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_gate_allows_everything(): void
    {
        $this->actingAsRole(RoleName::SuperAdmin);

        $this->assertTrue(Gate::check('some-random-permission'));
    }

    public function test_candidat_without_permission_is_denied(): void
    {
        $this->actingAsRole(RoleName::Candidat);

        $this->assertFalse(Gate::check('competitions.create'));
    }

    public function test_responsable_can_create_competitions(): void
    {
        $this->actingAsRole(RoleName::ResponsableConcours);

        $this->assertTrue(Gate::check('competitions.create'));
    }

    public function test_administrateur_can_validate_applications(): void
    {
        $this->actingAsRole(RoleName::Administrateur);

        $this->assertTrue(Gate::check('applications.validate'));
    }

    public function test_candidat_cannot_list_users(): void
    {
        $this->actingAsRole(RoleName::Candidat);

        $this->getJson('/api/users')->assertForbidden();
    }

    public function test_superadmin_can_list_users(): void
    {
        $this->actingAsRole(RoleName::SuperAdmin);

        $this->getJson('/api/users')->assertOk();
    }

    public function test_administrateur_cannot_create_competition(): void
    {
        $this->actingAsRole(RoleName::Administrateur);

        $this->postJson('/api/competitions', [])->assertForbidden();
    }

    public function test_candidat_cannot_initiate_payment_for_another_user(): void
    {
        $owner = $this->actingAsRole(RoleName::Candidat);
        $application = \App\Models\Application::factory()->create(['user_id' => $owner->id]);

        $intruder = User::factory()->create(['is_active' => true]);
        $intruder->assignRole(RoleName::Candidat->value);
        \Laravel\Sanctum\Sanctum::actingAs($intruder);

        $this->postJson('/api/payments/initiate', [
            'application_id' => $application->id,
            'phone_number' => '+23566000000',
        ])->assertForbidden();
    }
}
