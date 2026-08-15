<?php

namespace App\DTO;

use Illuminate\Http\Request;

class JobOfferDTO
{
    public function __construct(
        public readonly int $competition_id,
        public readonly string $title,
        public readonly int $positions_count,
        public readonly ?string $location,
        public readonly ?array $requirements,
        public readonly ?string $description,
        public readonly bool $fee_required,
        public readonly ?float $fee_amount,
        public readonly ?string $closing_date,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            competition_id: $request->validated('competition_id'),
            title: $request->validated('title'),
            positions_count: $request->validated('positions_count'),
            location: $request->validated('location'),
            requirements: $request->validated('requirements'),
            description: $request->validated('description'),
            fee_required: $request->validated('fee_required') ?? false,
            fee_amount: $request->validated('fee_amount'),
            closing_date: $request->validated('closing_date'),
        );
    }

    public function toArray(): array
    {
        return [
            'competition_id' => $this->competition_id,
            'title' => $this->title,
            'positions_count' => $this->positions_count,
            'location' => $this->location,
            'requirements' => $this->requirements,
            'description' => $this->description,
            'fee_required' => $this->fee_required,
            'fee_amount' => $this->fee_amount,
            'closing_date' => $this->closing_date,
        ];
    }
}
