<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email', 'max:255', 'exists:users,email'],
            'otp_code' => ['required', 'string', 'size:6', 'regex:/^[0-9]{6}$/'],
            'channel'  => ['required', 'string', 'in:sms,email'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'    => 'L\'adresse email est obligatoire.',
            'email.exists'      => 'Aucun compte associé à cette adresse email.',
            'otp_code.required' => 'Le code OTP est obligatoire.',
            'otp_code.size'     => 'Le code OTP doit contenir exactement 6 chiffres.',
            'otp_code.regex'    => 'Le code OTP doit être composé uniquement de chiffres.',
            'channel.in'        => 'Le canal doit être "sms" ou "email".',
        ];
    }
}
