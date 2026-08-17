<?php

namespace Database\Seeders;

use App\Enums\ApplicationStatus;
use App\Enums\RoleName;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\Diploma;
use App\Models\Document;
use App\Models\JobOffer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DemoApplicationsSeeder extends Seeder
{
    public function run(): void
    {
        $offers = JobOffer::query()->orderBy('id')->get();
        if ($offers->count() < 2) {
            $this->command?->warn('Aucune offre : lancez TestDataSeeder d’abord.');

            return;
        }

        $moussa = User::where('email', 'candidat@test.td')->first();
        $fatime = $this->candidate('fatime@test.td', 'Fatime', 'Hassan', '334455667', '+23566224400');
        $ibrahim = $this->candidate('ibrahim@test.td', 'Ibrahim', 'Mahamat', '445566778', '+23566335500');

        if ($moussa) {
            $this->fillDossier($moussa);
            $this->deposit($moussa, $offers[0], ApplicationStatus::SUBMITTED, 'APP-2026-0001');
            if ($offers->count() > 1) {
                $this->deposit($moussa, $offers[1], ApplicationStatus::UNDER_REVIEW, 'APP-2026-0002');
            }
        }

        $this->fillDossier($fatime);
        $accepted = $this->deposit($fatime, $offers[0], ApplicationStatus::ACCEPTED, 'APP-2026-0003');
        $accepted->generateAnonymatNumber();

        $this->fillDossier($ibrahim);
        $this->deposit(
            $ibrahim,
            $offers[min(1, $offers->count() - 1)],
            ApplicationStatus::REJECTED,
            'APP-2026-0004',
            'Diplôme exigé par l’avis non produit (copie illisible).',
        );

        $this->command?->info('[OK] Dossiers de démonstration déposés.');
    }

    private function candidate(string $email, string $first, string $last, string $nin, string $phone): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'first_name' => $first,
                'last_name' => $last,
                'password' => Hash::make('password'),
                'nin' => $nin,
                'phone' => $phone,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $user->syncRoles([RoleName::Candidat->value]);

        return $user;
    }

    private function fillDossier(User $user): Candidate
    {
        $candidate = $user->candidate ?: $user->candidate()->create(['nni' => $user->nin]);

        $photoPath = 'candidates/'.$candidate->id.'/photo.jpg';
        Storage::disk('public')->put($photoPath, 'fake-photo');

        $candidate->update([
            'date_naissance' => '1994-06-15',
            'lieu_naissance' => 'N\'Djamena',
            'nationalite' => 'Tchadienne',
            'situation_familiale' => 'celibataire',
            'sexe' => 'M',
            'adresse' => 'Avenue Charles de Gaulle, N\'Djamena',
            'photo_path' => $photoPath,
            'langues' => [['langue' => 'Français', 'niveau' => 'courant']],
        ]);

        foreach (['cni', 'acte_naissance', 'casier_judiciaire', 'diplome'] as $type) {
            $path = 'candidates/'.$candidate->id.'/'.$type.'.pdf';
            Storage::disk('public')->put($path, '%PDF-fake');
            $document = Document::firstOrCreate(
                ['candidate_id' => $candidate->id, 'type' => $type, 'application_id' => null],
                ['path' => $path, 'status' => 'en attente']
            );

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

    private function deposit(
        User $user,
        JobOffer $offer,
        ApplicationStatus $status,
        string $number,
        ?string $rejection = null,
    ): Application {
        return Application::updateOrCreate(
            ['user_id' => $user->id, 'job_offer_id' => $offer->id],
            [
                'application_number' => $number,
                'status' => $status->value,
                'submitted_at' => now()->subDays(rand(1, 8)),
                'rejection_reason' => $rejection,
                'dossier_frozen_at' => now()->subDays(rand(1, 8)),
            ]
        );
    }
}
