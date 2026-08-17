# Journal de travail — web, mobile, API

Ce document décrit **ce qui a été fait**, **pourquoi**, et **avec quelles technologies**.  
Objectif : que tu puisses relire le code et l’expliquer en soutenance sans surprise.

Pour *lancer* les projets (ports, IP, Expo Go) : [`GUIDE_WEB_MOBILE.md`](GUIDE_WEB_MOBILE.md).  
Pour le *discours métier* (rôles, anonymat, HMAC) : [`DOCUMENTATION_SOUTENANCE_PFE.md`](DOCUMENTATION_SOUTENANCE_PFE.md).

---

## 1. Idée générale (à retenir)

Le logiciel n’est **pas** un site qui « contient » le mobile. C’est une **API unique** (Laravel) et **deux clients** :

| Client | Pour qui | Où |
|---|---|---|
| `web/` | Administration **et** candidat (ordinateur) | Navigateur |
| `mobile/` | **Candidat** uniquement (téléphone) | Expo Go / React Native |

Les deux clients font les **mêmes appels HTTP** (`/api/...`) avec le **même jeton Sanctum**.  
Ils ne se parlent pas entre eux.

L’admin (instruction des dossiers, jury, classement, utilisateurs) reste sur le **web** : ces écrans ont besoin d’un grand écran.

---

## 2. Technologies utilisées

### 2.1 Backend (`backend/`)

| Techno | Rôle |
|---|---|
| **PHP 8.2 + Laravel 12** | API REST, règles métier |
| **Laravel Sanctum** | Jetons `access_token` / `refresh_token` (ce n’est **pas** JWT) |
| **Spatie Permission** | 6 rôles (SuperAdmin, Administrateur, Responsable de concours, Jury, Recruteur, candidat) |
| **PostgreSQL 16** | Base de **développement / démo** (port hôte **5433**) |
| **SQLite mémoire** | Uniquement **PHPUnit** (`backend/phpunit.xml`) |
| **Docker Compose** | Postgres, Redis, MinIO, Nginx PHP-FPM (`infra/`) |

Préfixe des routes : **`/api`** (il n’y a pas `/api/v1` dans ce dépôt).

### 2.2 Web (`web/`)

| Techno | Rôle |
|---|---|
| **React 19 + TypeScript** | Interface |
| **Vite** | Serveur de dev (port **3000**) |
| **React Router** | Pages publiques, admin, candidat |
| **Axios** | HTTP + en-tête `Authorization: Bearer …` + refresh |
| **Tailwind CSS** | Charte navy `#1B4F8A`, drapeau, cartes |

Variable d’environnement : `VITE_API_URL=http://127.0.0.1:8001/api` (`web/.env.local`, non versionné).

### 2.3 Mobile (`mobile/`)

| Techno | Rôle |
|---|---|
| **Expo SDK 57** | Outillage (Metro, Expo Go) |
| **React Native 0.86** | UI native iOS / Android |
| **TypeScript** | Typage |
| **React Navigation 7** | Piles (login) + **onglets** (Accueil, Candidatures, Offres, Dossier) |
| **Axios** | Même contrat API que le web |
| **AsyncStorage** | Stockage du jeton (équivalent de `localStorage` sur le web) |
| **react-native-gesture-handler** + **screens** + **safe-area** | Navigation native stable |

Variable : `EXPO_PUBLIC_API_URL` (`mobile/.env`, non versionné).  
Sur téléphone physique : `http://<IP-LAN-du-PC>:8001/api`.

### 2.4 Infra

| Techno | Rôle |
|---|---|
| **Docker Compose** | Postgres 16, Redis, MinIO, Nginx |
| **php artisan serve --host=0.0.0.0 --port=8001** | API joignable depuis le PC **et** le téléphone |

Le Nginx Docker (port **8000**) sert PHP-FPM dans le conteneur. En local, le web et le mobile visent **artisan 8001** (Postgres hôte `127.0.0.1:5433`).

---

## 3. Ce qui a été fait (dans l’ordre)

### 3.1 Réorganisation du dépôt

Avant : `frontend/` à la racine, Docker à la racine.  
Après :

```
backend/   API Laravel
web/        ancien frontend (git mv, historique conservé)
mobile/     nouveau client Expo
infra/      docker-compose, Nginx, PHP-FPM, pg_setup.md
```

**Pourquoi.** Séparer clairement « site », « téléphone », « API », « machines ». Le nom `web/` évite la confusion avec le service Docker autrefois appelé `web`.

### 3.2 PostgreSQL comme base de démo

- `backend/.env` : `DB_CONNECTION=pgsql`, port **5433**.
- Les tests restent en SQLite mémoire (plus rapides, isolés).
- Correctif Postgres : la FK `documents.candidate_id` ne peut pas pointer vers `candidates` **avant** que cette table existe. La contrainte a été déplacée dans la migration `candidates`.

### 3.3 Données de démonstration (liste Candidatures vide)

Après `migrate:fresh`, l’écran admin **Candidatures** affichait « Aucune candidature trouvée » : ce n’était **pas** un bug d’affichage, la table `applications` était vide.

Ajout de `DemoApplicationsSeeder` :

| N° | Compte | Statut |
|---|---|---|
| APP-2026-0001 | `candidat@test.td` (Moussa) | Soumise |
| APP-2026-0002 | Moussa | En cours |
| APP-2026-0003 | `fatime@test.td` | Acceptée |
| APP-2026-0004 | `ibrahim@test.td` | Rejetée |

