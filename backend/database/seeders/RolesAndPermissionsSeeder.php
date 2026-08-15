<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Réinitialiser le cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ─── Définition des permissions ────────────────────────────────────
        $permissions = [
            // Utilisateurs & rôles (Super Admin uniquement)
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'audit.view',

            // Concours (Responsable de concours)
            'competitions.view', 'competitions.create', 'competitions.edit',
            'competitions.delete', 'competitions.publish', 'competitions.quota',

            // Offres d'emploi (Recruteur)
            'job_offers.view', 'job_offers.create', 'job_offers.edit', 'job_offers.delete',

            // Candidatures
            'applications.view',       // Voir les candidatures
            'applications.create',     // Déposer une candidature (Candidat)
            'applications.edit',       // Modifier une candidature (Candidat)
            'applications.validate',   // Valider / rejeter (Administrateur)
            'applications.evaluate',   // Saisir les notes (Jury)
            'applications.preselect',  // Présélectionner (Recruteur)
            'applications.delete',     // Supprimer (Super Admin)

            // Documents
            'documents.view', 'documents.upload', 'documents.download', 'documents.delete',

            // Départements
            'departments.view', 'departments.create', 'departments.edit', 'departments.delete',

            // Résultats
            'results.view', 'results.publish',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        // ─── Rôle 1 : Super Administrateur ────────────────────────────────
        // Toutes les permissions + audit
        $roleSuperAdmin = Role::firstOrCreate(['name' => 'SuperAdmin', 'guard_name' => 'sanctum']);
        $roleSuperAdmin->syncPermissions(Permission::where('guard_name', 'sanctum')->get());

        // ─── Rôle 2 : Administrateur ──────────────────────────────────────
        // Instruit les dossiers : vérification, validation/rejet motivé
        $roleAdmin = Role::firstOrCreate(['name' => 'Administrateur', 'guard_name' => 'sanctum']);
        $roleAdmin->syncPermissions([
            'competitions.view',
            'job_offers.view',
            'applications.view', 'applications.validate',
            'documents.view', 'documents.download',
            'departments.view',
        ]);

        // ─── Rôle 3 : Responsable de concours ────────────────────────────
        // Crée, publie les concours, définit les quotas, publie les résultats
        $roleResponsable = Role::firstOrCreate(['name' => 'Responsable de concours', 'guard_name' => 'sanctum']);
        $roleResponsable->syncPermissions([
            'competitions.view', 'competitions.create', 'competitions.edit',
            'competitions.publish', 'competitions.quota',
            'job_offers.view', 'job_offers.create', 'job_offers.edit', 'job_offers.delete',
            'applications.view',
            'documents.view',
            'departments.view',
            'results.view', 'results.publish',
        ]);

        // ─── Rôle 4 : Jury / Commission ──────────────────────────────────
        // Saisit les notes par numéro anonyme, valide les résultats
        $roleJury = Role::firstOrCreate(['name' => 'Jury', 'guard_name' => 'sanctum']);
        $roleJury->syncPermissions([
            'competitions.view',
            'job_offers.view',
            'applications.view', 'applications.evaluate',
            'documents.view',
            'results.view',
        ]);

        // ─── Rôle 5 : Recruteur ──────────────────────────────────────────
        // Gère les offres de recrutement direct, présélectionne les candidats
        $roleRecruteur = Role::firstOrCreate(['name' => 'Recruteur', 'guard_name' => 'sanctum']);
        $roleRecruteur->syncPermissions([
            'job_offers.view', 'job_offers.create', 'job_offers.edit', 'job_offers.delete',
            'applications.view', 'applications.preselect',
            'documents.view', 'documents.download',
            'results.view',
        ]);

        // ─── Rôle 6 : Candidat ───────────────────────────────────────────
        // Dépose une candidature, suit son dossier
        $roleCandidat = Role::firstOrCreate(['name' => 'candidat', 'guard_name' => 'sanctum']);
        $roleCandidat->syncPermissions([
            'competitions.view',
            'job_offers.view',
            'applications.view', 'applications.create', 'applications.edit',
            'documents.upload', 'documents.view',
        ]);

        // ─── Utilisateurs de démonstration ───────────────────────────────

        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@recrute.td'],
            [
                'first_name' => 'Super', 'last_name' => 'Admin',
                'password'   => Hash::make('password'),
                'nin'        => '000000001', 'phone' => '+23500000001',
                'is_active'  => true, 'email_verified_at' => now(),
            ]
        );
        $superAdmin->syncRoles([$roleSuperAdmin]);

        $admin = User::firstOrCreate(
            ['email' => 'admin@recrute.td'],
            [
                'first_name' => 'Jean', 'last_name' => 'Administrateur',
                'password'   => Hash::make('password'),
                'nin'        => '000000002', 'phone' => '+23500000002',
                'is_active'  => true, 'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles([$roleAdmin]);

        $responsable = User::firstOrCreate(
            ['email' => 'responsable@recrute.td'],
            [
                'first_name' => 'Fatima', 'last_name' => 'Responsable',
                'password'   => Hash::make('password'),
                'nin'        => '000000003', 'phone' => '+23500000003',
                'is_active'  => true, 'email_verified_at' => now(),
            ]
        );
        $responsable->syncRoles([$roleResponsable]);

        $juryUser = User::firstOrCreate(
            ['email' => 'jury@recrute.td'],
            [
                'first_name' => 'Membre', 'last_name' => 'Jury',
                'password'   => Hash::make('password'),
                'nin'        => '222222222', 'phone' => '+23522222222',
                'is_active'  => true, 'email_verified_at' => now(),
            ]
        );
        $juryUser->syncRoles([$roleJury]);

        $recruteur = User::firstOrCreate(
            ['email' => 'recruteur@recrute.td'],
            [
                'first_name' => 'Ali', 'last_name' => 'Recruteur',
                'password'   => Hash::make('password'),
                'nin'        => '000000005', 'phone' => '+23500000005',
                'is_active'  => true, 'email_verified_at' => now(),
            ]
        );
        $recruteur->syncRoles([$roleRecruteur]);

        $candidat = User::firstOrCreate(
            ['email' => 'candidat@test.td'],
            [
                'first_name' => 'Moussa', 'last_name' => 'Candidat',
                'password'   => Hash::make('password'),
                'nin'        => '111111111', 'phone' => '+23511111111',
                'is_active'  => true, 'email_verified_at' => now(),
            ]
        );
        $candidat->syncRoles([$roleCandidat]);
    }
}
