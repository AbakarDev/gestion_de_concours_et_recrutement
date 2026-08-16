<?php

namespace Tests;

use App\Enums\RoleName;
use App\Models\Candidate;
use App\Models\Diploma;
use App\Models\Document;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Storage;
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

    /**
     * Constitue un dossier ministériel minimal (état civil, photo, CNI, diplôme scanné, pièces d'avis).
     */
    protected function completeMinisterialDossier(User $user): Candidate
    {
        Storage::fake('public');

        $candidate = $user->candidate ?: $user->candidate()->create(['nni' => $user->nin]);
        $user->setRelation('candidate', $candidate);

        $photoPath = 'candidates/'.$candidate->id.'/photo.jpg';
        Storage::disk('public')->put($photoPath, 'fake-photo');

        $candidate->update([
            'date_naissance' => '1994-06-15',
            'lieu_naissance' => 'N\'Djamena',
            'nationalite' => 'Tchadienne',
            'situation_familiale' => 'celibataire',
            'sexe' => 'M',
            'adresse' => 'Avenue Mobutu, N\'Djamena',
            'photo_path' => $photoPath,
            'langues' => [
                ['langue' => 'Français', 'niveau' => 'courant'],
            ],
        ]);

        foreach (['cni', 'acte_naissance', 'casier_judiciaire', 'diplome'] as $type) {
            $path = 'candidates/'.$candidate->id.'/'.$type.'.pdf';
            Storage::disk('public')->put($path, '%PDF-fake');
            $document = Document::create([
                'candidate_id' => $candidate->id,
                'type' => $type,
                'path' => $path,
                'status' => 'en attente',
            ]);

            if ($type === 'diplome' && ! $candidate->diplomas()->exists()) {
                Diploma::create([
                    'candidate_id' => $candidate->id,
                    'niveau' => 'Licence',
                    'type_diplome' => 'Licence',
                    'etablissement' => 'Université de N\'Djamena',
                    'specialite' => 'Droit public',
                    'annee' => 2020,
                    'document_id' => $document->id,
                ]);
            }
        }

        return $candidate->fresh(['diplomas', 'documents']);
    }

    protected function ministerialLetterBody(): string
    {
        return 'J\'ai l\'honneur de solliciter l\'honneur de postuler au concours de la fonction publique. '
            .'Titulaire d\'une licence et de nationalité tchadienne, je m\'engage à servir l\'État avec loyauté, '
            .'rigueur et respect du secret professionnel. Je joins à la présente l\'ensemble des pièces exigées '
            .'par l\'avis de concours et reste à la disposition de l\'administration pour tout complément.';
    }
}
