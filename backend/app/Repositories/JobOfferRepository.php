<?php

namespace App\Repositories;

use App\Interfaces\JobOfferRepositoryInterface;
use App\Models\JobOffer;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class JobOfferRepository extends BaseRepository implements JobOfferRepositoryInterface
{
    public function __construct(JobOffer $model)
    {
        parent::__construct($model);
    }

    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery()->with('competition');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhereHas('competition', function (Builder $cq) use ($search) {
                      $cq->where('title', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['competition_id'])) {
            $query->where('competition_id', $filters['competition_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['statuses']) && is_array($filters['statuses'])) {
            $query->whereIn('status', $filters['statuses']);
        }

        if (!empty($filters['location'])) {
            $query->where('location', 'like', '%'.$filters['location'].'%');
        }

        $sortField = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        
        $allowedSorts = ['id', 'title', 'positions_count', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        return $query->paginate($perPage);
    }
}
