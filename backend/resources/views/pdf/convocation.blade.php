<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Convocation {{ $application->application_number }}</title>
    <style>
        body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 24px; }
        .flag-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .flag-table td { height: 8px; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #1B4F8A; padding-bottom: 12px; margin-bottom: 18px; }
        .kicker { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #C9A227; font-weight: bold; }
        .title { font-size: 20px; font-weight: bold; color: #0e2948; text-transform: uppercase; margin: 6px 0 4px; }
        .subtitle { font-size: 12px; color: #334155; }
        .motto { font-size: 10px; font-style: italic; color: #64748b; margin-top: 2px; }
        .anonymat { background: #f1f5f9; border: 1px solid #1B4F8A; padding: 10px; text-align: center; font-size: 16px; font-weight: bold; letter-spacing: 2px; margin: 16px 0; color: #0e2948; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .info-table th, .info-table td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .info-table th { width: 34%; color: #1B4F8A; font-size: 11px; text-transform: uppercase; }
        .notice { margin-top: 16px; font-size: 11px; line-height: 1.45; color: #334155; }
        .qr-section { text-align: center; margin-top: 22px; }
        .footer { margin-top: 28px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
</head>
<body>
    <table class="flag-table" cellpadding="0" cellspacing="0">
        <tr>
            <td style="width:33%; background:#0e2948;"></td>
            <td style="width:34%; background:#C9A227;"></td>
            <td style="width:33%; background:#c0392b;"></td>
        </tr>
    </table>

    @php
        $competition = $application->jobOffer->competition ?? null;
        $ministry = $competition?->ministry
            ?: ($competition?->department?->name ?? 'Organisation partenaire');
        $center = $convocation->examCenter;
        $centerLabel = $center
            ? trim(($center->nom ?? $center->name ?? '').($center->ville ? ' — '.$center->ville : ''))
            : 'Sera communiqué après affectation aux centres';
        $examDate = $convocation->exam_date
            ? \Carbon\Carbon::parse($convocation->exam_date)
            : null;
        $examDateLabel = $examDate
            ? ($examDate->format('H:i') === '00:00'
                ? $examDate->format('d/m/Y').' — 08h00'
                : $examDate->format('d/m/Y').' à '.$examDate->format('H\hi'))
            : 'Date communiquée ultérieurement';
    @endphp

    <div class="header">
        <div class="kicker">République du Tchad · Unité — Travail — Progrès</div>
        <div class="title">Convocation aux épreuves</div>
        <div class="subtitle">{{ $ministry }}</div>
        <div class="motto">Portail Concours et Recrutements Tchad</div>
    </div>

    <p>Le candidat désigné ci-dessous est convoqué pour participer aux épreuves du concours :</p>
    <p><strong>{{ $competition?->title ?? 'Concours' }}</strong>
        @if(!empty($competition?->reference))
            <span> — Réf. {{ $competition->reference }}</span>
        @endif
    </p>

    <div class="anonymat">
        Numéro d'anonymat : {{ $application->anonymat_number ?? '—' }}
    </div>

    <table class="info-table">
        <tr>
            <th>N° de candidature</th>
            <td>{{ $application->application_number }}</td>
        </tr>
        <tr>
            <th>Nom et prénom(s)</th>
            <td>{{ strtoupper($application->user->last_name ?? '') }} {{ $application->user->first_name ?? '' }}</td>
        </tr>
        @if(!empty($application->user->nin))
        <tr>
            <th>NNI</th>
            <td>{{ $application->user->nin }}</td>
        </tr>
        @endif
        <tr>
            <th>Poste visé</th>
            <td>{{ $application->jobOffer->title }}</td>
        </tr>
        <tr>
            <th>Date et heure</th>
            <td>{{ $examDateLabel }}</td>
        </tr>
        <tr>
            <th>Centre d'examen</th>
            <td>{{ $centerLabel }}</td>
        </tr>
        <tr>
            <th>Salle</th>
            <td>{{ $convocation->salle ?? 'Affichage sur place le jour de l\'épreuve' }}</td>
        </tr>
    </table>

    <div class="notice">
        <strong>Consignes :</strong> présentez-vous 30 minutes avant l’heure indiquée, muni de cette convocation
        et d’une pièce d’identité originale en cours de validité. Tout document falsifié est passible de sanctions.
    </div>

    <div class="qr-section">
        <p><em>Contrôle d'authenticité (usage officiel) — scanner le QR code</em></p>
        <img src="data:image/svg+xml;base64,{{ $qrCode }}" alt="QR Code" width="140" height="140">
    </div>

    <div class="footer">
        Document généré électroniquement le {{ optional($convocation->generated_at)->format('d/m/Y à H:i') }}
        — Portail Concours et Recrutements Tchad · République du Tchad
    </div>
</body>
</html>
