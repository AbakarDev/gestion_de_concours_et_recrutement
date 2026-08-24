# Portail Concours et Recrutements Tchad (e-CR Tchad)

**Projet de fin d’études** — Conception et réalisation d’une plateforme **web et mobile** pour la gestion des **concours** et des **recrutements** au Tchad.

Plateforme de démonstration (PFE) : dépôt de dossiers, instruction administrative, notation **anonyme** du jury, classement, convocations PDF/QR, et administration multi-rôles. **Ce dépôt n’est pas le site officiel d’un ministère.**

## Fonctionnalités

| Domaine | Web | Mobile (candidat) |
|---|---|---|
| Authentification (mot de passe, OTP, refresh Sanctum) | ✓ | ✓ |
| Dossier candidat (photo, pièces, diplômes, CV officiel) | ✓ | ✓ |
| Offres / concours et candidatures | ✓ | ✓ |
| Instruction, jury, classement, dispatch | ✓ | — |
| Convocations + vérification publique QR | ✓ | mention |
| Admin utilisateurs, rôles, paramètres plateforme | ✓ | — |
| Exports CSV / PDF | ✓ | — |

## Stack technique

| Couche | Technologie |
|---|---|
| API | Laravel 12, PHP 8.2, Sanctum, Spatie Permission |
| Web | React 19, TypeScript, Vite, Tailwind |
| Mobile | React Native, Expo SDK 57, TypeScript |
| Base | PostgreSQL 16 (Docker) |
| Infra | Docker Compose, Nginx, PHP-FPM |

Architecture **API-first** : une API REST sous `/api` (sans `/api/v1`), consommée par le web et le mobile.

## Structure du dépôt

```
backend/   API Laravel (auth, concours, candidatures, jury, exports)
web/       Interface React (public, candidat, administration)
mobile/    Application Expo (espace candidat)
infra/     Docker Compose, PostgreSQL, Nginx
```

## Démarrage rapide

### 1. Base de données

```bash
cd infra
docker compose up -d db
```

PostgreSQL écoute sur le port **5433** (voir `infra/pg_setup.md`).

### 2. Backend

```bash
cd backend
cp .env.example .env   # ajuster DB_* si besoin
composer install
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8001
```

Les tests PHPUnit utilisent SQLite en mémoire ; le dev/démo utilise PostgreSQL.

### 3. Web

```bash
cd web
npm install
cp .env.example .env.local   # VITE_API_URL=http://127.0.0.1:8001/api
npm run dev
```

### 4. Mobile (téléphone ou émulateur)

```bash
cd mobile
npm install
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://<IP-LAN-du-PC>:8001/api
npx expo start
```

Le backend doit être lancé avec `--host=0.0.0.0` pour un appareil physique sur le même Wi‑Fi.

## Comptes de démonstration

Mot de passe par défaut après seed : **`password`**

| Rôle | E-mail |
|---|---|
| SuperAdmin | `superadmin@recrute.td` |
| Administrateur | `admin@recrute.td` |
| Jury | `jury@recrute.td` |
| Candidat | `candidat@test.td` |

## Sécurité (points clés)

- **Sanctum** (jetons opaques + refresh rotatif), pas JWT
- **6 rôles** Spatie (SuperAdmin, Administrateur, Responsable de concours, Jury, Recruteur, candidat)
- **Anonymat jury** : numéro d’anonymat, identité masquée côté API
- **Intégrité des notes** : cachet HMAC-SHA256 sur chaque note
- Comptes désactivables, journal d’auth, OTP sans fuite du code dans la réponse API

## Hors périmètre / mocks

- Paiement Mobile Money (Airtel / Moov) : **simulation** uniquement
- SMS : simulateur en dev (`MAIL_MAILER=log` pour l’e-mail OTP)

## Licence

Projet académique (PFE). Usage libre à des fins d’étude ; ne pas présenter comme service officiel de l’État.

---

**Auteur :** Arrada — PFE 2026
