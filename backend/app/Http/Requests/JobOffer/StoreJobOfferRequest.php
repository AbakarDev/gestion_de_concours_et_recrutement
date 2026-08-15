<?php

namespace App\Http\Requests\JobOffer;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'competition_id'  => ['required', 'exists:competitions,id'],
            'title'           => ['required', 'string', 'max:255'],
            'positions_count' => ['required', 'integer', 'min:1'],
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
