<?php

namespace App\Http\Requests\Competition;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompetitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_id'      => ['required', 'exists:departments,id'],
            'title'              => ['required', 'string', 'max:255'],
            'reference'          => ['required', 'string', 'max:50', 'unique:competitions,reference'],
            'description'        => ['nullable', 'string'],
            'quota'              => ['required', 'integer', 'min:1'],
            'required_documents' => ['nullable', 'array'],
            'required_documents.*'=> ['string', 'max:255'],
            'start_date'         => ['required', 'date', 'after_or_equal:today'],
            'end_date'           => ['required', 'date', 'after:start_date'],
            'ministry'                => ['nullable', 'string', 'max:255'],
            'registration_open_date'  => ['nullable', 'date'],
            'registration_close_date' => ['nullable', 'date', 'after_or_equal:registration_open_date'],
            'fee_required'            => ['nullable', 'boolean'],
            'fee_amount'              => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
