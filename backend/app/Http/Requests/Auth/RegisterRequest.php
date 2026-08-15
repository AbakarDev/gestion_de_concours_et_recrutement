<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\pL\s\-\']+$/u'],
            'last_name'  => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\pL\s\-\']+$/u'],
            'email'      => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'   => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->numbers(),
            ],
            'nin'   => ['nullable', 'string', 'min:9', 'max:20', 'unique:users,nin'],
            'phone' => ['nullable', 'string', 'regex:/^\+?[0-9]{8,15}$/', 'unique:users,phone'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Le prénom est obligatoire.',
            'first_name.regex'    => 'Le prénom ne doit contenir que des lettres.',
            'last_name.required'  => 'Le nom est obligatoire.',
            'last_name.regex'     => 'Le nom ne doit contenir que des lettres.',
            'email.required'      => 'L\'adresse email est obligatoire.',
            'email.email'         => 'L\'adresse email doit être valide.',
            'email.unique'        => 'Cette adresse email est déjà utilisée.',
            'password.required'   => 'Le mot de passe est obligatoire.',
            'password.confirmed'  => 'La confirmation du mot de passe ne correspond pas.',
            'nin.unique'          => 'Ce numéro NIN est déjà utilisé.',
            'nin.min'             => 'Le NIN doit contenir au moins 9 caractères.',
            'phone.regex'         => 'Le numéro de téléphone n\'est pas valide.',
            'phone.unique'        => 'Ce numéro de téléphone est déjà utilisé.',
        ];
    }
}
