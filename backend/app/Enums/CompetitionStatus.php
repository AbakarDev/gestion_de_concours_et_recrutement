<?php

namespace App\Enums;

enum CompetitionStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case OPEN = 'open';
    case EVALUATING = 'evaluating';
    case CLOSED = 'closed';
    case ARCHIVED = 'archived';

    public function label(): string
    {
        return match($this) {
            self::DRAFT => 'Brouillon',
            self::PUBLISHED => 'Publié',
            self::OPEN => 'Ouvert',
            self::EVALUATING => 'En évaluation',
            self::CLOSED => 'Clôturé',
            self::ARCHIVED => 'Archivé',
        };
    }
}
