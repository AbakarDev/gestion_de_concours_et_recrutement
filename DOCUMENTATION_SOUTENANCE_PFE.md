# Documentation de soutenance — E-Concours Tchad

**Projet de Fin d’Études** — Plateforme de gestion des concours et recrutements de la fonction publique (web + mobile).

Ce document décrit **ce qui existe réellement dans le code**, les outils utilisés, et comment répondre au jury. Si une question porte sur une brique non livrée (opérateur Mobile Money réel, Redis en production), le dire clairement : c’est plus solide que d’inventer.

**Client mobile retenu : React Native** (pas Flutter). Il consomme **la même API Laravel** que le site web. Le dossier `mobile/` n’est pas encore dans ce dépôt : le choix techno est figé ; l’implémentation se fait en client séparé (Expo + TypeScript).

---

## Sommaire

1. [Pitch (30–60 secondes)](#1-pitch-30–60-secondes)
2. [Problématique et objectifs](#2-problématique-et-objectifs)
3. [Ce que la plateforme fait (parcours métier)](#3-ce-que-la-plateforme-fait-parcours-métier)
4. [Architecture générale](#4-architecture-générale)
5. [Tous les outils — pourquoi chacun](#5-tous-les-outils--pourquoi-chacun)
5bis. [Application mobile React Native](#5bis-application-mobile-react-native)
6. [Les 6 rôles (RBAC)](#6-les-6-rôles-rbac)
7. [Modules, écran par écran](#7-modules-écran-par-écran)
8. [Sécurité, anonymat, intégrité](#8-sécurité-anonymat-intégrité)
9. [Modèle de données](#9-modèle-de-données)
10. [Authentification (Sanctum, pas JWT)](#10-authentification-sanctum-pas-jwt)
11. [Flux techniques importants](#11-flux-techniques-importants)
12. [Tests automatisés](#12-tests-automatisés)
13. [Ce qui est réel / mock / hors périmètre](#13-ce-qui-est-réel--mock--hors-périmètre)
14. [Comptes de démonstration](#14-comptes-de-démonstration)
15. [Questions du jury (réponses prêtes)](#15-questions-du-jury-réponses-prêtes)
16. [Glossaire](#16-glossaire)

---

## 1. Pitch (30–60 secondes)

> Messieurs les membres du jury, j’ai l’honneur de présenter **E-Concours Tchad**, une plateforme web destinée à dématérialiser le recrutement dans la fonction publique.
>
> Le système couvre le cycle complet : publication d’un concours, dépôt de dossier par le candidat, instruction administrative, notation **anonyme** par le jury, classement, et génération de convocations.
>
> Techniquement, c’est une architecture **API-first** : un backend **Laravel 12** (PHP 8.2) expose une API REST. Deux clients la consomment : un **frontend web React 19 / TypeScript** (administration + candidat sur ordinateur) et une **application mobile React Native** (candidat sur smartphone, Android / iOS). Les accès sont contrôlés par **6 rôles Spatie** (guard Sanctum). Les notes du jury sont scellées par un **HMAC-SHA256**.
>
> L’interface web suit une charte **institutionnelle claire** (bleu marine `#1B4F8A`). Le mobile reprend la même identité et les mêmes jetons d’authentification.

**Ne pas dire dans le pitch** (sauf si on vous le demande) : « 10 000 utilisateurs simultanés », « JWT », « Redis », « Flutter ». Le mobile du projet est **React Native**, pas Flutter.

---

## 2. Problématique et objectifs

### Problématique

Aujourd’hui, beaucoup de concours publics au Tchad restent largement **papier** :

- files d’attente pour déposer un dossier ;
- pièces perdues ou illisibles ;
- suspicion de favoritisme à la correction (le jury voit le nom) ;
- convocations et centres d’examen gérés à la main ;
- pas de trace d’audit claire (« qui a validé / noté, quand »).

### Objectifs du PFE

| Objectif | Comment c’est traduit dans le logiciel |
|---|---|
| Transparence | Statuts de dossier visibles, historique, notifications |
| Impartialité | Vue jury sans identité (`user = null` si rôle Jury seul) |
| Traçabilité | `AuditLog`, hash d’intégrité des notes, journal d’auth |
| Séparation des pouvoirs | 6 rôles distincts, pas un seul « admin qui fait tout » |
| Accessibilité | Web clair + mobile React Native (smartphones, connexion 3G) |

### Périmètre livré

**Web (dans ce dépôt — `frontend/`)**

- Site public (landing, liste des concours).
- Espace candidat (dossier, documents, candidatures).
- Espace administration / jury / recruteur (selon le rôle).
- API REST (`backend/`) consommée par le web **et** le mobile.

**Mobile (choix officiel : React Native)**

- Même API, mêmes rôles, mêmes tokens Sanctum.
- Cible prioritaire : **le candidat** (consulter les offres, postuler, suivre le dossier, notifications, convocation / QR).
- L’administration (grilles, dispatch, utilisateurs) reste sur le **web** (écrans larges).

### Hors périmètre / mocks

- Connexion réelle Airtel Money / Moov (simulateur `MockMobileMoneyGateway`).
- Envoi SMS réel (simulateur `MockSmsGateway`).
- Flutter / Kotlin / Swift natifs : **non retenus** (voir § React Native).

---

## 3. Ce que la plateforme fait (parcours métier)

Ordre logique à raconter (et à démontrer) :

```
Département
    → Concours (brouillon → publié → ouvert → clôturé)
        → Offre / poste
            → Candidat postule + téléverse des pièces
                → Administrateur instruit (accepte / rejette)
                    → Jury note (anonyme) + cachet HMAC
                        → Classement par moyenne
                            → Dispatch centres d’examen + convocation PDF/QR
```

### Statuts d’un concours

Définis dans `CompetitionStatus` :

| Valeur | Libellé | Sens |
|---|---|---|
| `draft` | Brouillon | Invisible du public, en préparation |
| `published` | Publié | Visible |
| `open` | Ouvert | Candidatures attendues |
| `evaluating` | En évaluation | Phase jury |
| `closed` | Clôturé | Plus de dépôt |
| `archived` | Archivé | Conservé, plus d’action courante |

Un **planificateur** Laravel ferme automatiquement les concours dont la date de fin est dépassée :

- commande `competitions:close-expired`
- cron quotidien `00:01` fuseau `Africa/Ndjamena` (`routes/console.php`)

### Statuts d’une candidature

Définis dans `ApplicationStatus` :

| Valeur | Libellé |
|---|---|
| `submitted` | Soumise |
| `under_review` | En cours d’évaluation administrative |
| `accepted` | Acceptée (admissible à l’épreuve / au jury) |
| `rejected` | Rejetée (motif attendu) |
| `evaluated` | Notée par le jury |

---

## 4. Architecture générale

### Schéma

```
  Navigateur web                    Smartphone Android / iOS
  React 19 + TypeScript + Vite      React Native (Expo) + TypeScript
        │                                    │
        │         HTTPS / JSON               │
        │    Authorization: Bearer <token Sanctum>
        └────────────────┬───────────────────┘
                         ▼
              API Laravel 12  (routes/api.php)
        │
        ├── Middleware : auth:sanctum + role:… (Spatie)
        ├── Policies (autorisation fine par ressource)
        ├── Controllers (minces)
        ├── Actions (cas d’usage : noter, clôturer, publier, convocation)
        ├── Services + DTO (auth, paiement, SMS, métier)
        ├── Repositories (accès données)
        └── Eloquent Models + PostgreSQL ou SQLite
```

### Pourquoi séparer frontend et backend (API-first) ?

| Question du jury | Réponse courte |
|---|---|
| Pourquoi pas un monolithe Blade ? | L’API sert **deux clients** : React web et React Native, sans dupliquer le métier. |
| Pourquoi pas un SPA qui parle à la base ? | La base n’est jamais exposée au navigateur. Toutes les règles (rôles, hash, dates) restent côté serveur. |

### Clean Architecture dans ce projet (dossiers réels)

```
backend/app/
├── Http/Controllers/Api/   Contrôleurs REST (minces)
├── Http/Requests/          Validation des entrées
├── Http/Resources/         Format JSON de sortie
├── Http/Policies/          Qui a le droit sur quelle ressource
├── Actions/                Un cas d’usage = une classe
├── Services/               Orchestration (Auth, Payment, SMS…)
├── DTO/                    Objets de transfert typés
├── Repositories/           Accès données derrière une interface
├── Interfaces/             Contrats (ex. ApplicationRepositoryInterface)
├── Models/                 Entités Eloquent
├── Enums/                  Rôles, statuts (source unique)
├── Events/ + Listeners/    Ex. changement de statut → notification
├── Notifications/          Email / SMS (OTP, statut)
├── Jobs/                   Tâches asynchrones (file d’attente)
└── Console/Commands/       Scheduler (clôture des concours)
```

**Principe à dire au jury :** un contrôleur ne contient pas la règle métier lourde. Exemple : `ApplicationController::storeScore` valide la requête, autorise, puis délègue à `RecordScoreAction` (transaction + HMAC).

### Frontend (structure)

```
frontend/src/
├── api/              Appels Axios (competitionsApi, usersApi…)
├── lib/              axios (intercepteurs), roles, toasts (Sonner)
├── contexts/         AuthContext (session)
├── layouts/          AdminLayout, CandidateLayout (sidebar filtrée par rôle)
├── pages/            public / auth / admin / candidate
├── components/       modales, badges, cloche de notifications
└── types/            Types TypeScript
```

---

## 5. Tous les outils — pourquoi chacun

C’est la section que le jury interroge le plus (« pourquoi X et pas Y ? »).

### 5.1 Backend

| Outil | Rôle dans le projet | Pourquoi celui-là |
|---|---|---|
| **PHP 8.2+** | Langage serveur | Enums natifs (`RoleName`, statuts), typage, écosystème Laravel. |
| **Laravel 12** | Framework HTTP, ORM, files, scheduler, auth | Mature pour un SI métier (RBAC, migrations, policies). Accélère un PFE sans réinventer le routing. |
| **Eloquent ORM** | Modèles ↔ tables | Relations `Application hasMany Score`, casts d’enums. |
| **Laravel Sanctum** | Jetons d’API (access token) | Standard Laravel pour SPA. Token **opaque** (pas un JWT décodable). |
| **Spatie laravel-permission** | Rôles et permissions | Matrice réelle (pas un champ `is_admin`). Guard `sanctum` aligné sur l’API. |
| **PostgreSQL** (cible) | Base relationnelle | Intégrité référentielle, types, production. |
| **SQLite** (dev local actuel) | Même schéma en fichier | Simple à lancer pour la démo. **Dire : la cible de prod est PostgreSQL.** |
| **Migrations Laravel** | Évolution du schéma | Ex. colonnes `integrity_hash` / `hashed_at` sur `scores`. |
| **Seeders** | Données de démo | 6 comptes + permissions (`RolesAndPermissionsSeeder`). |
| **PHPUnit 11** | Tests automatisés | `RbacTest`, `CriticalBusinessRulesTest`, etc. |
| **Laravel Pint** | Style PHP | Qualité de code (dev). |
| **Argon2id** (`HASH_DRIVER`) | Hachage des mots de passe | Plus moderne que bcrypt seul ; résistant au brute-force. |
| **DomPDF** (`barryvdh/laravel-dompdf`) | PDF de convocation | Génère un PDF à partir d’une vue Blade. |
| **Simple QR Code** | QR sur la convocation | Lien de vérification `GET /api/convocations/verify/{token}`. |
| **Rate limiter Laravel** | Anti brute-force | Login : 5/min/IP ; OTP : 3/min ; refresh : 10/min. |

### 5.2 Frontend

| Outil | Rôle | Pourquoi |
|---|---|---|
| **React 19** | UI | Composants, écosystème, adapté à une SPA d’administration. |
| **TypeScript** | Typage statique | Moins d’erreurs `undefined` en soutenance. |
| **Vite 5** | Bundler / serveur de dev | Rapide, standard actuel (remplace Create React App). |
| **React Router 6** | Routes | `/admin/evaluations`, `/candidate/documents`, `ProtectedRoute`. |
| **Axios** | Client HTTP | Intercepteur : injecte le Bearer, **rafraîchit le token** si 401. |
| **TanStack React Query** | Cache de requêtes | Installé (QueryClient dans `main.tsx`) pour les fetches. |
| **Tailwind CSS 3** | Style | Charte navy uniforme (`blue` et `primary` = `#1B4F8A`). |
| **Framer Motion** | Animations légères | Transitions de pages / sidebar. |
| **Lucide React** | Icônes | Cohérentes, légères. |
| **Sonner** | Toasts (succès / erreur) | Alternative professionnelle à `alert()`. Utilisée par shadcn/ui. |
| **date-fns** | Dates relatives | « Il y a 5 min » dans la cloche de notifications. |
| **Zod + react-hook-form** | Validation formulaires | Présents dans les dépendances pour formulaires typés. |
| **clsx / tailwind-merge** | Classes CSS conditionnelles | Éviter les conflits Tailwind. |
| **Outfit (Google Fonts)** | Typographie | Rendu institutionnel lisible. |

### 5.3 Outils de sécurité « maison » (pas une lib magique)

| Mécanisme | Où | Intérêt |
|---|---|---|
| **HMAC-SHA256 des notes** | `Score::computeIntegrityHash` | Détecte si note / épreuve / jury / horodatage ont été altérés hors de `RecordScoreAction`. Clé = `APP_KEY`. |
| **hash_equals** | Comparaison du HMAC | Évite les attaques par timing. |
| **Refresh token hashé SHA-256** | Table `refresh_tokens` | Le jeton brut n’est pas stocké ; rotation + détection de réutilisation (vol de cookie/token). |
| **OTP 6 chiffres** | `AuthService` | Vérification email/SMS (SMS mock). |
| **Policies Laravel** | `ApplicationPolicy`, `DocumentPolicy`… | Même si le middleware rôle passe, la ressource appartient-elle à l’utilisateur ? |

### 5.4 Simulateurs (à présenter comme tels)

| Interface | Implémentation actuelle | En production on brancherait |
|---|---|---|
| `PaymentGatewayInterface` | `MockMobileMoneyGateway` | API Airtel Money / Moov |
| `SmsGatewayInterface` | `MockSmsGateway` | Passerelle SMS nationale |

**Phrase type :** « J’ai isolé le paiement derrière une interface. Aujourd’hui le PFE utilise un mock pour ne pas dépendre d’un contrat opérateur. Changer d’opérateur = une classe, pas tout le métier. »

### 5.5 Ce que ce n’est **pas**

| On entend souvent | Réalité du code |
|---|---|
| « JWT » | **Sanctum** : token opaque Bearer. Un JWT se *décode* (header.payload.signature). Ici le token n’embarque pas les claims lisibles côté client. |
| « Redis obligatoire » | Non requis pour la démo locale. Les *jobs* Laravel peuvent tourner en `sync` ou avec une queue. Redis serait un choix de **passage à l’échelle**, pas le livrable actuel. |
| « Intelligence artificielle » | Non. Classement = moyenne des notes. Présélection = décision du recruteur. |
| « Flutter » | **Non.** Le client mobile du projet est **React Native**. |

---

## 5bis. Application mobile React Native

### Pourquoi React Native (et pas Flutter, pas du natif pur)

C’est une question quasi certaine du jury. Réponse à apprendre.

| Alternative | Pourquoi on ne l’a pas choisie |
|---|---|
| **Flutter (Dart)** | Autre langage, autre écosystème. L’équipe et le web sont déjà en **TypeScript / React**. Deux stacks = double coût, pas de partage de types (`Role`, DTO). |
| **Kotlin + Swift** | Deux applications natives = deux fois le travail pour un PFE. Inadapté au calendrier. |
| **PWA seule (site dans le navigateur mobile)** | Suffisant pour consulter, trop limité pour caméra (pièces), notifications push, et usage hors navigateur. |
| **React Native** | **Un langage (TypeScript), un paradigme (composants React), une API Laravel.** Android et iOS à partir d’une base. |

**Phrase type :**

> « Le web admin est en React. Le mobile est en React Native pour rester dans la même famille : composants, hooks, TypeScript, Axios, les mêmes noms de rôles. Flutter m’aurait forcé à tout réécrire en Dart alors que le métier est déjà dans l’API. »

### Répartition web vs mobile

| Besoin | Où | Pourquoi |
|---|---|---|
| Gérer concours, notes jury, dispatch, utilisateurs | **Web** | Tableaux, PDF, multi-fenêtres, clavier |
| Voir les offres, postuler, pièces, suivi, convocation, notifications | **React Native** | Le candidat est sur smartphone (3G, Airtel/Moov) |
| Login / refresh Sanctum | **Les deux** | Même `POST /api/auth/login`, même Bearer |

Le mobile **ne duplique pas** les règles (HMAC, RBAC, dates de clôture) : il appelle l’API. Un 403 reste un 403.

### Outils mobiles (stack visée)

| Outil | Rôle | Pourquoi |
|---|---|---|
| **React Native** | UI native (pas une WebView du site) | Vraie app Android/iOS, un seul code |
| **Expo** | Chaîne de build, preview téléphone | Plus rapide qu’un RN « bare » pour un PFE ; EAS Build pour APK/AAB |
| **TypeScript** | Même langage que `frontend/` | Partage possible de types (`Role`, `Application`) |
| **Axios** (ou `fetch` + intercepteur) | HTTP | Même schéma que `frontend/src/lib/axios.ts` : Bearer + refresh si 401 |
| **React Navigation** | Écrans / piles | Équivalent React Router, adapté au mobile |
| **SecureStore (Expo)** | Stocker access/refresh tokens | **Pas** `localStorage` (n’existe pas). Plus sûr que AsyncStorage en clair |
| **Expo Camera / ImagePicker** | Photo des pièces (CNI, diplôme) | Cas d’usage réel au Tchad (scanner depuis le téléphone) |
| **Expo Notifications** | Push (convocation, statut) | Complète la cloche web |

### Écrans candidats (cible fonctionnelle)

À aligner sur l’espace web `/candidate/*` :

1. Accueil / offres ouvertes  
2. Inscription + connexion (OTP possible)  
3. Dépôt de candidature + téléversement  
4. Mes dossiers + `StatusBadge`  
5. Convocation (PDF / QR)  
6. Notifications  

Les écrans **Jury / SuperAdmin** restent sur le web. On peut plus tard un écran « notation » mobile, ce n’est pas la priorité (saisie de notes = écran large).

### Ce que tu dis si le jury demande « montrez l’APK »

État actuel du dépôt : le **backend + frontend web** sont là ; le client React Native est le **choix d’architecture**, à placer dans un dossier `mobile/` (Expo).  
Si l’app n’est pas encore compilée le jour J : montrer le contrat API (`routes/api.php`), le login Sanctum, et le schéma « un backend, deux clients ». Ne pas improviser un projet Flutter.

### Lien avec le paiement mock

Sur mobile, `POST /api/payments/initiate` + USSD simulé a plus de sens (le candidat paie depuis son numéro). Le mock reste le même : l’app n’appelle pas Airtel directement, elle passe par Laravel.

---

## 6. Les 6 rôles (RBAC)

Source unique : enum PHP `App\Enums\RoleName` **et** miroir TypeScript `frontend/src/lib/roles.ts`.  
Guard Spatie : **`sanctum`** (pas `web`). Si le guard est faux, tous les rôles « n’existent pas » → 403 partout.

| Rôle (valeur en base) | Mission | Accès UI typique |
|---|---|---|
| **SuperAdmin** | Pilote le SI, utilisateurs, départements CUD | Tout + `/admin/users` |
| **Administrateur** | Instruit les dossiers (accepter / rejeter) | Candidatures |
| **Responsable de concours** | Crée / publie / clôture les concours, dispatch | Concours, dispatch, classement |
| **Jury** | Note sans voir l’identité | `/admin/evaluations`, classement |
| **Recruteur** | Offres, présélection | Postes / offres |
| **candidat** (minuscule) | Postule, paie (mock), suit son dossier | `/candidate/*` |

### Matrice simplifiée (ce que le jury doit retenir)

| Action | SuperAdmin | Administrateur | Responsable | Jury | Recruteur | Candidat |
|---|---|---|---|---|---|---|
| Lister les utilisateurs / changer un rôle | oui | | | | | |
| Créer un département | oui | | | | | |
| Créer / publier / clôturer un concours | oui | | oui | | | |
| CRUD offres d’emploi | oui | | oui | | oui | |
| Valider / rejeter un dossier | oui | oui | | | | |
| Saisir une note | oui | | | oui | | |
| Présélection | oui | | | | oui | |
| Dispatch convocations | oui | | oui | | | |
| Déposer une candidature | | | | | | oui |
| Initier un paiement (son dossier) | oui | | | | | oui |

Le SuperAdmin passe aussi par `Gate::before` : il a toutes les abilities Laravel (policies).

### Défense en profondeur

1. **Middleware de route** `role:Jury|SuperAdmin` (Spatie).
2. **Policy** (`evaluate`, `validate`, `view`…).
3. **Filtre métier** : un candidat ne voit que *ses* dossiers / documents ; un paiement d’un autre utilisateur → 403.

### Redirections après login

| Rôle | Page |
|---|---|
| candidat | `/candidate` |
| Jury | `/admin/evaluations` |
| Responsable de concours | `/admin/competitions` |
| Recruteur | `/admin/job-offers` |
| Administrateur | `/admin/applications` |
| SuperAdmin | `/admin` |

La sidebar n’affiche **que** les menus autorisés (`AdminLayout` filtre `navItems` par `hasRole`).

---

## 7. Modules, écran par écran

### 7.1 Site public

- **Landing** (`Home.tsx`) : présentation, concours ouverts, formulaire contact (toast Sonner).
- **Login / Register** : inscription → rôle `candidat` automatique (`AuthService`).
- **403 / 404** : pages dédiées.

### 7.2 Espace candidat

| Page | Rôle |
|---|---|
| Tableau de bord | Compteurs (candidatures, concours, offres) |
| Offres | Postuler + pièce jointe optionnelle |
| Mes candidatures | Suivi des statuts (`StatusBadge`) |
| Documents | Téléversement PDF/JPG/PNG (max 5 Mo), aperçu, suppression |
| Profil | Informations personnelles |

### 7.3 Espace administration

| Page | Qui | Quoi |
|---|---|---|
| Dashboard | Personnel | Vue d’ensemble |
| Départements | SuperAdmin (CUD) ; lecture pour Admin / Responsable | Ministères / structures |
| Concours | SuperAdmin, Responsable (+ Admin en lecture) | CRUD, publier, dépublier, clôturer |
| Postes / Offres | SuperAdmin, Responsable, Recruteur | Postes rattachés à un concours |
| Candidatures | SuperAdmin, Admin, Recruteur, Responsable | Instruction, pièces, moyenne |
| Jury — Notes | SuperAdmin, Jury | Notation par épreuve |
| Classement | SuperAdmin, Jury, Responsable, Admin | Moyenne décroissante par poste |
| Dispatching | SuperAdmin, Responsable | Affectation centres d’examen |
| Utilisateurs & rôles | SuperAdmin | `GET /users`, `PUT /users/{id}/role` |

### 7.4 Feedback utilisateur (toasts)

Librairie **Sonner** + dialogues de confirmation (`ConfirmProvider`) à la place de `alert()` / `window.confirm()`.

- Succès : « Note enregistrée », « Concours publié », etc.
- Erreur : message API (`message` ou première erreur de validation).

---

## 8. Sécurité, anonymat, intégrité

### 8.1 Anonymat du jury

Dans `ApplicationResource` :

- si l’utilisateur est **Jury uniquement** (`isJuryOnly()`), le champ `user` (nom, email, NNI, téléphone) vaut **`null`** ;
- les notes admin (`admin_notes`) sont aussi masquées.

**Phrase type :** « L’anonymat n’est pas un CSS qui cache le nom. C’est l’API qui **n’envoie pas** l’identité. Même en ouvrant l’onglet Réseau, le jury n’a pas le nom. »

Le SuperAdmin qui note n’est pas « jury seul » : il peut encore voir l’identité (supervision). C’est voulu.

### 8.2 Cachet HMAC des notes

À chaque enregistrement (`RecordScoreAction`) :

1. Horodatage Unix.
2. Payload : `applicationId|épreuve|note|juryId|timestamp`.
3. `hash_hmac('sha256', payload, APP_KEY)` → 64 caractères hex.
4. Stocké dans `scores.integrity_hash` + `hashed_at`.

Vérification : `Score::integrityHolds()` recalcule et compare avec `hash_equals`.

**Ce que ça prouve :** une modification directe en base (phpMyAdmin, SQLite browser) **casse** le cachet.  
**Ce que ça ne prouve pas :** ce n’est pas une blockchain. C’est une **intégrité applicative** (comme un sceau). Si quelqu’un a `APP_KEY`, il peut recalculer un hash — d’où la protection du `.env`.

### 8.3 Autres contrôles

- Mots de passe **Argon2id**.
- Tokens Sanctum expirés (access ≈ 1 h) + refresh 30 jours, **rotation** (l’ancien refresh est révoqué).
- Réutilisation d’un refresh déjà révoqué → suspicion de vol : révocation de **tous** les tokens (`token_theft_detected`).
- Fichiers : types MIME limités, taille max 5 Mo, stockage `storage` (pas dans la base).
- Paiement : le candidat ne peut initier que **son** dossier (sauf SuperAdmin).
- Réponses JSON homogènes 401 / 403 / 404 / 422 / 429 / 500 (pas de stack trace en production).

### 8.4 Journal d’audit

Modèle `AuditLog` : action, ressource, anciennes/nouvelles valeurs, IP, user-agent.  
Exemple : génération de convocation (`convocation.generated`).  
Il existe aussi `AuthAuditLog` / événements `AuthEvent` (login, refresh, etc.).

---

## 9. Modèle de données

Entités principales (tables Eloquent) :

| Entité | Rôle |
|---|---|
| `users` | Comptes (tous rôles) |
| `candidates` | Profil candidat lié à un user |
| `departments` | Ministères / structures |
| `competitions` | Concours |
| `job_offers` | Postes d’un concours |
| `applications` | Dossier (n° `APP-…`, n° d’anonymat, statut) |
| `documents` | Pièces jointes |
| `scores` | Notes par épreuve + HMAC |
| `results` | Décision publiée / verrouillage |
| `payments` | Frais (flux mock) |
| `convocations` | PDF, QR, centre, salle |
| `exam_centers` | Centres (N’Djaména, Moundou, Abéché…) |
| `prescreenings` | Décision recruteur |
| `application_status_histories` | Historique de statuts |
| `audit_logs` | Traçabilité métier |
| `refresh_tokens` | Refresh hashés |
| `roles` / `permissions` | Spatie |

Relations clés à dessiner au tableau :

```
User 1—n Application n—1 JobOffer n—1 Competition n—1 Department
Application 1—n Score
Application 1—1 Payment
Application 1—1 Convocation n—1 ExamCenter
```

---

## 10. Authentification (Sanctum, pas JWT)

### Flux

1. `POST /api/auth/login` → `access_token` + `refresh_token`.
2. Le frontend stocke les deux dans `localStorage` et envoie `Authorization: Bearer …`.
3. Si l’access expire (401), l’intercepteur Axios appelle `POST /api/auth/refresh`.
4. Logout : révocation Sanctum + révocation des refresh.

### Si le jury dit « vous utilisez JWT »

Réponse honnête :

> « Le client envoie un Bearer, comme avec JWT, mais le token est un **token Sanctum opaque**. Il n’est pas décodable en JSON. L’autorisation vit côté serveur (table `personal_access_tokens` + Spatie). J’ai ajouté une **rotation de refresh tokens** inspirée des pratiques OAuth. »

### OTP / mot de passe oublié

- `POST /api/auth/otp/send` et `verify` (6 chiffres).
- Forgot / reset password via notifications Laravel.
- SMS : `MockSmsGateway` (le canal `SmsChannel` est prêt).

---

## 11. Flux techniques importants

### 11.1 Notation (celui qui a posé le 500)

`POST /api/applications/{id}/scores`

1. Middleware : authentifié + rôle Jury ou SuperAdmin.
2. Validation : épreuve, note 0–20.
3. Policy `evaluate`.
4. `RecordScoreAction` en **transaction** :
   - refuse si résultats verrouillés ou note déjà `locked_at` ;
   - calcule le HMAC ;
   - `updateOrCreate` du score ;
   - passe la candidature en `evaluated`.

Le 500 « `table scores has no column named integrity_hash` » = migration non appliquée. Commande : `php artisan migrate`.

### 11.2 Paiement (mock)

`POST /api/payments/initiate` — Candidat propriétaire (ou SuperAdmin).  
Webhook public `POST /api/payments/mock-webhook` pour simuler le callback opérateur.  
Signature HMAC du webhook dans le mock (`verifyWebhookSignature`).

### 11.3 Convocation & QR

`GenerateConvocationAction` :

- jeton HMAC (id dossier + n° + timestamp, clé `APP_KEY`) ;
- QR = URL ` /api/convocations/verify/{token}` ;
- PDF DomPDF + stockage public.

Le **dispatch** affecte un centre d’examen aux dossiers `accepted`.

### 11.4 Classement

`GET /api/job-offers/{id}/ranking`  
Moyenne des notes, tri décroissant, rang 1, 2, 3…  
Accessible aux rôles « ranking viewers ».

### 11.5 Notifications in-app

`GET /api/notifications`, marquer lu.  
Cloche dans les layouts. Déclenchées notamment par l’événement `ApplicationStatusChanged`.

### 11.6 Présélection recruteur

API `POST /api/applications/{id}/prescreening` (`retained` / `rejected` / `pending`) + verrouillage.  
Service `PrescreeningService`. L’UI dédiée peut encore être enrichie (recrutement direct).

---

## 12. Tests automatisés

Framework : **PHPUnit 11** (pas Pest).

Filtres utiles :

```bash
cd backend
php artisan test --filter='RbacTest|CriticalBusinessRulesTest|ApplicationTest|CompetitionTest|JobOfferTest'
```

Exemples de cas déjà couverts :

- SuperAdmin passe le Gate ;
- Administrateur peut valider un dossier ;
- Responsable peut créer un concours ;
- Candidat **ne peut pas** lister `/users` ;
- Candidat **ne peut pas** payer le dossier d’un autre ;
- rejet sans motif → erreur ;
- note verrouillée → 422 ;
- HMAC stocké et `integrityHolds()` ;
- jury : `user` null dans la ressource.

**Phrase type :** « Les rôles ne sont pas seulement dans un PowerPoint : ils sont testés. Un 403 régressif casse la CI locale. »

---

## 13. Ce qui est réel / mock / hors périmètre

À maîtriser **avant** la soutenance. Un jury valorise la lucidité.

| Sujet | État | Comment le dire |
|---|---|---|
| Web Laravel + React | **Réel** | Cœur du PFE |
| 6 rôles Spatie + policies | **Réel** | Alignés seeder / API / UI / tests |
| HMAC des notes | **Réel** | Colonnes en base |
| Anonymat API jury | **Réel** | `user: null` |
| Scheduler clôture concours | **Réel** | `competitions:close-expired` |
| PDF + QR convocation | **Réel** (génération) | Vérification publique |
| Paiement Mobile Money | **Mock** | Interface prête, pas de contrat opérateur |
| SMS | **Mock** | Idem |
| File d’attente Redis | **Option d’échelle** | Pas nécessaire à la démo |
| Charge 10 000 users | **Non mesuré** | Pagination + rate limit = bases ; pas de test de charge livré |
| Application mobile | **Choix : React Native (Expo)** | Même API que le web ; cible candidat. Pas Flutter. |
| Interface 100 % bilingue FR/EN | **Non** | UI en français |
| Blockchain / horodatage légal ANSSI | **Non** | HMAC applicatif, pas un coffre-fort légal |

---

## 14. Comptes de démonstration

Mot de passe commun : `password`

| Rôle | Email |
|---|---|
| Super Administrateur | `superadmin@recrute.td` |
| Administrateur | `admin@recrute.td` |
| Responsable de concours | `responsable@recrute.td` |
| Jury | `jury@recrute.td` |
| Recruteur | `recruteur@recrute.td` |
| Candidat | `candidat@test.td` |

**Scénario de démo conseillé (8–10 min)**

1. Landing (mode clair, navy).
2. Login **Responsable** → créer / publier un concours + une offre.
3. Login **Candidat** → postuler + document.
4. Login **Administrateur** → accepter le dossier.
5. Login **Jury** → montrer que le nom n’apparaît pas → noter → toast HMAC.
6. Classement.
7. SuperAdmin → page Utilisateurs (preuve que le candidat n’y a pas accès).

---

## 15. Questions du jury (réponses prêtes)

### Architecture

**Q. Pourquoi Laravel et React plutôt qu’un seul framework ?**  
R. Séparation des responsabilités. Le métier et la sécurité restent au serveur. Deux clients : **React web** (admin) et **React Native** (candidat mobile), sans recopier les règles.

**Q. Pourquoi React Native et pas Flutter ?**  
R. Le web est déjà en React/TypeScript. React Native reste dans la même famille (hooks, TS, Axios). Flutter = Dart, zéro réutilisation des types et des compétences déjà posées. Un PFE n’a pas vocation à maintenir deux langages UI.

**Q. Le mobile remplace-t-il le site ?**  
R. Non. Le **web** reste l’outil du ministère (tableaux, jury, dispatch). Le **mobile** est l’outil du citoyen-candidat.

**Q. C’est quoi Clean Architecture ici ?**  
R. Pas un dogme académique complet (pas d’hexagone pur). C’est un **découpage** : Controller → Action/Service → Repository → Model. Les cas d’usage (`RecordScoreAction`, `CloseCompetitionAction`) sont testables sans HTTP.

**Q. Pourquoi Spatie plutôt qu’un enum `role` sur users ?**  
R. Un utilisateur peut avoir des permissions fines ; la matrice évolue sans migration. Le SuperAdmin n’est pas « magique » uniquement en PHP : il a aussi toutes les permissions en base + `Gate::before`.

### Sécurité

**Q. C’est du JWT ?**  
R. Non. Sanctum, token opaque. Refresh rotatif hashé SHA-256. Détection de réutilisation.

**Q. Comment le jury ne voit pas le nom ?**  
R. `ApplicationResource` : si `isJuryOnly()`, `user` n’est pas sérialisé. Ce n’est pas du CSS.

**Q. Le hash des notes, c’est du chiffrement ?**  
R. Non. C’est un **HMAC** (intégrité + authenticité avec secret `APP_KEY`), pas un chiffrement (on peut toujours lire la note en clair en base, c’est voulu : le jury et l’admin doivent la voir).

**Q. Que se passe-t-il si on change la note en SQL ?**  
R. `integrityHolds()` retourne false. On peut alerter / bloquer une publication.

**Q. XSS / CSRF ?**  
R. API token (pas de cookie de session SPA classique) → CSRF moins critique que sur un formulaire Blade cookie. XSS : React échappe le texte par défaut ; fichiers limités en type/taille.

**Q. RGPD / données personnelles ?**  
R. NNI, téléphone, pièces : accès restreint par rôle. Jury sans identité. Journal d’audit. (Cadre tchadien à relier à la loi locale sur la protection des données si le jury insiste.)

### Métier

**Q. Qui publie les résultats ?**  
R. Responsable / SuperAdmin (`publish-results`), pas le jury seul.

**Q. Recrutement direct vs concours ?**  
R. Les offres sont liées à un concours. Le recruteur gère offres + présélection. Un module « entretien RH » n’est pas le cœur actuel.

**Q. Comment on clôture les concours oubliés ?**  
R. Scheduler quotidien fuseau N’Djaména, commande Artisan.

### Limites (mieux vaut les dire vous-même)

**Q. Le paiement est-il réel ?**  
R. Non, mock. L’interface `PaymentGatewayInterface` est le point d’extension.

**Q. Avez-vous testé 10 000 connexions ?**  
R. Non. J’ai posé pagination, rate limiting, et une architecture API. Un test de charge serait un travail d’exploitation (Redis, workers, CDN).

**Q. Où est le mobile ?**  
R. Client **React Native** (Expo), même API Sanctum que le web. Priorité : espace candidat. L’administration reste sur navigateur.

**Q. Pourquoi pas une simple WebView du site ?**  
R. Une WebView n’est pas une app native : caméra, stockage sécurisé des tokens, notifications push, usage hors onglet Chrome. React Native donne des vrais composants natifs tout en partageant la logique API.

---

## 16. Glossaire

| Terme | Sens |
|---|---|
| **API REST** | Endpoints HTTP JSON (`/api/...`) |
| **RBAC** | Contrôle d’accès par rôles |
| **Policy** | Règle Laravel « cet utilisateur a-t-il le droit sur *cette* ressource ? » |
| **DTO** | Objet qui transporte des données validées entre couches |
| **Action** | Un cas d’usage métier encapsulé |
| **Sanctum** | Auth par token pour SPA web **et** app React Native |
| **React Native** | Framework UI mobile (Android + iOS) en JavaScript/TypeScript, distinct de Flutter |
| **Expo** | Outillage autour de React Native (preview téléphone, build APK) |
| **HMAC** | Hash avec clé secrète (intégrité) |
| **Seeder** | Script qui remplit rôles, permissions, comptes démo |
| **Migration** | Version du schéma SQL |
| **SPA** | Single Page Application (React) |
| **Toast** | Notification non bloquante (Sonner) |
| **Anonymat** | Le correcteur n’a pas l’identité dans l’API |
| **Dispatch** | Affectation des candidats aux centres d’examen |
| **Mock** | Fausse implémentation d’un service externe |

---

## Annexes pratiques (avant la démo)

```bash
# Backend
cd backend
php artisan migrate
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan serve --port=8001

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

Vérifier `VITE_API_URL` (ex. `http://127.0.0.1:8001/api`) pour que le frontend parle au bon backend.

Police visuelle : **fond clair, bleu marine `#1B4F8A`**, pas un thème sombre « startup ».

---

*Document calé sur le code du dépôt (Laravel 12, React 19, Spatie guard `sanctum`, HMAC des notes, Sonner). À relire la veille : pitch, 6 rôles, Sanctum ≠ JWT, mock paiement, scénario de démo.*
