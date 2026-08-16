<?php

namespace App\Http\Requests\Application;

use Illuminate\Foundation\Http\FormRequest;

class CreateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_offer_id' => ['required', 'exists:job_offers,id'],
            'motivation_objet' => ['nullable', 'string', 'max:255'],
            'motivation_corps' => ['nullable', 'string', 'min:200', 'max:4000'],
        ];
    }

    public function messages(): array
    {
        return [
            'job_offer_id.unique' => 'Vous avez déjà soumis une candidature pour cette offre d\'emploi.',
            'motivation_corps.min' => 'La lettre de candidature doit comporter au moins 200 caractères.',
        ];
    }
}
