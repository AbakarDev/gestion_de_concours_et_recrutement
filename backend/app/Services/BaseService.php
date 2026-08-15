<?php

namespace App\Services;

use App\Interfaces\RepositoryInterface;

abstract class BaseService
{
    protected RepositoryInterface $repository;

    public function __construct(RepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    // Les services étendront cette classe et définiront leur logique métier spécifique ici.
}
