<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * L'enum Postgres d'origine n'incluait pas « evaluated ».
 * RecordScoreAction ne pouvait donc pas passer le statut après notation,
 * et le classement restait vide.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
        DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK ((status)::text = ANY (ARRAY[
            'submitted'::text,
            'under_review'::text,
            'accepted'::text,
            'rejected'::text,
            'evaluated'::text
        ]))");
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
        DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK ((status)::text = ANY (ARRAY[
            'submitted'::text,
            'under_review'::text,
            'accepted'::text,
            'rejected'::text
        ]))");
    }
};
