<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scores', function (Blueprint $table) {
            $table->string('integrity_hash', 64)->nullable()->after('locked_at')
                ->comment('HMAC-SHA256 (application|épreuve|note|jury|horodatage)');
            $table->timestamp('hashed_at')->nullable()->after('integrity_hash');
        });
    }

    public function down(): void
    {
        Schema::table('scores', function (Blueprint $table) {
            $table->dropColumn(['integrity_hash', 'hashed_at']);
        });
    }
};
