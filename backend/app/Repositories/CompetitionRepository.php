<?php

namespace App\Repositories;

use App\Interfaces\CompetitionRepositoryInterface;
use App\Models\Competition;
use App\Enums\CompetitionStatus;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class CompetitionRepository extends BaseRepository implements CompetitionRepositoryInterface
{
    public function __construct(Competition $model)
    {
        parent::__construct($model);
    }

    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery()->with('department');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhereHas('department', function (Builder $dq) use ($search) {
                      $dq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['statuses']) && is_array($filters['statuses'])) {
            $query->whereIn('status', $filters['statuses']);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['date_from'])) {
            $query->where('start_date', '>=', $filters['date_from']);
        }
        
        if (!empty($filters['date_to'])) {
            $query->where('end_date', '<=', $filters['date_to']);
        }

        $sortField = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        
        // Ensure sorting by valid columns only
        $allowedSorts = ['id', 'title', 'start_date', 'end_date', 'created_at', 'status', 'quota'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        return $query->paginate($perPage);
    }

    public function getPublished(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->newQuery()
            ->with('department')
            ->whereIn('status', [CompetitionStatus::PUBLISHED, CompetitionStatus::OPEN])
            ->orderBy('start_date', 'desc')
            ->paginate($perPage);
    }
}
