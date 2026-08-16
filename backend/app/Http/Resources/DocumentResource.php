<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isJury = auth()->check() && auth()->user()->isJuryOnly();

        return [
            'id'          => $this->id,
            'type'        => $this->type,
            'type_label'  => \App\Enums\DocumentType::fromLegacy((string) $this->type)?->label() ?? $this->type,
            'path'        => $isJury ? null : $this->path,
            'url'         => $isJury ? null : ($this->path ? Storage::disk('public')->url($this->path) : null),
            'status'      => $this->status,
            'created_at'  => $this->created_at?->toIso8601String(),
            'uploaded_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

