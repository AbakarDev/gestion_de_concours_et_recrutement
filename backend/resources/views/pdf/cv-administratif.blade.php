<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>CV administratif — {{ $user->last_name }} {{ $user->first_name }}</title>
    <style>
        body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 22px; }
        .flag-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .flag-table td { height: 7px; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #1B4F8A; padding-bottom: 10px; margin-bottom: 14px; }
        .kicker { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #C9A227; font-weight: bold; }
        .title { font-size: 16px; font-weight: bold; color: #0e2948; text-transform: uppercase; margin: 4px 0; }
        .motto { font-size: 10px; font-style: italic; color: #64748b; }
        .identity { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .identity td { vertical-align: top; }
        .photo { width: 90px; height: 110px; border: 1px solid #1B4F8A; object-fit: cover; }
        .photo-ph { width: 90px; height: 110px; border: 1px dashed #94a3b8; text-align: center; font-size: 9px; color: #94a3b8; }
        h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1B4F8A; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 14px 0 8px; }
        table.grid { width: 100%; border-collapse: collapse; }
        table.grid th, table.grid td { text-align: left; padding: 5px 4px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        table.grid th { color: #1B4F8A; font-size: 10px; width: 32%; text-transform: uppercase; }
        .item { margin-bottom: 8px; }
        .item strong { color: #0e2948; }
        .muted { color: #64748b; font-size: 10px; }
        .footer { margin-top: 22px; text-align: center; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px; }
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

    <div class="header">
        <div class="kicker">République du Tchad · Unité — Travail — Progrès</div>
        <div class="title">Curriculum vitae administratif</div>
        <div class="motto">Portail Concours et Recrutements Tchad</div>
    </div>

    <table class="identity">
        <tr>
            <td style="width:110px;">
                @if($photoDataUri)
                    <img src="{{ $photoDataUri }}" class="photo" alt="Photo d'identité">
                @else
                    <div class="photo-ph">Photo</div>
                @endif
            </td>
            <td>
                <p style="font-size:16px; font-weight:bold; color:#0e2948; margin:0 0 8px;">
                    {{ strtoupper($user->last_name) }} {{ $user->first_name }}
                </p>
                <table class="grid">
                    <tr><th>NNI</th><td>{{ $user->nin ?: ($candidate->nni ?? '—') }}</td></tr>
                    <tr><th>Date / lieu de naissance</th>
                        <td>
                            {{ $candidate->date_naissance?->format('d/m/Y') ?? '—' }}
                            @if($candidate->lieu_naissance) à {{ $candidate->lieu_naissance }} @endif
                        </td>
                    </tr>
                    <tr><th>Nationalité</th><td>{{ $candidate->nationalite ?: 'Tchadienne' }}</td></tr>
                    <tr><th>Situation de famille</th>
                        <td>{{ match($candidate->situation_familiale) {
                            'celibataire' => 'Célibataire',
                            'marie' => 'Marié(e)',
                            'veuf' => 'Veuf / Veuve',
                            'divorce' => 'Divorcé(e)',
                            default => '—',
                        } }}</td>
                    </tr>
                    <tr><th>Sexe</th><td>{{ $candidate->sexe === 'F' ? 'Féminin' : ($candidate->sexe === 'M' ? 'Masculin' : '—') }}</td></tr>
                    <tr><th>Adresse</th><td>{{ $candidate->adresse ?: '—' }}</td></tr>
                    <tr><th>Téléphone</th><td>{{ $user->phone ?: '—' }}</td></tr>
                    <tr><th>Courriel</th><td>{{ $user->email }}</td></tr>
                </table>
            </td>
        </tr>
    </table>

    <h2>Cursus et diplômes</h2>
    @forelse($candidate->diplomas->sortByDesc('annee') as $diploma)
        <div class="item">
            <strong>{{ $diploma->type_diplome ?: $diploma->niveau }}</strong>
            @if($diploma->specialite) — {{ $diploma->specialite }} @endif
            <div class="muted">{{ $diploma->etablissement }} · {{ $diploma->annee }}</div>
        </div>
    @empty
        <p class="muted">Aucun diplôme déclaré.</p>
    @endforelse

    <h2>Expérience professionnelle</h2>
    @forelse($candidate->experiences->sortByDesc('date_debut') as $xp)
        <div class="item">
            <strong>{{ $xp->poste }}</strong> — {{ $xp->employeur }}
            <div class="muted">
                {{ $xp->date_debut?->format('m/Y') }}
                — {{ $xp->date_fin ? $xp->date_fin->format('m/Y') : 'à ce jour' }}
            </div>
            @if($xp->description)<div>{{ $xp->description }}</div>@endif
        </div>
    @empty
        <p class="muted">Aucune expérience déclarée.</p>
    @endforelse

    <h2>Langues</h2>
    @php $langues = $candidate->langues ?? []; @endphp
    @if(count($langues))
        <p>
            @foreach($langues as $langue)
                {{ $langue['langue'] ?? '' }}
                ({{ match($langue['niveau'] ?? '') {
                    'courant' => 'courant',
                    'intermediaire' => 'intermédiaire',
                    'scolaire' => 'scolaire',
                    default => $langue['niveau'] ?? '',
                } }})@if(! $loop->last) · @endif
            @endforeach
        </p>
    @else
        <p class="muted">Non renseigné.</p>
    @endif

    <div class="footer">
        Document généré par le Portail Concours et Recrutements Tchad le {{ now()->format('d/m/Y à H:i') }}.
        Ce curriculum vitae suit le gabarit unique de l’administration — il ne peut pas être mis en page librement.
        @if($application)
            Dossier n° {{ $application->application_number }}.
        @endif
    </div>
</body>
</html>
