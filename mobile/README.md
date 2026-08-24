# Client mobile — Portail Concours et Recrutements Tchad (React Native / Expo)

Client **léger** de la même API Laravel Sanctum que `web/`.  
Préfixe réel : **`/api`** (ce dépôt n’expose pas `/api/v1`).

## Prérequis

- Node.js 20+
- Compte Expo (optionnel)
- **Expo Go** sur un téléphone, **ou** émulateur Android / simulateur iOS
- Backend Laravel démarré **accessible depuis le téléphone** :

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8001
```

Sans `--host=0.0.0.0`, le téléphone ne peut pas joindre l’API (`127.0.0.1` = le téléphone lui-même).

## Installation

```bash
cd mobile
npm install
cp .env.example .env   # puis adapter l’URL si besoin
```

## Lancer

```bash
npx expo start
```

Scanner le QR code avec Expo Go.

### URL de l’API

| Cible | `EXPO_PUBLIC_API_URL` |
|---|---|
| iOS Simulator / Expo web | `http://127.0.0.1:8001/api` |
| Émulateur Android | `http://10.0.2.2:8001/api` (défaut automatique si la variable est vide) |
| Téléphone physique | `http://192.168.100.6:8001/api` (IP LAN actuelle du PC ; à adapter) |

Sans `.env`, l’app choisit 10.0.2.2 sur Android et 127.0.0.1 ailleurs.

Compte démo : `candidat@test.td` / `password`.

## Périmètre actuel

Espace **candidat** aligné sur le web : connexion ministérielle, tableau de bord, candidatures, offres (dépôt), dossier (pièces / diplômes).  
L’administration (instruction, jury, utilisateurs) reste sur **web**.
