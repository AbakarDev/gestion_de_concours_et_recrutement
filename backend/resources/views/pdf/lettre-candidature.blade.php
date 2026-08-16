<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Lettre de candidature — {{ $application->application_number }}</title>
    <style>
        body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 28px 36px; line-height: 1.5; }
        .flag-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .flag-table td { height: 7px; padding: 0; }
        .kicker { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #C9A227; font-weight: bold; text-align: center; }
        .brand { text-align: center; font-size: 11px; color: #0e2948; margin: 4px 0 16px; }
        .meta { width: 100%; margin-bottom: 18px; }
        .right { text-align: right; }
        .objet { margin: 16px 0; }
        .body { text-align: justify; white-space: pre-wrap; }
        .politesse { margin-top: 18px; }
        .footer { margin-top: 36px; text-align: center; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    </style>
</head>
<body>
    @php
        $user = $application->user;
        $candidate = $user->candidate ?? null;
        $competition = $application->jobOffer->competition ?? null;
        $ministry = $competition?->ministry
            ?: ($competition?->department?->name ?? 'Ministère de la Fonction Publique');
        $city = $candidate?->adresse ? \Illuminate\Support\Str::limit($candidate->adresse, 40, '') : 'N\'Djamena';
    @endphp

    <table class="flag-table" cellpadding="0" cellspacing="0">
        <tr>
            <td style="width:33%; background:#0e2948;"></td>
            <td style="width:34%; background:#C9A227;"></td>
            <td style="width:33%; background:#c0392b;"></td>
        </tr>
    </table>
    <div class="kicker">République du Tchad · Unité — Travail — Progrès</div>
    <div class="brand">{{ $ministry }}</div>

    <table class="meta">
        <tr>
            <td>
                {{ strtoupper($user->last_name ?? '') }} {{ $user->first_name ?? '' }}<br>
                @if($candidate?->adresse){{ $candidate->adresse }}<br>@endif
                @if($user->phone)Tél. {{ $user->phone }}<br>@endif
                {{ $user->email }}
            </td>
            <td class="right">
                {{ $city }}, le {{ now()->translatedFormat('d F Y') }}
            </td>
        </tr>
    </table>

    <p>
        <strong>{{ $ministry }}</strong><br>
        Direction des concours et du recrutement<br>
        N'Djamena
    </p>

    <p class="objet">
        <strong>Objet :</strong>
        {{ $application->motivation_objet ?: ('Candidature — '.$application->jobOffer->title.($competition?->reference ? ' ('.$competition->reference.')' : '')) }}
    </p>

    <p>Monsieur le Ministre, Madame, Monsieur,</p>

    <div class="body">{{ trim($application->motivation_corps ?? '') }}</div>

    <p class="politesse">
        Veuillez agréer, Monsieur le Ministre, Madame, Monsieur, l'expression de ma haute considération.
    </p>

    <p class="right" style="margin-top:28px;">
        {{ strtoupper($user->last_name ?? '') }} {{ $user->first_name ?? '' }}<br>
        <span style="font-size:10px;color:#64748b;">Dossier n° {{ $application->application_number }}</span>
    </p>

    <div class="footer">
        Lettre générée par la plateforme E-Concours Tchad le {{ now()->format('d/m/Y à H:i') }} — usage officiel.
    </div>
</body>
</html>
