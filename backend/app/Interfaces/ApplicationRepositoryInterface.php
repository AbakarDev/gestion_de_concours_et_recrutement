<?php

namespace App\Interfaces;

use Illuminate\Pagination\LengthAwarePaginator;

interface ApplicationRepositoryInterface extends RepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator;
    public function findByNumber(string $applicationNumber);
}
