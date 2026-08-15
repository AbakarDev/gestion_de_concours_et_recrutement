<?php

namespace App\Interfaces;

use Illuminate\Database\Eloquent\Collection;

interface DepartmentRepositoryInterface extends RepositoryInterface
{
    /**
     * Récupère les ministères racines (sans parent).
     */
    public function getRootDepartments(): Collection;
}
