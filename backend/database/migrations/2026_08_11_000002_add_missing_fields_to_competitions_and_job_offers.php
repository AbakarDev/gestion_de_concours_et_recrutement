<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // Fenêtre de candidature distincte de la fenêtre d'épreuves
            $table->date('registration_open_date')->nullable()->after('start_date')
                ->comment('Date d\'ouverture des candidatures');
            $table->date('registration_close_date')->nullable()->after('registration_open_date')
                ->comment('Date de clôture des candidatures');

            // Frais de concours
            $table->boolean('fee_required')->default(false)->after('registration_close_date');
            $table->decimal('fee_amount', 10, 2)->nullable()->after('fee_required');

            // Ministère organisateur
            $table->string('ministry')->nullable()->after('department_id');

            // Verrouillage résultats
            $table->timestamp('results_published_at')->nullable()->after('published_at');
            $table->timestamp('results_locked_at')->nullable()->after('results_published_at');

            // Status archived n'était pas dans l'enum original sur PostgreSQL
            // On change la colonne status en string pour plus de flexibilité
        });

        Schema::table('job_offers', function (Blueprint $table) {
            // Frais pour recrutement direct
            $table->boolean('fee_required')->default(false)->after('status');
            $table->decimal('fee_amount', 10, 2)->nullable()->after('fee_required');

            // Description détaillée
            $table->text('description')->nullable()->after('title');

            // Date de clôture spécifique à l'offre
            $table->date('closing_date')->nullable()->after('fee_amount');

            // Verrouillage décision finale
            $table->timestamp('decision_locked_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            $table->dropColumn([
                'registration_open_date', 'registration_close_date',
                'fee_required', 'fee_amount', 'ministry',
                'results_published_at', 'results_locked_at',
            ]);
        });

        Schema::table('job_offers', function (Blueprint $table) {
            $table->dropColumn([
                'fee_required', 'fee_amount', 'description',
                'closing_date', 'decision_locked_at',
            ]);
        });
    }
};
