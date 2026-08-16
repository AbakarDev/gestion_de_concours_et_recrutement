<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @OA\Schema(
 *     schema="CompetitionResource",
 *     title="Competition Resource",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="department_id", type="integer", example=2),
 *     @OA\Property(property="department_name", type="string", example="Ministère de la Santé"),
 *     @OA\Property(property="title", type="string", example="Concours de recrutement 2026"),
 *     @OA\Property(property="reference", type="string", example="C-ABCD-2026"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="quota", type="integer", example=100),
 *     @OA\Property(property="required_documents", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="start_date", type="string", format="date", example="2026-08-01"),
 *     @OA\Property(property="end_date", type="string", format="date", example="2026-09-01"),
 *     @OA\Property(property="status", type="string", example="draft"),
 *     @OA\Property(property="status_label", type="string", example="Brouillon"),
 *     @OA\Property(property="published_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 */
class CompetitionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'department_id' => $this->department_id,
            'department_name' => $this->whenLoaded('department', fn() => $this->department->name),
            'title' => $this->title,
            'reference' => $this->reference,
            'description' => $this->description,
            'quota' => $this->quota,
            'required_documents' => \App\Enums\DocumentType::normalizeList($this->required_documents),
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'registration_open_date' => $this->registration_open_date?->format('Y-m-d'),
            'registration_close_date' => $this->registration_close_date?->format('Y-m-d'),
            'fee_required' => (bool) $this->fee_required,
            'fee_amount' => $this->fee_amount,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'published_at' => $this->published_at?->toIso8601String(),
            'results_published_at' => $this->results_published_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