Mot de passe commun : `password`.  
`DatabaseSeeder` appelle ce seeder après les rôles et les concours.

### 3.4 Petits extraits web

- `web/src/hooks/useDebounce.ts` : la recherche des candidatures n’appelle l’API qu’après une pause (évite un GET à chaque lettre).
- `web/src/utils/format.ts` : dates FR + moyenne des notes.

### 3.5 Client mobile — fondations

Même auth que le web :

1. `POST /api/auth/login` → `access_token` + `refresh_token` + `user`
2. Chaque requête : `Authorization: Bearer …`
3. Si **401** : `POST /api/auth/refresh`, puis on rejoue la requête
4. Stockage : `AsyncStorage` (`auth_token`, `refresh_token`, `auth_user`)

Fichiers clés :

- `mobile/src/api/client.ts` — Axios + refresh
- `mobile/src/auth/AuthContext.tsx` — session
- `mobile/src/config.ts` — URL de l’API

### 3.6 Client mobile — interface candidat (alignée sur le web)

Le premier jet n’avait qu’une liste : d’où l’impression « ça ne ressemble pas au web / une seule fonction ».

Ajout d’une **charte ministérielle** (navy, bandeau bleu / or / rouge comme le drapeau) et de **4 onglets** :

| Onglet | Écran | API |
|---|---|---|
| Accueil | Compteurs, dossiers récents, actions | `GET /applications`, `/job-offers`, `/competitions` |
| Candidatures | Liste + détail + simulation des frais | `GET /applications`, `GET /applications/{id}`, `POST /payments/simulate` |
| Offres | Liste + dépôt si le dossier est complet | `GET /job-offers`, `GET /candidate/dossier`, `POST /applications` |
| Dossier | État civil, checklist des pièces, diplômes | `GET /candidate/dossier` |

Ce qui **reste sur le web** (volontairement) : téléversement photo/scans, génération CV PDF, écrans d’administration / jury.

### 3.7 Téléphone physique (ce qui bloquait vraiment)

Plusieurs problèmes distincts, dans l’ordre :

1. **`php artisan serve` sans `--host=0.0.0.0`**  
   L’API n’écoute que `127.0.0.1`. Pour le téléphone, `127.0.0.1` = le téléphone lui-même.  
   Correctif : `php artisan serve --host=0.0.0.0 --port=8001`.

2. **URL ouverte dans Chrome**  
   `exp.direct` / ngrok n’est **pas** un site web. Il faut **Expo Go** → « Saisir l’URL manuellement ».

3. **Expo Go 54 vs projet SDK 57**  
   Le Galaxy A15 avait Expo Go **54.0.8**. Le projet est **SDK 57**. Expo Go affiche alors écran blanc / « Project is incompatible ».  
   Correctif : installer Expo Go **57.0.9** via USB (`npx expo-go download android 57` + `adb install`), puis `npx expo start --lan --android`.

Le Play Store peut rester en retard sur un SDK tout neuf. Pour un téléphone Android en USB, on installe le binaire Expo Go **qui correspond** au SDK du projet.

---

## 4. Comment les API sont reliées (schéma mental)

```
Téléphone / Navigateur
        │
        │  HTTP  Authorization: Bearer <token>
        ▼
  http://IP:8001/api/....     (Laravel)
        │
        ▼
  PostgreSQL :5433
```

| Fichier | Variable | Exemple |
|---|---|---|
| `web/.env.local` | `VITE_API_URL` | `http://127.0.0.1:8001/api` |
| `mobile/.env` | `EXPO_PUBLIC_API_URL` | `http://192.168.100.6:8001/api` |

Ces fichiers **ne vont pas sur GitHub** (secrets / IP locale). Les modèles sont `.env.example`.

Un compte créé sur le web fonctionne sur le mobile (même table `users`).

---

## 5. Organisation du code mobile (pour t’y retrouver)

```
mobile/src/
├── theme.ts                    couleurs navy / or / rouge
├── config.ts                   URL de l’API
├── api/client.ts               Axios + refresh 401
├── api/auth.ts                 login / register / logout
├── api/applications.ts         liste, détail, dépôt, paiement mock
├── api/catalog.ts              offres, concours, dossier
├── auth/                       session AsyncStorage
├── navigation/
│   ├── RootNavigator.tsx       login OU onglets
│   └── MainTabs.tsx            4 onglets
├── screens/                    Accueil, candidatures, offres, dossier, auth
└── ui/                         bandeau drapeau, badge statut, en-tête navy
```

Côté web, l’équivalent est `web/src/api/index.ts` + `web/src/lib/axios.ts` + `web/src/pages/candidate/`.

---

## 6. Compte de test mobile

- E-mail : `candidat@test.td`
- Mot de passe : `password`
- Deux dossiers seedés (soumise + en cours)

Les comptes staff (`superadmin@recrute.td`, etc.) sont faits pour le **web**.

---

## 7. Ce que tu peux dire au jury

> L’architecture est API-first. Laravel expose une API REST sous `/api`. Le client web React et le client mobile React Native / Expo consomment **le même contrat** et les **mêmes jetons Sanctum**. Le mobile couvre le parcours candidat (suivi, offres, dépôt, dossier). L’instruction et le jury restent sur le web, par choix d’ergonomie.

Ne pas dire : JWT, Flutter, `/api/v1` (ce dépôt ne les utilise pas).
