<?php

namespace Tests\Feature;

use App\Enums\DocumentType;
use App\Enums\RoleName;
use App\Models\Competition;
use App\Models\Diploma;
use App\Models\JobOffer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MinisterialDossierTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_apply_with_an_incomplete_dossier(): void
    {
        $this->actingAsRole(RoleName::Candidat);
        $competition = Competition::factory()->open()->create();
        $offer = JobOffer::factory()->published()->create([
            'competition_id' => $competition->id,
        ]);

        $this->postJson('/api/applications', ['job_offer_id' => $offer->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['dossier']);
    }

    public function test_can_apply_with_a_complete_ministerial_dossier(): void
    {
        $user = $this->actingAsRole(RoleName::Candidat);
        $this->completeMinisterialDossier($user);

        $competition = Competition::factory()->open()->create();
        $offer = JobOffer::factory()->published()->create([
            'competition_id' => $competition->id,
        ]);

        $response = $this->postJson('/api/applications', ['job_offer_id' => $offer->id]);

        $response->assertCreated();
        $this->assertDatabaseHas('applications', [
            'user_id' => $user->id,
            'job_offer_id' => $offer->id,
        ]);
        $this->assertNotNull($response->json('data.dossier_frozen_at'));
        $this->assertDatabaseHas('documents', [
            'application_id' => $response->json('data.id'),
            'type' => DocumentType::CvOfficiel->value,
        ]);
    }

    public function test_cover_letter_is_required_when_listed_on_the_competition(): void
    {
        $user = $this->actingAsRole(RoleName::Candidat);
        $this->completeMinisterialDossier($user);

        $competition = Competition::factory()->open()->create([
            'required_documents' => DocumentType::recrutementDefaults(),
        ]);
        $offer = JobOffer::factory()->published()->create([
            'competition_id' => $competition->id,
        ]);

        $this->postJson('/api/applications', ['job_offer_id' => $offer->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['dossier']);

        $this->postJson('/api/applications', [
            'job_offer_id' => $offer->id,
            'motivation_objet' => 'Candidature au poste d\'attaché d\'administration',
            'motivation_corps' => $this->ministerialLetterBody(),
        ])->assertCreated();

        $this->assertDatabaseHas('documents', [
            'type' => DocumentType::LettreCandidature->value,
        ]);
    }

    public function test_candidate_can_upload_identity_photo(): void
    {
        Storage::fake('public');
        $this->actingAsRole(RoleName::Candidat);
        $photo = UploadedFile::fake()->image('identite.jpg', 350, 450);

        $this->post('/api/candidate/dossier/photo', [
            'photo' => $photo,
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.profile.has_photo', true);

        $this->get('/api/candidate/dossier/photo')->assertOk();
    }

    public function test_photo_upload_rejects_missing_file(): void
    {
        $this->actingAsRole(RoleName::Candidat);

        $this->postJson('/api/candidate/dossier/photo', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_candidate_can_fill_civil_status_and_add_a_diploma(): void
    {
        Storage::fake('public');
        $this->actingAsRole(RoleName::Candidat);

        $this->putJson('/api/candidate/dossier', [
            'date_naissance' => '1996-01-20',
            'lieu_naissance' => 'Moundou',
            'nationalite' => 'Tchadienne',
            'situation_familiale' => 'celibataire',
            'sexe' => 'F',
            'adresse' => 'Quartier Guelendeng, Moundou',
            'langues' => [
                ['langue' => 'Français', 'niveau' => 'courant'],
                ['langue' => 'Arabe', 'niveau' => 'intermediaire'],
            ],
        ])->assertOk();

        $scan = UploadedFile::fake()->create('licence.pdf', 120, 'application/pdf');

        $this->post('/api/candidate/dossier/diplomas', [
            'type_diplome' => 'Licence',
            'etablissement' => 'Université de N\'Djamena',
            'annee' => 2021,
            'specialite' => 'Gestion',
            'file' => $scan,
        ], ['Accept' => 'application/json'])->assertCreated();

        $this->assertEquals(1, Diploma::count());
        $this->assertDatabaseHas('documents', ['type' => 'diplome']);
    }

    public function test_generated_document_types_cannot_be_uploaded(): void
    {
        Storage::fake('public');
        $this->actingAsRole(RoleName::Candidat);
        $file = UploadedFile::fake()->create('cv.pdf', 80, 'application/pdf');

        $this->post('/api/documents/upload', [
            'type' => 'CV',
            'file' => $file,
        ], ['Accept' => 'application/json'])->assertStatus(422);
    }
}
