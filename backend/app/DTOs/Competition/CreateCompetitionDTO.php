<?php

namespace App\DTOs\Competition;

use Carbon\Carbon;

readonly class CreateCompetitionDTO
{
    public function __construct(
        public string $name,
        public ?string $description,
        public Carbon $startDate,
        public Carbon $endDate,
        public array $jobOffers
    ) {}
}
