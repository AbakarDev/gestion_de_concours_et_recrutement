<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Competition;
use App\Models\JobOffer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function competitions(Request $request)
    {
        $rows = Competition::with('department')->orderByDesc('created_at')->get()->map(fn (Competition $c) => [
            $c->reference,
            $c->title,
            $c->department?->name,
            $c->quota,
            $c->start_date?->format('d/m/Y'),
            $c->end_date?->format('d/m/Y'),
            $c->status?->label(),
        ])->all();

        return $this->download($request, 'concours', [
            'Référence', 'Titre', 'Ministère', 'Quota', 'Début', 'Fin', 'Statut',
        ], $rows, 'Liste des concours');
    }

    public function jobOffers(Request $request)
    {
        $rows = JobOffer::with('competition')->orderByDesc('created_at')->get()->map(fn (JobOffer $o) => [
            $o->title,
            $o->competition?->title,
            $o->location,
            $o->positions_count,
            $o->fee_required ? number_format((float) $o->fee_amount, 0, ',', ' ').' FCFA' : 'Gratuit',
            $o->status?->label(),
        ])->all();

        return $this->download($request, 'offres', [
            'Poste', 'Concours', 'Localisation', 'Places', 'Frais', 'Statut',
        ], $rows, 'Liste des postes / offres');
    }

    public function applications(Request $request)
    {
        $query = Application::with(['user', 'jobOffer.competition', 'scores'])->orderByDesc('submitted_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('application_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('nin', 'like', "%{$search}%");
                    });
            });
        }

        $rows = $query->get()->map(function (Application $app) {
            $avg = $app->scores->count() > 0 ? number_format((float) $app->scores->avg('note'), 2, ',', ' ') : '-';

            return [
                $app->application_number,
                $app->anonymat_number,
                trim(($app->user?->last_name ?? '').' '.($app->user?->first_name ?? '')),
                $app->user?->nin,
                $app->jobOffer?->title,
                $app->status->label(),
                $avg,
                $app->submitted_at?->format('d/m/Y H:i'),
            ];
        })->all();

        return $this->download($request, 'candidatures', [
            'N° Dossier', 'N° Anonymat', 'Candidat', 'NNI', 'Poste', 'Statut', 'Moyenne', 'Soumis le',
        ], $rows, 'Liste des candidatures');
    }

    public function ranking(Request $request, int $jobOfferId)
    {
        $jobOffer = JobOffer::findOrFail($jobOfferId);
        $isJury = $request->user()?->isJuryOnly() ?? false;

        $applications = Application::with('scores')
            ->where('job_offer_id', $jobOfferId)
            ->whereIn('status', ['evaluated', 'accepted'])
            ->get();

        $ranked = $applications->map(function ($app) {
            $scores = $app->scores;
            $avg = $scores->count() > 0 ? round($scores->avg('note'), 2) : null;

            return [
                'anonymat_number' => $app->anonymat_number,
                'application_number' => $app->application_number,
                'average_score' => $avg,
                'scores_count' => $scores->count(),
                'status_label' => $app->status->label(),
            ];
        })->sortByDesc('average_score')->values();

        $headers = $isJury
            ? ['Rang', 'N° Anonymat', 'Moyenne /20', 'Épreuves', 'Statut']
            : ['Rang', 'N° Anonymat', 'N° Dossier', 'Moyenne /20', 'Épreuves', 'Statut'];

        $rows = $ranked->map(function ($item, $index) use ($isJury) {
            $row = [
                $index + 1,
                $item['anonymat_number'] ?? '—',
            ];
            if (! $isJury) {
                $row[] = $item['application_number'];
            }
            $row[] = $item['average_score'] !== null ? number_format((float) $item['average_score'], 2, ',', ' ') : '-';
            $row[] = $item['scores_count'];
            $row[] = $item['status_label'];

            return $row;
        })->all();

        $slug = 'classement_'.str($jobOffer->title)->slug('_');

        return $this->download($request, $slug, $headers, $rows, 'Classement — '.$jobOffer->title);
    }

    /**
     * @param  list<string>  $headers
     * @param  list<list<mixed>>  $rows
     */
    private function download(Request $request, string $basename, array $headers, array $rows, string $title)
    {
        $format = $request->input('format', 'csv');
        $stamp = now()->format('Y-m-d');

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('pdf.export-table', [
                'title' => $title,
                'headers' => $headers,
                'rows' => $rows,
                'generatedAt' => now()->format('d/m/Y H:i'),
                'generatedBy' => trim(($request->user()?->first_name ?? '').' '.($request->user()?->last_name ?? '')),
            ])->setPaper('a4', 'landscape');

            return $pdf->download("{$basename}_{$stamp}.pdf");
        }

        $filename = "{$basename}_{$stamp}.csv";

        return response()->streamDownload(function () use ($headers, $rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers, ';');
            foreach ($rows as $row) {
                fputcsv($out, $row, ';');
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
