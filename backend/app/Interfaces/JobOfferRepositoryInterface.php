<?php

namespace App\Interfaces;

use Illuminate\Pagination\LengthAwarePaginator;

interface JobOfferRepositoryInterface extends RepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator;
}
