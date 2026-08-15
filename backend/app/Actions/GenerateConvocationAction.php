<?php

namespace App\Actions;

use App\Models\Application;
use App\Models\Convocation;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

use App\Models\AuditLog;
use Illuminate\Support\Facades\URL;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Barryvdh\DomPDF\Facade\Pdf;

class GenerateConvocationAction extends BaseAction
{
    public function execute(Application $application): Convocation
    {
        $application->loadMissing(['jobOffer.competition', 'user']);

        // On génère un jeton unique signé pour vérifier l'authenticité
        $token = hash_hmac('sha256', $application->id . '|' . $application->application_number . '|' . now()->timestamp, config('app.key'));

        $pdfPath = 'convocations/' . $application->application_number . '_' . time() . '.pdf';

        // Créer/mettre à jour l'entrée dans la BDD
        $convocation = Convocation::updateOrCreate(
            ['application_id' => $application->id],
            [
                'qr_code' => $token,
                'pdf_path' => $pdfPath,
                'exam_center_id' => null, // À renseigner par le dispatch
                'salle' => null, // À renseigner par le dispatch
                'exam_date' => $application->jobOffer->competition->start_date ?? now(),
                'generated_at' => now(),
            ]
        );
        $convocation->increment('generation_count');

        // Génération du QR Code contenant l'URL de vérification
        // L'URL de vérification doit être absolue (ex: https://domaine.com/api/v1/convocations/verify/TOKEN)
        $verifyUrl = URL::to('/api/convocations/verify/' . $token);
        
        $qrCode = base64_encode(QrCode::format('svg')->size(150)->generate($verifyUrl));
        
        $pdf = Pdf::loadView('pdf.convocation', [
            'application' => $application,
            'convocation' => $convocation,
            'qrCode' => $qrCode,
            'verifyUrl' => $verifyUrl
        ]);

        Storage::disk('public')->put($pdfPath, $pdf->output());

        AuditLog::record('convocation.generated', $convocation);

        return $convocation;
    }
}
