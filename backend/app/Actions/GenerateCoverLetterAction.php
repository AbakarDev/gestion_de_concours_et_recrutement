<?php

namespace App\Actions;

use App\Models\Application;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class GenerateCoverLetterAction extends BaseAction
{
    /**
     * Lettre de candidature au format administratif (destinataire ministériel, objet, formule de politesse).
     */
    public function execute(Application $application): string
    {
        $application->loadMissing(['user.candidate', 'jobOffer.competition.department']);

        $pdf = Pdf::loadView('pdf.lettre-candidature', [
            'application' => $application,
        ])->setPaper('a4');

        $filename = 'dossiers/'.$application->application_number.'/lettre_candidature.pdf';
        Storage::disk('public')->put($filename, $pdf->output());

        return $filename;
    }
}
