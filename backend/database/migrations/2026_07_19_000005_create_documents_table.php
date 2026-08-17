<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            // FK ajoutée après create_candidates (Postgres refuse une FK vers une table absente).
            $table->unsignedBigInteger('candidate_id')->nullable();
            $table->foreignId('application_id')->nullable()->constrained('applications')->cascadeOnDelete();
            $table->string('type');
            $table->string('path');
            $table->string('status')->default('en attente');
            $table->timestamps();
            $table->index('candidate_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
