<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Department\CreateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Services\DepartmentService;
use App\DTO\DepartmentDTO;
use App\Interfaces\DepartmentRepositoryInterface;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    use ApiResponseTrait;

    private DepartmentService $departmentService;
    private DepartmentRepositoryInterface $departmentRepository;

    public function __construct(DepartmentService $departmentService, DepartmentRepositoryInterface $departmentRepository)
    {
        $this->departmentService = $departmentService;
        $this->departmentRepository = $departmentRepository;
    }

    public function index(): JsonResponse
    {
        $departments = $this->departmentRepository->all();
        return $this->successResponse(DepartmentResource::collection($departments), 'Départements récupérés avec succès.');
    }

    public function store(CreateDepartmentRequest $request): JsonResponse
    {
        $this->authorize('create', \App\Models\Department::class);
        $dto = DepartmentDTO::fromRequest($request);
        $department = $this->departmentService->createDepartment($dto);
        
        return $this->successResponse(new DepartmentResource($department), 'Département créé avec succès.', 201);
    }

    public function update(int $id, CreateDepartmentRequest $request): JsonResponse
    {
        $department = \App\Models\Department::findOrFail($id);
        $this->authorize('update', $department);
        $dto = DepartmentDTO::fromRequest($request);
        $this->departmentService->updateDepartment($id, $dto);
        
        return $this->successResponse(null, 'Département mis à jour avec succès.');
    }

    public function destroy(int $id): JsonResponse
    {
        $department = \App\Models\Department::findOrFail($id);
        $this->authorize('delete', $department);
        $this->departmentService->delete($id);
        
        return $this->successResponse(null, 'Département supprimé avec succès.');
    }
}
