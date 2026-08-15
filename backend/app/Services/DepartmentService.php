<?php

namespace App\Services;

use App\Interfaces\DepartmentRepositoryInterface;
use App\DTO\DepartmentDTO;
use Illuminate\Database\Eloquent\Model;

class DepartmentService extends BaseService
{
    public function __construct(DepartmentRepositoryInterface $repository)
    {
        parent::__construct($repository);
    }

    public function createDepartment(DepartmentDTO $dto): Model
    {
        return $this->repository->create($dto->toArray());
    }

    public function updateDepartment(int $id, DepartmentDTO $dto): bool
    {
        return $this->repository->update($id, $dto->toArray());
    }
}
