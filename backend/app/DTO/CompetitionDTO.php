<?php

namespace App\DTO;

use Illuminate\Http\Request;
use Carbon\Carbon;

class CompetitionDTO
{
    public function __construct(
        public readonly int $department_id,
        public readonly string $title,
        public readonly string $reference,
        public readonly ?string $description,
        public readonly int $quota,
        public readonly ?array $required_documents,
        public readonly string $start_date,
        public readonly string $end_date,
        public readonly ?string $ministry,
        public readonly ?string $registration_open_date,
        public readonly ?string $registration_close_date,
        public readonly bool $fee_required,
        public readonly ?float $fee_amount,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            department_id: $request->validated('department_id'),
            title: $request->validated('title'),
            reference: $request->validated('reference'),
            description: $request->validated('description'),
            quota: $request->validated('quota'),
            required_documents: \App\Enums\DocumentType::normalizeList($request->validated('required_documents')),
            start_date: $request->validated('start_date'),
            end_date: $request->validated('end_date'),
            ministry: $request->validated('ministry'),
            registration_open_date: $request->validated('registration_open_date'),
            registration_close_date: $request->validated('registration_close_date'),
            fee_required: $request->validated('fee_required') ?? false,
            fee_amount: $request->validated('fee_amount'),
        );
    }

    public function toArray(): array
    {
        return [
            'department_id' => $this->department_id,
            'title' => $this->title,
            'reference' => $this->reference,
            'description' => $this->description,
            'quota' => $this->quota,
            'required_documents' => $this->required_documents,
            'start_date' => Carbon::parse($this->start_date)->format('Y-m-d'),
            'end_date' => Carbon::parse($this->end_date)->format('Y-m-d'),
            'ministry' => $this->ministry,
            'registration_open_date' => $this->registration_open_date ? Carbon::parse($this->registration_open_date)->format('Y-m-d') : null,
            'registration_close_date' => $this->registration_close_date ? Carbon::parse($this->registration_close_date)->format('Y-m-d') : null,
            'fee_required' => $this->fee_required,
            'fee_amount' => $this->fee_amount,
        ];
    }
}
