<?php

namespace App\Services;

use App\DTO\CompetitionDTO;
use App\Interfaces\CompetitionRepositoryInterface;
use App\Models\Competition;
use App\Enums\CompetitionStatus;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class CompetitionService extends BaseService
{
    public function __construct(CompetitionRepositoryInterface $repository)
    {
        parent::__construct($repository);
    }

    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->getPaginatedWithFilters($filters, $perPage);
    }

    public function getById(int $id): ?Competition
    {
        return $this->repository->find($id);
    }

    public function createCompetition(CompetitionDTO $dto): Competition
    {
        $data = $dto->toArray();
        $data['status'] = CompetitionStatus::DRAFT;
        
        return $this->repository->create($data);
    }

    public function updateCompetition(int $id, CompetitionDTO $dto): Competition
    {
        $competition = $this->repository->find($id);
        
        if (!$competition) {
            throw ValidationException::withMessages(['id' => 'Concours introuvable.']);
        }
        
        // Block update if the competition is closed
        if ($competition->status === CompetitionStatus::CLOSED) {
            throw ValidationException::withMessages(['status' => 'Impossible de modifier un concours clôturé.']);
        }

        $this->repository->update($id, $dto->toArray());
        
        return $this->repository->find($id);
    }

    public function publish(int $id): Competition
    {
        $competition = $this->repository->find($id);
        
        if (!$competition) {
            throw ValidationException::withMessages(['id' => 'Concours introuvable.']);
        }
        
        if ($competition->status !== CompetitionStatus::DRAFT) {
            throw ValidationException::withMessages(['status' => 'Seul un concours en brouillon peut être publié.']);
        }

        $this->repository->update($id, [
            'status' => CompetitionStatus::PUBLISHED,
            'published_at' => now(),
        ]);
        
        return $this->repository->find($id);
    }

    public function unpublish(int $id): Competition
    {
        $competition = $this->repository->find($id);
        
        if (!$competition) {
            throw ValidationException::withMessages(['id' => 'Concours introuvable.']);
        }
        
        if (!in_array($competition->status, [CompetitionStatus::PUBLISHED, CompetitionStatus::OPEN])) {
            throw ValidationException::withMessages(['status' => 'Seul un concours publié ou ouvert peut être dépublié.']);
        }

        $this->repository->update($id, [
            'status' => CompetitionStatus::DRAFT,
            'published_at' => null,
        ]);
        
        return $this->repository->find($id);
    }

    public function delete(int $id): bool
    {
        $competition = $this->repository->find($id);
        
        if (!$competition) {
            throw ValidationException::withMessages(['id' => 'Concours introuvable.']);
        }
        
        return $this->repository->delete($id);
    }
}
