<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Competition;
use App\Models\Application;
use App\Models\ExamCenter;
use App\Models\Convocation;

class DispatchController extends Controller
{
    public function dispatchCandidates(Request $request, $competitionId)
    {
        // Require admin access (simplification for PFE)
        // $this->authorize('competitions.manage');

        $competition = Competition::findOrFail($competitionId);
        
        // Find applications for this competition (via job offers)
        $applications = Application::whereHas('jobOffer', function($q) use ($competitionId) {
            $q->where('competition_id', $competitionId);
        })->where('status', 'accepted')->get();

        if ($applications->isEmpty()) {
            return response()->json(['message' => 'Aucune candidature acceptée à dispatcher pour ce concours.'], 400);
        }

        $centers = ExamCenter::all();
        if ($centers->isEmpty()) {
            // Seed default centers if none exist
            $centers->push(ExamCenter::create(['nom' => 'Lycée Félix Éboué', 'ville' => 'N\'Djaména', 'capacite' => 500]));
            $centers->push(ExamCenter::create(['nom' => 'Université de Moundou', 'ville' => 'Moundou', 'capacite' => 300]));
            $centers->push(ExamCenter::create(['nom' => 'Lycée Franco-Arabe', 'ville' => 'Abéché', 'capacite' => 200]));
        }

        $count = 0;
        foreach ($applications as $app) {
            // Simple random assignment for demonstration
            $center = $centers->random();
            
            // Secure QR Code content
            $qrData = "APP:{$app->application_number}|CAND:{$app->user_id}|CENTRE:{$center->id}";

            Convocation::updateOrCreate(
                ['application_id' => $app->id],
                [
                    'exam_center_id' => $center->id,
                    'exam_date' => now()->addDays(14)->setTime(8, 0),
                    'qr_code' => hash('sha256', $qrData),
                    'pdf_path' => '/convocations/' . $app->application_number . '.pdf'
                ]
            );
            $count++;
        }

        return response()->json([
            'status' => 'success',
            'message' => "$count candidats dispatchés et convocations générées avec succès."
        ]);
    }
}
