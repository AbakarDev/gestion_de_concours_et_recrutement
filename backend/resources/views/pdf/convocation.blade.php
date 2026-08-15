<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Convocation</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #004481; padding-bottom: 10px; }
        .title { font-size: 24px; font-weight: bold; color: #004481; text-transform: uppercase; }
        .subtitle { font-size: 16px; margin-top: 5px; }
        .content { margin-top: 20px; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .info-table th, .info-table td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
        .info-table th { width: 30%; color: #004481; }
        .qr-section { text-align: center; margin-top: 40px; }
        .footer { position: absolute; bottom: 30px; width: 100%; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
        .anonymat { background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; }
    </style>
</head>
<body>

    <div class="header">
        <div class="title">CONVOCATION AUX ÉPREUVES</div>
        <div class="subtitle">{{ $application->jobOffer->competition->ministry ?? 'Ministère organisateur' }}</div>
    </div>

    <div class="content">
        <p>Le candidat désigné ci-dessous est convoqué pour participer aux épreuves du concours :</p>
        <p><strong>{{ $application->jobOffer->competition->title }}</strong></p>

        <div class="anonymat">
            Numéro d'anonymat : {{ $application->anonymat_number }}
        </div>

        <table class="info-table">
            <tr>
                <th>N° de Candidature</th>
                <td>{{ $application->application_number }}</td>
            </tr>
            <tr>
                <th>Nom & Prénom(s)</th>
                <td>{{ $application->user->last_name }} {{ $application->user->first_name }}</td>
            </tr>
            <tr>
                <th>Poste visé</th>
                <td>{{ $application->jobOffer->title }}</td>
            </tr>
            <tr>
                <th>Date des épreuves</th>
                <td>{{ \Carbon\Carbon::parse($convocation->exam_date)->format('d/m/Y à H:i') }}</td>
            </tr>
            <tr>
                <th>Centre d'examen</th>
                <td>{{ $convocation->examCenter->name ?? 'Non assigné (à vérifier)' }}</td>
            </tr>
            <tr>
                <th>Salle</th>
                <td>{{ $convocation->salle ?? 'Affichage sur place' }}</td>
            </tr>
        </table>

        <div class="qr-section">
            <p><em>Scan pour contrôle d'authenticité (usage officiel)</em></p>
            <img src="data:image/svg+xml;base64,{{ $qrCode }}" alt="QR Code">
        </div>
    </div>

    <div class="footer">
        <p>Ce document est généré électroniquement et doit être présenté avec une pièce d'identité valide le jour de l'épreuve.</p>
        <p>Généré le {{ \Carbon\Carbon::parse($convocation->generated_at)->format('d/m/Y H:i:s') }} - Plateforme de Recrutement</p>
    </div>

</body>
</html>
