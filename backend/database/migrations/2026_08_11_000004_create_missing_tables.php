<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Expériences professionnelles ─────────────────────────────
        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained()->cascadeOnDelete();
            $table->string('poste');
            $table->string('employeur');
            $table->date('date_debut');
            $table->date('date_fin')->nullable()->comment('NULL = emploi actuel');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // ── Amélioration du module paiement ──────────────────────────
        Schema::table('payments', function (Blueprint $table) {
            // Webhook payload signé
            $table->json('webhook_payload')->nullable()->after('status');
            $table->timestamp('confirmed_at')->nullable()->after('webhook_payload');
            $table->string('failure_reason')->nullable()->after('confirmed_at');
            $table->unsignedTinyInteger('retry_count')->default(0)->after('failure_reason');
            $table->string('receipt_path')->nullable()->after('retry_count');
            // Type de paiement
            $table->enum('payment_type', ['competition_fee', 'job_offer_fee'])->default('competition_fee')->after('provider');
        });

        // ── Présélection recrutement direct ───────────────────────────
        Schema::create('prescreenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recruiter_id')->constrained('users')->cascadeOnDelete();
            $table->enum('decision', ['pending', 'retained', 'rejected'])->default('pending');
            $table->text('comment')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();

            $table->unique('application_id');
        });

        // ── Journal d'audit métier ─────────────────────────────────────
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 100)->comment('ex: application.status_changed, competition.published');
            $table->string('resource_type', 100)->comment('ex: Application, Competition');
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index(['resource_type', 'resource_id']);
            $table->index(['user_id', 'created_at']);
            $table->index('action');
        });

        // ── Notifications in-app ─────────────────────────────────────
        // Laravel utilise la table `notifications` native, on la crée proprement
        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('type');
                $table->morphs('notifiable');
                $table->text('data');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('experiences');
        Schema::dropIfExists('prescreenings');
        Schema::dropIfExists('audit_logs');

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'webhook_payload', 'confirmed_at', 'failure_reason',
                'retry_count', 'receipt_path', 'payment_type',
            ]);
        });
    }
};
