<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            if (! Schema::hasColumn('candidates', 'lieu_naissance')) {
                $table->string('lieu_naissance')->nullable()->after('date_naissance');
            }
            if (! Schema::hasColumn('candidates', 'nationalite')) {
                $table->string('nationalite')->nullable()->after('lieu_naissance');
            }
            if (! Schema::hasColumn('candidates', 'situation_familiale')) {
                $table->string('situation_familiale', 30)->nullable()->after('nationalite');
            }
            if (! Schema::hasColumn('candidates', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('nni');
            }
            if (! Schema::hasColumn('candidates', 'langues')) {
                $table->json('langues')->nullable()->after('photo_path');
            }
        });

        Schema::table('diplomas', function (Blueprint $table) {
            if (! Schema::hasColumn('diplomas', 'type_diplome')) {
                $table->string('type_diplome')->nullable();
            }
            if (! Schema::hasColumn('diplomas', 'specialite')) {
                $table->string('specialite')->nullable();
            }
            if (! Schema::hasColumn('diplomas', 'document_id')) {
                $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            }
        });

        Schema::table('applications', function (Blueprint $table) {
            if (! Schema::hasColumn('applications', 'motivation_objet')) {
                $table->string('motivation_objet')->nullable();
            }
            if (! Schema::hasColumn('applications', 'motivation_corps')) {
                $table->text('motivation_corps')->nullable();
            }
            if (! Schema::hasColumn('applications', 'cv_pdf_path')) {
                $table->string('cv_pdf_path')->nullable();
            }
            if (! Schema::hasColumn('applications', 'letter_pdf_path')) {
                $table->string('letter_pdf_path')->nullable();
            }
            if (! Schema::hasColumn('applications', 'dossier_frozen_at')) {
                $table->timestamp('dossier_frozen_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'motivation_objet',
                'motivation_corps',
                'cv_pdf_path',
                'letter_pdf_path',
                'dossier_frozen_at',
            ]);
        });

        Schema::table('diplomas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('document_id');
            $table->dropColumn(['type_diplome', 'specialite']);
        });

        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn([
                'lieu_naissance',
                'nationalite',
                'situation_familiale',
                'photo_path',
                'langues',
            ]);
        });
    }
};
