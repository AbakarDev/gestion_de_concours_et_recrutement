# Guide web, mobile et API — E-Concours Tchad

Document opérationnel : organisation du dépôt, comment les clients parlent à Laravel, connexion / jetons, et comment tout lancer en local (PC + téléphone physique).

Pour le discours de soutenance (métier, rôles, anonymat, HMAC), voir [`DOCUMENTATION_SOUTENANCE_PFE.md`](DOCUMENTATION_SOUTENANCE_PFE.md).

---

## 1. Idée d’architecture

Le projet est **API-first** : une seule API Laravel, deux clients.

```
┌─────────────────────┐     Bearer Sanctum      ┌──────────────────────┐
│  web/  React + Vite │ ──────────────────────► │                      │
│  port 3000          │                         │  backend/ Laravel 12 │
└─────────────────────┘                         │  préfixe /api        │
                                                │  artisan :8001       │
┌─────────────────────┐     même contrat        │  PostgreSQL :5433    │
│  mobile/ Expo RN    │ ──────────────────────► │                      │
│  Expo Go / émulateur│                         └──────────────────────┘
└─────────────────────┘
```

- Il n’y a **pas** de `/api/v1`. Toutes les routes sont sous `/api/...`.
- Web et mobile **ne se parlent pas**. Ils consomment la même API, avec le même login.
- L’administration (instruction, jury, classement, utilisateurs) est **uniquement sur le web**.
- Le mobile est un client **candidat** (connexion, inscription, suivi des candidatures).

---

## 2. Organisation du dépôt

```
projetFinEtude/
├── backend/          API Laravel 12 (Sanctum + Spatie)
├── web/              Client React / Vite (admin + candidat)
├── mobile/           Client Expo / React Native (candidat)
├── infra/            Docker Compose, Nginx, PostgreSQL, MinIO
├── README.md
├── GUIDE_WEB_MOBILE.md          ← ce fichier
└── DOCUMENTATION_SOUTENANCE_PFE.md
```

| Répertoire | Rôle | Port local |
|---|---|---|
| `backend/` | API REST, métier, RBAC | **8001** (`php artisan serve`) |
| `web/` | Interface navigateur | **3000** (Vite) |
| `mobile/` | Application smartphone | Expo (Metro) |
| `infra/` | Postgres 16, Redis, MinIO, Nginx | Postgres **5433**, Nginx Docker **8000** |

**À utiliser en développement quotidien :** artisan sur **8001** + Vite + Expo.  
Le Nginx Docker (`infra`, port **8000**) sert la même API via PHP-FPM. Depuis le PC, `127.0.0.1:8000` pointe vers le **conteneur**, dont `DB_HOST=127.0.0.1` ne voit pas Postgres hôte. Pour le web et le téléphone, viser **8001**.

Les tests PHPUnit (`backend/phpunit.xml`) restent en **SQLite mémoire**. La démo utilise **PostgreSQL**.

---

## 3. Relier les clients à l’API

Les deux clients Axios ont une `baseURL` qui **doit déjà contenir** `/api`.

| Client | Fichier | Variable | Exemple |
|---|---|---|---|
| Web | `web/.env.local` | `VITE_API_URL` | `http://127.0.0.1:8001/api` |
| Mobile | `mobile/.env` | `EXPO_PUBLIC_API_URL` | selon la cible (tableau ci-dessous) |

Modèles : `web/.env.example` et `mobile/.env.example`.

Vite ne relit `.env.local` qu’au **démarrage**. Expo ne relit `.env` qu’au **redémarrage** de Metro (`npx expo start`).

### 3.1 Où pointer selon l’appareil

| Qui exécute le client | URL `…/api` |
|---|---|
| Navigateur sur **le même PC** | `http://127.0.0.1:8001/api` |
| Émulateur Android | `http://10.0.2.2:8001/api` (`10.0.2.2` = le PC hôte) |
| Simulateur iOS / Expo web | `http://127.0.0.1:8001/api` |
| **Téléphone physique** (Expo Go) | `http://<IP-LAN-du-PC>:8001/api` |

Sans `EXPO_PUBLIC_API_URL`, le mobile choisit tout seul `10.0.2.2` sur Android et `127.0.0.1` ailleurs (`mobile/src/config.ts`).

Trouver l’IP LAN du PC :

```bash
hostname -I | awk '{print $1}'
```

Exemple actuel : `192.168.100.6` → `EXPO_PUBLIC_API_URL=http://192.168.100.6:8001/api`.

### 3.2 Règle indispensable pour le téléphone

Laravel doit écouter **toutes** les interfaces, pas seulement la boucle locale :

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8001
```

Sans `--host=0.0.0.0`, le serveur reste sur `127.0.0.1`. Pour le téléphone, `127.0.0.1` désigne **le téléphone lui-même**, pas le PC.

PC et téléphone sur le **même Wi-Fi** (pas de VPN / données mobiles isolées). HTTP clair est autorisé côté Android (`usesCleartextTraffic` dans `mobile/app.json`).

### 3.3 Vérifier que l’API répond

```bash
# Sans jeton → 401 (normal : la route est protégée)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8001/api/applications \
  -H 'Accept: application/json'

