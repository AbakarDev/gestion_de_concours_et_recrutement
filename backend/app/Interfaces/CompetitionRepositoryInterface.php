<?php

namespace App\Interfaces;

use App\Models\Competition;
use Illuminate\Pagination\LengthAwarePaginator;

interface CompetitionRepositoryInterface extends RepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator;
    public function getPublished(int $perPage = 15): LengthAwarePaginator;
}
