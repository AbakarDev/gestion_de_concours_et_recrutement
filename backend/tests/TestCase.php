<?php

namespace Tests;

use App\Enums\RoleName;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    protected function seedRoles(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->app->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    protected function actingAsRole(RoleName|string $role): User
    {
        $this->seedRoles();

        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role instanceof RoleName ? $role->value : $role);

        Sanctum::actingAs($user);

        return $user;
    }
}
