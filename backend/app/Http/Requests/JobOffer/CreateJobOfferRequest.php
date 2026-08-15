<?php

namespace App\Http\Requests\JobOffer;

use Illuminate\Foundation\Http\FormRequest;

class CreateJobOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Protégé ultérieurement
    }

    public function rules(): array
    {
        return [
            'competition_id' => ['required', 'exists:competitions,id'],
            'title' => ['required', 'string', 'max:255'],
            'positions_count' => ['nullable', 'integer', 'min:1'],
            'location' => ['nullable', 'string', 'max:255'],
            'requirements' => ['nullable', 'array'],
        ];
    }
}
