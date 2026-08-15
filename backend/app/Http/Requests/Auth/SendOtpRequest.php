<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'   => ['required', 'string', 'email', 'max:255', 'exists:users,email'],
            'channel' => ['required', 'string', 'in:sms,email'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'L\'adresse email est obligatoire.',
            'email.exists'   => 'Aucun compte associé à cette adresse email.',
            'channel.in'     => 'Le canal doit être "sms" ou "email".',
        ];
    }
}