# Depuis le LAN (téléphone)
curl -s -o /dev/null -w "%{http_code}\n" http://192.168.100.6:8001/api/applications \
  -H 'Accept: application/json'
```

`401` = le serveur est joignable. `Connection refused` = mauvais host/port, ou artisan pas relancé avec `0.0.0.0`.

---

## 4. Connexion (Sanctum, pas JWT)

Les deux clients font le **même** échange.

```
POST /api/auth/login     { email, password }
        ↓
{ data: { user, access_token, refresh_token } }

Ensuite, chaque requête :
  Authorization: Bearer <access_token>
  Accept: application/json
```

| Étape | Endpoint |
|---|---|
| Inscription | `POST /api/auth/register` |
| Connexion | `POST /api/auth/login` |
| Profil | `GET /api/auth/me` |
| Rafraîchir | `POST /api/auth/refresh` `{ refresh_token }` |
| Déconnexion | `POST /api/auth/logout` |

Après un **401**, Axios tente un refresh, rejoue la requête, sinon vide la session.

| | Web (`web/src/lib/axios.ts`) | Mobile (`mobile/src/api/client.ts`) |
|---|---|---|
| Stockage | `localStorage` | `AsyncStorage` |
| Clés | `auth_token`, `refresh_token`, `auth_user` | identiques |
| Contexte | `web/src/contexts/AuthContext.tsx` | `mobile/src/auth/AuthContext.tsx` |

Un compte créé sur le web **fonctionne** sur le mobile, et l’inverse (même table `users`).

Après login web, la redirection dépend du rôle (`web/src/lib/dashboardPath.ts`) :

- `candidat` → `/candidate`
- personnel → `/admin` (ou une sous-page selon le rôle)

Le mobile n’embarque pas l’admin : un SuperAdmin qui se connecte sur Expo verra le tableau de bord candidat (liste filtrée par l’API selon le rôle). Pour l’instruction, utiliser le **navigateur**.

---

## 5. Organisation du web (`web/`)

```
web/src/
├── api/index.ts              Tous les appels REST (auth, concours, dossiers…)
├── lib/axios.ts              Instance Axios + Bearer + refresh + FormData
├── contexts/AuthContext.tsx  Session navigateur
├── lib/roles.ts              6 rôles alignés sur Spatie
├── hooks/useDebounce.ts      Recherche (ex. liste des candidatures)
├── utils/format.ts           Dates FR, moyenne des notes
├── layouts/                  AdminLayout, CandidateLayout
├── pages/
│   ├── public/               Accueil, 401, 404
│   ├── auth/                 Login, Register
│   ├── admin/                Tableau de bord, départements, concours,
│   │                         postes, candidatures, notes, classement,
│   │                         dispatch, utilisateurs, paramètres
│   └── candidate/            Tableau de bord, offres, dossier, pièces,
│                             candidatures
└── components/               Modales, badges, exports CSV/PDF…
```

Le routage (`web/src/App.tsx`) est protégé par `ProtectedRoute` + listes de rôles. Ce n’est pas un second contrôle de sécurité : **l’API refuse** aussi (middleware Spatie `auth:sanctum` + `role:…`).

### Périmètre web

- Public : landing, listes concours / offres.
- Candidat : état civil, photo, diplômes, expériences, CV administratif généré, dépôt, paiement mock, suivi.
- Personnel : instruction des dossiers, notes anonymes (jury), classement, dispatch, utilisateurs (SuperAdmin).

### Lancer le web

```bash
cd web
cp .env.example .env.local   # si le fichier n’existe pas
# VITE_API_URL=http://127.0.0.1:8001/api
npm install
npm run dev                  # http://127.0.0.1:3000
```

---

## 6. Organisation du mobile (`mobile/`)

```
mobile/
├── App.tsx
├── src/
│   ├── config.ts                 URL API + couleur marine #1B4F8A
│   ├── api/client.ts             Axios + Bearer + refresh
│   ├── api/auth.ts               login / register / logout
│   ├── api/applications.ts       GET /applications
│   ├── auth/storage.ts           AsyncStorage
│   ├── auth/AuthContext.tsx
│   ├── navigation/RootNavigator.tsx
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── RegisterScreen.tsx
│       └── DashboardScreen.tsx   liste des candidatures du compte
├── .env / .env.example
└── app.json                      usesCleartextTraffic: true (HTTP LAN)
```

Navigation : pile **Auth** (login / inscription) ou **onglets candidat** (Accueil, Candidatures, Offres, Dossier).

### Périmètre mobile actuel

Livré (espace **candidat**, charte navy + drapeau comme le web) :

- connexion / inscription ;
- tableau de bord (compteurs, dossiers récents, actions) ;
- mes candidatures + détail + simulation des frais ;
- offres publiées + dépôt si le dossier est complet ;
- lecture du dossier (état civil, checklist des pièces, diplômes).

L’**administration** (instruction, jury, utilisateurs) et le téléversement photo/scans restent sur **web**.

### Lancer le mobile

```bash
cd mobile
cp .env.example .env
# Adapter EXPO_PUBLIC_API_URL (voir § 3.1)
npm install
npx expo start
```

Installer **Expo Go** sur le téléphone, scanner le QR. Relancer Expo après chaque changement de `.env`.

---

## 7. Lancer la stack complète

Trois terminaux (plus Expo).

**1 — PostgreSQL** (si le conteneur n’est pas déjà up) :

```bash
cd infra
docker compose up -d db
```

Identifiants : `infra/pg_setup.md`. `backend/.env` doit avoir `DB_CONNECTION=pgsql`, host `127.0.0.1`, port **5433**.

**2 — API** (accessible PC **et** téléphone) :

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8001
```

