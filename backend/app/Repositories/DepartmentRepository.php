<?php

namespace App\Repositories;

use App\Models\Department;
use App\Interfaces\DepartmentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class DepartmentRepository extends BaseRepository implements DepartmentRepositoryInterface
{
    public function __construct(Department $model)
    {
        parent::__construct($model);
    }

    public function getRootDepartments(): Collection
    {
        return $this->model->whereNull('parent_id')->get();
    }
}
