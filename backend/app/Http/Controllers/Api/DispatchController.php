<?php

namespace App\Http\Controllers\Api;

use App\Actions\GenerateConvocationAction;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Competition;
use App\Models\ExamCenter;
use Illuminate\Http\JsonResponse;

class DispatchController extends Controller
{
    public function __construct(private GenerateConvocationAction $generateConvocation) {}

    public function dispatchCandidates(int $competitionId): JsonResponse
    {
        $competition = Competition::findOrFail($competitionId);

        $applications = Application::with(['jobOffer.competition.department', 'user', 'convocation'])
            ->whereHas('jobOffer', fn ($q) => $q->where('competition_id', $competitionId))
            ->where('status', 'accepted')
            ->get();

        if ($applications->isEmpty()) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Aucune candidature acceptée à dispatcher pour ce concours.',
            ], 400);
        }

        $centers = ExamCenter::all();
        if ($centers->isEmpty()) {
            $centers = collect([
                ExamCenter::create(['nom' => 'Lycée Félix Éboué', 'ville' => "N'Djaména", 'capacite' => 500]),
                ExamCenter::create(['nom' => 'Université de Moundou', 'ville' => 'Moundou', 'capacite' => 300]),
                ExamCenter::create(['nom' => 'Lycée Franco-Arabe', 'ville' => 'Abéché', 'capacite' => 200]),
            ]);
        }

        $examDate = $competition->start_date && $competition->start_date->copy()->setTime(8, 0)->isFuture()
            ? $competition->start_date->copy()->setTime(8, 0)
            : now()->addDays(14)->setTime(8, 0);

        $count = 0;
        foreach ($applications as $index => $app) {
            $center = $centers[$index % $centers->count()];
            $salle = 'Salle '.chr(65 + ($index % 6));

            $this->generateConvocation->execute($app, [
                'exam_center_id' => $center->id,
                'salle' => $salle,
                'exam_date' => $examDate,
            ]);
            $count++;
        }

        return response()->json([
            'status' => 'Success',
            'message' => "$count candidat(s) affecté(s) et convocations régénérées.",
        ]);
    }
}
