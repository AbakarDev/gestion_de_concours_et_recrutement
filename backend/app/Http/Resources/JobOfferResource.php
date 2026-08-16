<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @OA\Schema(
 *     schema="JobOfferResource",
 *     title="Job Offer Resource",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="competition_id", type="integer", example=1),
 *     @OA\Property(property="competition_title", type="string", example="Concours Police"),
 *     @OA\Property(property="title", type="string", example="Officier de Police"),
 *     @OA\Property(property="positions_count", type="integer", example=50),
 *     @OA\Property(property="location", type="string", example="N'Djamena"),
 *     @OA\Property(property="requirements", type="object",
 *         @OA\AdditionalProperties(type="string")
 *     ),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 */
class JobOfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'competition_id' => $this->competition_id,
            'competition_title' => $this->whenLoaded('competition', fn() => $this->competition->title),
            'title' => $this->title,
            'description' => $this->description,
            'positions_count' => $this->positions_count,
            'location' => $this->location,
            'requirements' => $this->requirements,
            'required_documents' => $this->when(
                $this->relationLoaded('competition') && $this->competition,
                fn () => \App\Enums\DocumentType::normalizeList($this->competition->required_documents ?? [])
            ),
            'fee_required' => (bool) $this->fee_required,
            'fee_amount' => $this->fee_amount,
            'closing_date' => $this->closing_date?->format('Y-m-d'),
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
