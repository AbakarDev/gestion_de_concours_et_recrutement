<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobOffer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RankingController extends Controller
{
    /**
     * Retourne le classement anonymisé des candidats évalués pour un poste.
     * Accessible uniquement aux Admins et Jury.
     */
    public function rankingByJobOffer(Request $request, int $jobOfferId): JsonResponse
    {
        $jobOffer = JobOffer::find($jobOfferId);
        if (!$jobOffer) {
            return response()->json(['message' => 'Offre d\'emploi introuvable.'], 404);
        }

        $isJury = $request->user()?->isJuryOnly() ?? false;

        $applications = Application::with('scores')
            ->where('job_offer_id', $jobOfferId)
            ->where(function ($q) {
                $q->whereIn('status', ['evaluated', 'accepted'])
                    ->orWhereHas('scores');
            })
            ->get();

        $ranked = $applications->map(function ($app) use ($isJury) {
            $scores = $app->scores;
            $avg = $scores->count() > 0
                ? round($scores->avg('note'), 2)
                : null;

            $row = [
                'anonymat_number'    => $app->anonymat_number,
                'average_score'      => $avg,
                'scores_count'       => $scores->count(),
                'status'             => $app->status->value,
                'status_label'       => $app->status->label(),
            ];

            if (! $isJury) {
                $row['application_number'] = $app->application_number;
            }

            return $row;
        })
        // Notes d'abord (desc), sans note en fin de liste
        ->sort(function ($a, $b) {
            return ($b['average_score'] ?? -1) <=> ($a['average_score'] ?? -1);
        })
        ->values();

        // Add rank number
        $ranked = $ranked->map(function ($item, $index) {
            return array_merge(['rank' => $index + 1], $item);
        });

        return response()->json([
            'status'    => 'success',
            'job_offer' => ['id' => $jobOffer->id, 'title' => $jobOffer->title],
            'total'     => $ranked->count(),
            'data'      => $ranked,
        ]);
    }

    /**
     * Statistiques globales du système pour le dashboard admin.
     */
    public function dashboardStats(): JsonResponse
    {
        $stats = [
            'total_applications'    => Application::count(),
            'submitted'             => Application::where('status', 'submitted')->count(),
            'under_review'          => Application::where('status', 'under_review')->count(),
            'accepted'              => Application::where('status', 'accepted')->count(),
            'rejected'              => Application::where('status', 'rejected')->count(),
            'evaluated'             => Application::where('status', 'evaluated')->count(),
            'total_users'           => \App\Models\User::count(),
            'total_competitions'    => \App\Models\Competition::count(),
            'total_job_offers'      => \App\Models\JobOffer::count(),
        ];

        return response()->json(['status' => 'success', 'data' => $stats]);
    }
}
