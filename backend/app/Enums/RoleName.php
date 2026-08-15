<?php

namespace App\Enums;

/**
 * Source unique des 6 rôles Spatie (guard sanctum).
 * Toute vérification RBAC (middleware, contrôleurs, tests) doit passer par cet enum
 * pour éviter la dérive de nommage (ex. « Admin Ministère » vs « Administrateur »).
 */
enum RoleName: string
{
    case SuperAdmin = 'SuperAdmin';
    case Administrateur = 'Administrateur';
    case ResponsableConcours = 'Responsable de concours';
    case Jury = 'Jury';
    case Recruteur = 'Recruteur';
    case Candidat = 'candidat';

    /**
     * Middleware Spatie `role:A|B` — à poser APRES `auth:sanctum`.
     *
     * @param  list<string|self>  $roles
     */
    public static function route(array $roles): string
    {
        $values = array_map(
            fn (string|self $role) => $role instanceof self ? $role->value : $role,
            $roles
        );

        return 'role:' . implode('|', $values);
    }

    /** Personnel interne — tout sauf candidat. */
    public static function staff(): array
    {
        return [
            self::SuperAdmin->value,
            self::Administrateur->value,
            self::ResponsableConcours->value,
            self::Jury->value,
            self::Recruteur->value,
        ];
    }

    /** Instruction administrative des dossiers (validation / rejet). */
    public static function applicationInstructors(): array
    {
        return [
            self::SuperAdmin->value,
            self::Administrateur->value,
        ];
    }

    /** Consultation des candidatures (hors candidat, qui a son propre filtre). */
    public static function applicationViewers(): array
    {
        return [
            self::SuperAdmin->value,
            self::Administrateur->value,
            self::ResponsableConcours->value,
            self::Jury->value,
            self::Recruteur->value,
        ];
    }

    public static function competitionManagers(): array
    {
        return [
            self::SuperAdmin->value,
            self::ResponsableConcours->value,
        ];
    }

    public static function jobOfferManagers(): array
    {
        return [
            self::SuperAdmin->value,
            self::ResponsableConcours->value,
            self::Recruteur->value,
        ];
    }

    public static function evaluators(): array
    {
        return [
            self::SuperAdmin->value,
            self::Jury->value,
        ];
    }

    public static function rankingViewers(): array
    {
        return [
            self::SuperAdmin->value,
            self::Administrateur->value,
            self::ResponsableConcours->value,
            self::Jury->value,
        ];
    }

    public static function departmentManagers(): array
    {
        return [
            self::SuperAdmin->value,
        ];
    }

    public static function departmentViewers(): array
    {
        return [
            self::SuperAdmin->value,
            self::Administrateur->value,
            self::ResponsableConcours->value,
        ];
    }

    public static function prescreeners(): array
    {
        return [
            self::SuperAdmin->value,
            self::Recruteur->value,
        ];
    }

    public static function dispatchers(): array
    {
        return [
            self::SuperAdmin->value,
            self::ResponsableConcours->value,
        ];
    }

    public static function dashboardViewers(): array
    {
        return self::staff();
    }

    /** Export CSV / PDF des listes métier (hors jury, qui n'exporte que le classement). */
    public static function exporters(): array
    {
        return [
            self::SuperAdmin->value,
            self::Administrateur->value,
            self::ResponsableConcours->value,
            self::Recruteur->value,
        ];
    }

    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }
}
