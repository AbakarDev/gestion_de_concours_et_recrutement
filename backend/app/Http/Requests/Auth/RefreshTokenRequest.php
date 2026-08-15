<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RefreshTokenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'refresh_token' => ['required', 'string', 'size:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'refresh_token.required' => 'Le jeton de rafraîchissement est obligatoire.',
            'refresh_token.size'     => 'Le jeton de rafraîchissement est invalide.',
        ];
    }
}
