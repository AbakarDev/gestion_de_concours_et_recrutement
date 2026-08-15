<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Convocation;
use Illuminate\Http\JsonResponse;

class ConvocationController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/convocations/verify/{token}",
     *     tags={"Convocations"},
     *     summary="Vérifier l'authenticité d'une convocation",
     *     description="Endpoint public pour scanner le QR Code",
     *     @OA\Parameter(name="token", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Convocation valide")
     * )
     */
    public function verify(string $token): JsonResponse
    {
        $convocation = Convocation::with(['application.user', 'application.jobOffer.competition'])
            ->where('qr_code', $token)
            ->first();

        if (!$convocation) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Convocation invalide ou falsifiée.',
                'is_valid' => false
            ], 404);
        }

        return response()->json([
            'status' => 'Success',
            'message' => 'Convocation authentique.',
            'is_valid' => true,
            'data' => [
                'candidate_name' => $convocation->application->user->first_name . ' ' . $convocation->application->user->last_name,
                'application_number' => $convocation->application->application_number,
                'competition' => $convocation->application->jobOffer->competition->title,
                'job_offer' => $convocation->application->jobOffer->title,
                'exam_date' => $convocation->exam_date,
            ]
        ]);
    }
}
