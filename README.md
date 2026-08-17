# E-Concours Tchad

Dépôt en quatre répertoires :

```
backend/   API Laravel 12 (Sanctum, préfixe /api)
web/        Client React / Vite (administration + candidat)
mobile/     Client React Native / Expo (candidat)
infra/      Docker Compose, Nginx, PHP-FPM, PostgreSQL, pg_setup.md
```

L’API n’utilise **pas** `/api/v1` : les routes Laravel sont sous `/api`.

## Lancer en local

PostgreSQL (déjà mappé sur le port **5433**) :

```bash
cd infra
docker compose up -d db
# ou, si la stack historique tourne encore depuis la racine : docker ps | grep postgres
```

Détail des identifiants : `infra/pg_setup.md`.

```bash
# Backend
cd backend
php artisan serve --port=8001

# Web
cd web
npm install
npm run dev          # http://127.0.0.1:3000

# Mobile
cd mobile
npm install
npx expo start
```

`backend/phpunit.xml` reste en **SQLite mémoire**. Le développement / la démo utilisent **PostgreSQL**.
