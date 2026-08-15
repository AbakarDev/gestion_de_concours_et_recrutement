<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Numéro d'anonymat + champ motif de rejet structuré
        Schema::table('applications', function (Blueprint $table) {
            $table->string('anonymat_number')->nullable()->unique()->after('application_number')
                ->comment('Numéro d\'anonymat visible par le jury — sans lien avec l\'identité');
            $table->text('rejection_reason')->nullable()->after('admin_notes')
                ->comment('Motif obligatoire de rejet, consultable par le candidat');
        });

        // Jury id + verrouillage sur les scores
        Schema::table('scores', function (Blueprint $table) {
            $table->foreignId('jury_id')->nullable()->after('application_id')
                ->constrained('users')->nullOnDelete()
                ->comment('Membre du jury ayant saisi la note');
            $table->text('commentaire')->nullable()->change(); // s'assure que le commentaire existe
            $table->timestamp('locked_at')->nullable()->after('commentaire')
                ->comment('NULL = modifiable ; non-NULL = verrouillé après publication');
        });

        // Verrouillage sur les résultats
        Schema::table('results', function (Blueprint $table) {
            $table->timestamp('locked_at')->nullable()->after('decision')
                ->comment('Verrouillé définitivement après publication officielle');
            $table->boolean('is_admitted')->default(false)->after('decision');
        });

        // Convocation : numéro d'anonymat et salle
        Schema::table('convocations', function (Blueprint $table) {
            $table->string('salle')->nullable()->after('exam_center_id');
            $table->timestamp('generated_at')->nullable();
            $table->unsignedInteger('generation_count')->default(1)
                ->comment('Nombre de fois où la convocation a été (re)générée');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['anonymat_number', 'rejection_reason']);
        });

        Schema::table('scores', function (Blueprint $table) {
            $table->dropForeign(['jury_id']);
            $table->dropColumn(['jury_id', 'locked_at']);
        });

        Schema::table('results', function (Blueprint $table) {
            $table->dropColumn(['locked_at', 'is_admitted']);
        });

        Schema::table('convocations', function (Blueprint $table) {
            $table->dropColumn(['salle', 'generated_at', 'generation_count']);
        });
    }
};
