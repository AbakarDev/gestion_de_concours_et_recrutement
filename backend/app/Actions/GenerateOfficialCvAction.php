<?php

namespace App\Actions;

use App\Models\Application;
use App\Models\Candidate;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class GenerateOfficialCvAction extends BaseAction
{
    /**
     * Produit le CV administratif unique (même gabarit pour tous les candidats).
     */
    public function execute(User $user, ?Application $application = null): string
    {
        $candidate = $user->candidate()->with(['diplomas', 'experiences', 'user'])->firstOrFail();
        $user->loadMissing('candidate');

        $pdf = Pdf::loadView('pdf.cv-administratif', [
            'user' => $user,
            'candidate' => $candidate,
            'application' => $application,
            'photoDataUri' => $this->photoDataUri($candidate),
        ])->setPaper('a4');

        $filename = $application
            ? 'dossiers/'.$application->application_number.'/cv_administratif.pdf'
            : 'candidates/'.$candidate->id.'/cv_administratif.pdf';

        Storage::disk('public')->put($filename, $pdf->output());

        return $filename;
    }

    private function photoDataUri(Candidate $candidate): ?string
    {
        if (! $candidate->photo_path || ! Storage::disk('public')->exists($candidate->photo_path)) {
            return null;
        }

        $binary = Storage::disk('public')->get($candidate->photo_path);
        $mime = Storage::disk('public')->mimeType($candidate->photo_path) ?: 'image/jpeg';

        return 'data:'.$mime.';base64,'.base64_encode($binary);
    }
}
