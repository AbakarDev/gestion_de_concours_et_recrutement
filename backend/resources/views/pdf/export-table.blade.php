<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; }
        .header { border-bottom: 2px solid #1B4F8A; padding-bottom: 8px; margin-bottom: 16px; }
        .brand { font-size: 11px; color: #1B4F8A; text-transform: uppercase; letter-spacing: 1px; }
        h1 { font-size: 16px; margin: 4px 0 0; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1B4F8A; color: #fff; text-align: left; padding: 6px 8px; font-size: 10px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        .footer { margin-top: 18px; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        .empty { text-align: center; padding: 24px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">République du Tchad — Portail Concours et Recrutements</div>
        <h1>{{ $title }}</h1>
    </div>

    @if (count($rows) === 0)
        <p class="empty">Aucune donnée à exporter.</p>
    @else
        <table>
            <thead>
                <tr>
                    @foreach ($headers as $header)
                        <th>{{ $header }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach ($rows as $row)
                    <tr>
                        @foreach ($row as $cell)
                            <td>{{ $cell ?? '—' }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="footer">
        Généré le {{ $generatedAt }}@if($generatedBy) par {{ $generatedBy }}@endif
        — Document officiel à usage interne. {{ count($rows) }} ligne(s).
    </div>
</body>
</html>
