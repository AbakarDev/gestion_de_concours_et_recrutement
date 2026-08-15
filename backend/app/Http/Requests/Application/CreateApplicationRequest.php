<?php

namespace App\Http\Requests\Application;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user() ? $this->user()->id : 1; // Fallback pour les tests locaux

        return [
            'job_offer_id' => [
                'required',
                'exists:job_offers,id',
                Rule::unique('applications')->where(function ($query) use ($userId) {
                    return $query->where('user_id', $userId);
                })
            ],
            // La validation des fichiers joints (CV, LM) se fera ici ultérieurement.
        ];
    }
    
    public function messages(): array
    {
        return [
            'job_offer_id.unique' => 'Vous avez déjà soumis une candidature pour cette offre d\'emploi.'
        ];
    }
}
