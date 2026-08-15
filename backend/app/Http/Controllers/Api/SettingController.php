<?php

namespace App\Http\Controllers\Api;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Department;
use App\Models\JobOffer;
use App\Models\User;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function __construct(private SettingService $settings) {}

    public function publicIndex(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->settings->public(),
        ]);
    }

    public function publicStats(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'active_competitions' => Competition::query()
                    ->whereIn('status', ['published', 'open'])
                    ->count(),
                'total_candidates' => User::query()
                    ->whereHas('roles', fn ($q) => $q->where('name', RoleName::Candidat->value))
                    ->count(),
                'departments_count' => Department::query()->count(),
                'total_jobs' => (int) JobOffer::query()
                    ->whereIn('status', ['published', 'open'])
                    ->sum('positions_count'),
            ],
        ]);
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->settings->all(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform_name' => ['sometimes', 'string', 'max:120'],
            'platform_subtitle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contact_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'support_message' => ['sometimes', 'nullable', 'string', 'max:500'],
            'registration_enabled' => ['sometimes', 'boolean'],
            'payment_mock_enabled' => ['sometimes', 'boolean'],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Paramètres enregistrés.',
            'data' => $this->settings->update($validated),
        ]);
    }
}
