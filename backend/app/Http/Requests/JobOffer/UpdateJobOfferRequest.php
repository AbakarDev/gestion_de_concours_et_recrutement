<?php

namespace App\Http\Requests\JobOffer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'competition_id'  => ['sometimes', 'required', 'exists:competitions,id'],
            'title'           => ['sometimes', 'required', 'string', 'max:255'],
            'positions_count' => ['sometimes', 'required', 'integer', 'min:1'],
            'location'        => ['nullable', 'string', 'max:255'],
            'requirements'    => ['nullable', 'array'],
            'requirements.*'  => ['string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'fee_required'    => ['nullable', 'boolean'],
            'fee_amount'      => ['nullable', 'numeric', 'min:0'],
            'closing_date'    => ['nullable', 'date'],
        ];
    }
}
