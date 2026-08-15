<?php

namespace App\Actions;

use App\Models\JobOffer;
use App\Enums\CompetitionStatus;
use Illuminate\Validation\ValidationException;

class PublishJobOfferAction extends BaseAction
{
    public function execute(JobOffer $jobOffer): JobOffer
    {
        if ($jobOffer->status !== CompetitionStatus::DRAFT) {
            throw ValidationException::withMessages(['status' => 'Seule une offre en brouillon peut être publiée.']);
        }

        $jobOffer->update([
            'status' => CompetitionStatus::PUBLISHED,
        ]);

        return $jobOffer->fresh();
    }
}
