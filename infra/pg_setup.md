# PostgreSQL — environnement de développement / démo

La base **de développement** est PostgreSQL 16 (port hôte **5433**).  
Les tests PHPUnit restent volontairement en **SQLite mémoire** (`backend/phpunit.xml`).

## Prérequis

- Docker et Docker Compose
- PHP avec l’extension `pdo_pgsql` (`php -m | grep pdo_pgsql`)

## Démarrer Postgres

Depuis la racine du dépôt :

```bash
cd infra
docker compose up -d db
```

Attendre que le healthcheck soit vert (`docker compose ps`).

## Variables Laravel (`backend/.env`)

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=recrutement_db
DB_USERNAME=postgres
DB_PASSWORD=secret
```

Ces identifiants correspondent aux défauts de `infra/docker-compose.yml`.

## Premier schéma + données de démo

```bash
cd backend
php artisan migrate
php artisan db:seed --class=RolesAndPermissionsSeeder
```

Si une ancienne base SQLite (`backend/database/database.sqlite`) existait, elle n’est **plus** utilisée dès que `DB_CONNECTION=pgsql`.

## Vérifier le moteur actif

```bash
cd backend
php artisan tinker --execute="echo config('database.default').PHP_EOL;"
```

Doit afficher `pgsql`.
