<?php

namespace App\Actions;

use App\Models\Application;
use App\Models\AuditLog;
use App\Models\Convocation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class GenerateConvocationAction extends BaseAction
{
    /**
     * @param  array{exam_center_id?: int|null, salle?: string|null, exam_date?: \DateTimeInterface|null}  $assignment
     */
    public function execute(Application $application, array $assignment = []): Convocation
    {
        $application->loadMissing(['jobOffer.competition.department', 'user']);

        $existing = Convocation::where('application_id', $application->id)->first();

        $token = $existing?->qr_code
            ?? hash_hmac('sha256', $application->id.'|'.$application->application_number.'|'.now()->timestamp, config('app.key'));

        $pdfPath = 'convocations/'.$application->application_number.'_'.time().'.pdf';

        $examDate = $assignment['exam_date']
            ?? $existing?->exam_date
            ?? $this->defaultExamDate($application);

        $convocation = Convocation::updateOrCreate(
            ['application_id' => $application->id],
            [
                'qr_code' => $token,
                'pdf_path' => $pdfPath,
                'exam_center_id' => $assignment['exam_center_id'] ?? $existing?->exam_center_id,
                'salle' => $assignment['salle'] ?? $existing?->salle,
                'exam_date' => $examDate,
                'generated_at' => now(),
                'generation_count' => ($existing?->generation_count ?? 0) + 1,
            ]
        );
        $convocation->load('examCenter');

        $verifyUrl = URL::to('/api/convocations/verify/'.$token);
        $qrCode = base64_encode(QrCode::format('svg')->size(140)->generate($verifyUrl));

        $pdf = Pdf::loadView('pdf.convocation', [
            'application' => $application,
            'convocation' => $convocation,
            'qrCode' => $qrCode,
            'verifyUrl' => $verifyUrl,
        ]);

        Storage::disk('public')->put($pdfPath, $pdf->output());

        if ($existing?->pdf_path && $existing->pdf_path !== $pdfPath) {
            Storage::disk('public')->delete($existing->pdf_path);
        }

        AuditLog::record('convocation.generated', $convocation);

        return $convocation->fresh('examCenter');
    }

    private function defaultExamDate(Application $application): \DateTimeInterface
    {
        $start = $application->jobOffer?->competition?->start_date;
        if ($start) {
            $atEight = $start->copy()->setTime(8, 0);
            if ($atEight->isFuture()) {
                return $atEight;
            }
        }

        return now()->addDays(14)->setTime(8, 0);
    }
}
