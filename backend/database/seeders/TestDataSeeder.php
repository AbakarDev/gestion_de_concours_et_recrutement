<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Competition;
use App\Models\JobOffer;
use App\Models\Department;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Départements du Tchad (Ministères connus)
        $ministries = [
            ['name' => 'Ministère de la Fonction Publique et de la Concertation Sociale', 'code' => 'MFPCS'],
            ['name' => 'Ministère de l\'Éducation Nationale et de la Promotion Civique', 'code' => 'MENPC'],
            ['name' => 'Ministère de la Santé Publique et de la Prévention', 'code' => 'MSPP'],
            ['name' => 'Ministère des Finances, du Budget et des Comptes Publics', 'code' => 'MFBCP'],
            ['name' => 'Ministère de la Sécurité Publique et de l\'Immigration', 'code' => 'MSPI'],
        ];

        foreach ($ministries as $min) {
            Department::firstOrCreate(['code' => $min['code']], ['name' => $min['name']]);
        }

        $mfpcs = Department::where('code', 'MFPCS')->first();
        $mspp = Department::where('code', 'MSPP')->first();

        // 2. Création d'un concours publié (Fonction Publique)
        $competition1 = Competition::firstOrCreate(['title' => 'Concours d\'Intégration à la Fonction Publique 2026'], [
            'department_id' => $mfpcs->id,
            'reference' => 'MFPCS/2026/01',
            'description' => 'Recrutement massif pour le renforcement des capacités de l\'administration publique tchadienne.',
            'start_date' => Carbon::now()->subDays(5),
            'end_date' => Carbon::now()->addDays(25),
            'status' => 'published'
        ]);

        $competition2 = Competition::firstOrCreate(['title' => 'Recrutement Spécial - Santé Publique 2026'], [
            'department_id' => $mspp->id,
            'reference' => 'MSPP/2026/01',
            'description' => 'Recrutement de personnel médical pour les hôpitaux provinciaux.',
            'start_date' => Carbon::now()->subDays(2),
            'end_date' => Carbon::now()->addDays(30),
            'status' => 'published'
        ]);

        // 3. Offres d'emploi (Postes connus)
        $offers = [
            [
                'competition_id' => $competition1->id, 
                'title' => 'Administrateur Civil', 
                'requirements' => json_encode(['Description' => 'Poste d\'encadrement au sein des ministères.', 'Niveau' => 'Bac+5']),
                'location' => 'N\'Djaména',
                'positions_count' => 150
            ],
            [
                'competition_id' => $competition1->id, 
                'title' => 'Inspecteur des Douanes', 
                'requirements' => json_encode(['Description' => 'Contrôle et surveillance douanière.', 'Niveau' => 'Bac+3']),
                'location' => 'Moundou / N\'Djaména',
                'positions_count' => 50
            ],
            [
                'competition_id' => $competition1->id, 
                'title' => 'Enseignant de Lycée', 
                'requirements' => json_encode(['Description' => 'Enseignement secondaire général.', 'Niveau' => 'Licence/Master']),
                'location' => 'Abéché / Sarh / Moundou',
                'positions_count' => 300
            ],
            [
                'competition_id' => $competition2->id, 
                'title' => 'Médecin Généraliste', 
                'requirements' => json_encode(['Description' => 'Affectation dans les hôpitaux de district.', 'Diplôme' => 'Doctorat en Médecine']),
                'location' => 'Provinces du Tchad',
                'positions_count' => 100
            ],
            [
                'competition_id' => $competition2->id, 
                'title' => 'Infirmier Diplômé d\'État (IDE)', 
                'requirements' => json_encode(['Description' => 'Soins infirmiers en centre de santé.', 'Diplôme' => 'IDE']),
                'location' => 'Faya / Mao / Mongo',
                'positions_count' => 250
            ],
        ];

        foreach ($offers as $offer) {
            JobOffer::firstOrCreate(
                ['competition_id' => $offer['competition_id'], 'title' => $offer['title']],
                [
                    'requirements'   => $offer['requirements'],
                    'location'       => $offer['location'],
                    'positions_count'=> $offer['positions_count'],
                    'status'         => 'published',
                ]
            );
        }

        // Publier les offres existantes qui seraient encore en draft
        JobOffer::where('status', 'draft')->update(['status' => 'published']);

        $this->command->info('[OK] Données réelles du Tchad générées avec succès !');
    }
}
