<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isJury = auth()->check() && auth()->user()->isJuryOnly();

        return [
            'id' => $this->id,
            'user' => $isJury ? null : [
                'id' => $this->user->id,
                'first_name' => $this->user->first_name,
                'last_name' => $this->user->last_name,
                'email' => $this->user->email,
                'nin' => $this->user->nin,
                'phone' => $this->user->phone,
            ],
            'job_offer' => [
                'id' => $this->jobOffer->id,
                'title' => $this->jobOffer->title,
                'competition_title' => $this->jobOffer->competition->title ?? null,
            ],
            // Le n° de dossier nominatif n'est jamais envoyé au jury-only.
            'application_number' => $isJury ? null : $this->application_number,
            'anonymat_number' => $this->anonymat_number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'admin_notes' => $isJury ? null : $this->admin_notes,
            'rejection_reason' => $isJury ? null : $this->rejection_reason,
            'submitted_at' => $isJury ? null : $this->submitted_at?->toIso8601String(),
            'documents' => DocumentResource::collection($this->whenLoaded('documents')),
            'scores' => $this->whenLoaded('scores'),
            'convocation_url' => $isJury ? null : (
                $this->relationLoaded('convocation') && $this->convocation
                    ? asset('storage/' . $this->convocation->pdf_path)
                    : null
            ),
            'status_history' => $this->whenLoaded('statusHistory', function () use ($isJury) {
                return $this->statusHistory
                    ->sortBy('created_at')
                    ->values()
                    ->map(fn ($entry) => [
                        'id' => $entry->id,
                        'from_status' => $entry->from_status,
                        'to_status' => $entry->to_status,
                        'reason' => $isJury ? null : $entry->reason,
                        'changed_by' => $isJury ? null : (
                            $entry->relationLoaded('changedBy') && $entry->changedBy
                                ? trim($entry->changedBy->first_name . ' ' . $entry->changedBy->last_name)
                                : null
                        ),
                        'created_at' => $entry->created_at?->toIso8601String(),
                    ]);
            }),
        ];
    }
}
