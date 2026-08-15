<?php

namespace App\Services;

use App\DTO\JobOfferDTO;
use App\Interfaces\JobOfferRepositoryInterface;
use App\Models\JobOffer;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class JobOfferService extends BaseService
{
    public function __construct(JobOfferRepositoryInterface $repository)
    {
        parent::__construct($repository);
    }

    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->getPaginatedWithFilters($filters, $perPage);
    }

    public function getById(int $id): ?JobOffer
    {
        return $this->repository->find($id);
    }

    public function createJobOffer(JobOfferDTO $dto): JobOffer
    {
        return $this->repository->create($dto->toArray());
    }

    public function updateJobOffer(int $id, JobOfferDTO $dto): JobOffer
    {
        $jobOffer = $this->repository->find($id);
        
        if (!$jobOffer) {
            throw ValidationException::withMessages(['id' => 'Poste introuvable.']);
        }

        $this->repository->update($id, $dto->toArray());
        
        return $this->repository->find($id);
    }

    public function delete(int $id): bool
    {
        $jobOffer = $this->repository->find($id);
        
        if (!$jobOffer) {
            throw ValidationException::withMessages(['id' => 'Poste introuvable.']);
        }
        
        return $this->repository->delete($id);
    }
}
