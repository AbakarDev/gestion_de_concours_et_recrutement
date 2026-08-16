<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * L'état civil se complète dans le formulaire ; SQLite refusait encore NULL
     * sur date_naissance / sexe / adresse (contraintes héritées de la table d'origine).
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE candidates ALTER COLUMN date_naissance DROP NOT NULL');
            DB::statement('ALTER TABLE candidates ALTER COLUMN sexe DROP NOT NULL');
            DB::statement('ALTER TABLE candidates ALTER COLUMN adresse DROP NOT NULL');

            return;
        }

        if ($driver !== 'sqlite') {
            Schema::table('candidates', function (Blueprint $table) {
                $table->date('date_naissance')->nullable()->change();
                $table->string('sexe')->nullable()->change();
                $table->text('adresse')->nullable()->change();
            });

            return;
        }

        Schema::disableForeignKeyConstraints();

        $rows = DB::table('candidates')->get()->map(fn ($row) => (array) $row)->all();

        Schema::drop('candidates');

        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date_naissance')->nullable();
            $table->string('lieu_naissance')->nullable();
            $table->string('nationalite')->nullable();
            $table->string('situation_familiale', 30)->nullable();
            $table->string('sexe', 10)->nullable();
            $table->text('adresse')->nullable();
            $table->string('nni')->unique()->nullable();
            $table->string('photo_path')->nullable();
            $table->json('langues')->nullable();
            $table->timestamps();
        });

        foreach ($rows as $row) {
            DB::table('candidates')->insert($row);
        }

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Irreversible on SQLite without inventing fake civil-status values.
    }
};
