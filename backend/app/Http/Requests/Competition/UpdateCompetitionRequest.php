<?php

namespace App\Http\Requests\Competition;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompetitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $competitionId = $this->route('id') ?? $this->route('competition');

        return [
            'department_id'      => ['sometimes', 'required', 'exists:departments,id'],
            'title'              => ['sometimes', 'required', 'string', 'max:255'],
            'reference'          => ['sometimes', 'required', 'string', 'max:50', Rule::unique('competitions', 'reference')->ignore($competitionId)],
            'description'        => ['nullable', 'string'],
            'quota'              => ['sometimes', 'required', 'integer', 'min:1'],
            'required_documents' => ['nullable', 'array'],
            'required_documents.*'=> ['string', 'max:255'],
            'start_date'         => ['sometimes', 'required', 'date'],
            'end_date'           => ['sometimes', 'required', 'date', 'after:start_date'],
            'ministry'                => ['nullable', 'string', 'max:255'],
            'registration_open_date'  => ['nullable', 'date'],
            'registration_close_date' => ['nullable', 'date', 'after_or_equal:registration_open_date'],
            'fee_required'            => ['nullable', 'boolean'],
            'fee_amount'              => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
