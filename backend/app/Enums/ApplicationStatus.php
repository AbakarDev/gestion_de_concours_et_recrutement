<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case SUBMITTED = 'submitted';
    case UNDER_REVIEW = 'under_review';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';
    case EVALUATED = 'evaluated';

    public function label(): string
    {
        return match($this) {
            self::SUBMITTED => 'Soumise',
            self::UNDER_REVIEW => 'En cours d\'évaluation',
            self::ACCEPTED => 'Acceptée',
            self::REJECTED => 'Rejetée',
            self::EVALUATED => 'Évaluée',
        };
    }
}
