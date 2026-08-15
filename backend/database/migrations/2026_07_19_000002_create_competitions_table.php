<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('reference')->unique();
            $table->text('description')->nullable();
            $table->integer('quota')->default(0)->comment('Nombre de places disponibles');
            $table->json('required_documents')->nullable()->comment('Liste des documents obligatoires');
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamp('published_at')->nullable();
            $table->enum('status', ['draft', 'published', 'open', 'evaluating', 'closed'])->default('draft');
            $table->timestamps();

            $table->index('status');
            $table->index(['start_date', 'end_date']);
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competitions');
    }
};