Premier schéma + démo :

```bash
cd backend
php artisan migrate
php artisan db:seed
```

`DatabaseSeeder` enchaîne rôles, concours / offres, puis **4 candidatures de démonstration**.

**3 — Web** : `cd web && npm run dev`

**4 — Mobile** : `cd mobile && npx expo start`

---

## 8. Comptes de démonstration

Mot de passe commun : **`password`**.

| Email | Rôle | Où se connecter |
|---|---|---|
| `superadmin@recrute.td` | SuperAdmin | Web admin |
| `admin@recrute.td` | Administrateur | Web (instruction) |
| `responsable@recrute.td` | Responsable de concours | Web |
| `jury@recrute.td` | Jury | Web (notes anonymes) |
| `recruteur@recrute.td` | Recruteur | Web |
| `candidat@test.td` | Candidat (Moussa) | Web **et** mobile |
| `fatime@test.td` | Candidat | Web / mobile |
| `ibrahim@test.td` | Candidat | Web / mobile |

Candidatures seedées (page admin **Candidatures**) :

| N° | Candidat | Statut |
|---|---|---|
| APP-2026-0001 | Moussa | Soumise |
| APP-2026-0002 | Moussa | En cours |
| APP-2026-0003 | Fatime | Acceptée (anonymat généré) |
| APP-2026-0004 | Ibrahim | Rejetée |

Si la table est vide après un `migrate:fresh` :

```bash
cd backend
php artisan db:seed --class=DemoApplicationsSeeder
```

Puis recharger la page web.

---

## 9. Endpoints utiles (même contrat web / mobile)

Préfixe : `/api`. Les routes protégées exigent `Authorization: Bearer …`.

**Auth** — `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` ; `GET /auth/me`.

**Public** — `GET /departments`, `/competitions`, `/job-offers`, `/public/settings`, `/public/stats`.

**Candidat (Sanctum)** — dossier `GET/PUT /candidate/dossier`, photo, diplômes, expériences, `POST /job-offers/{id}/apply`, `GET /applications` (l’API ne renvoie **que** les dossiers du candidat connecté).

**Personnel** — mêmes `GET /applications` (tous les dossiers, sauf jury : copies anonymisées `accepted` / `evaluated`), changement de statut, notes, classement, dispatch, utilisateurs, exports CSV/PDF.

Le client ne « filtre » pas les données sensibles : le **backend** masque l’identité si le rôle est jury seul (`user: null`, numéro d’anonymat).

---

## 10. Dépannage rapide

| Symptôme | Cause fréquente | Correction |
|---|---|---|
| Web : « Aucune candidature trouvée » | Base ressettée, seeder non lancé | `php artisan db:seed --class=DemoApplicationsSeeder` |
| Web : login 500 sur le port **8000** | Nginx Docker, Postgres injoignable depuis le conteneur | Pointer `VITE_API_URL` vers **8001** (artisan hôte) |
| Mobile : Network Error / timeout | Artisan sur `127.0.0.1` seulement | Relancer avec `--host=0.0.0.0 --port=8001` |
| Mobile : toujours l’ancienne URL | `.env` lu au start d’Expo | Arrêter Metro, relancer `npx expo start` |
| Photo dossier 422 | `Content-Type: multipart` sans boundary | Déjà géré dans `web/src/lib/axios.ts` (suppression du header si `FormData`) |
| Port 3000 occupé | Un Vite déjà lancé | Utiliser l’onglet existant, ou l’autre port proposé (3001) |

---

## 11. Ce qui a été mis en place (rappel)

1. **Découpage** `frontend/` → `web/`, Docker dans `infra/`, base de démo **PostgreSQL**.
2. **Web** : portail public + espaces candidat et administration, dossier ministériel, verrou frais, instruction des candidatures.
3. **Mobile Expo** : même API Sanctum, login / inscription / refresh, tableau de bord candidat.
4. **Câblage API** : `VITE_API_URL` et `EXPO_PUBLIC_API_URL` vers `/api` (sans `/v1`), artisan **8001**, LAN `0.0.0.0` pour le téléphone.
5. **Données de démo** : 6 rôles + 3 candidats + 4 dossiers pour peupler l’écran Candidatures.
