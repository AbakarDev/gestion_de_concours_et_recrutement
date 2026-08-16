<?php

namespace App\Repositories;

use App\Interfaces\ApplicationRepositoryInterface;
use App\Models\Application;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ApplicationRepository extends BaseRepository implements ApplicationRepositoryInterface
{
    public function __construct(Application $model)
    {
        parent::__construct($model);
    }

    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery()
            ->with(['user', 'jobOffer', 'jobOffer.competition', 'documents', 'scores', 'statusHistory', 'convocation', 'payment']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function(Builder $q) use ($search) {
                $q->where('application_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function(Builder $uq) use ($search) {
                      $uq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('nin', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['search_anonymat'])) {
            $query->where('anonymat_number', 'like', '%'.$filters['search_anonymat'].'%');
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['statuses']) && is_array($filters['statuses'])) {
            $query->whereIn('status', $filters['statuses']);
        }

        if (!empty($filters['job_offer_id'])) {
            $query->where('job_offer_id', $filters['job_offer_id']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        $sortField = $filters['sort_by'] ?? 'submitted_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        
        $allowedSorts = ['id', 'application_number', 'status', 'submitted_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        return $query->paginate($perPage);
    }

    public function findByNumber(string $applicationNumber)
    {
        return $this->model->with(['user', 'jobOffer', 'documents', 'scores'])
            ->where('application_number', $applicationNumber)
            ->first();
    }
    
    public function find(int $id): ?Application
    {
        return $this->model->with([
            'user',
            'jobOffer.competition',
            'documents',
            'scores',
            'convocation',
            'statusHistory.changedBy',
            'payment',
        ])->find($id);
    }
}
