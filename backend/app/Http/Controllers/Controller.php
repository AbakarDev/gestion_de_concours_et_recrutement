<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="Recrutement Tchad API",
 *     version="1.0.0",
 *     description="API de la plateforme de recrutement du gouvernement tchadien. Conforme OWASP avec authentification JWT/Sanctum, OTP, RBAC Spatie.",
 *     @OA\Contact(
 *         name="Abakar Brahim Abakar",
 *         email="admin@recrute.td"
 *     ),
 *     @OA\License(
 *         name="Propriétaire",
 *         url="https://recrute.td"
 *     )
 * )
 *
 * @OA\Server(
 *     url="http://localhost:8000",
 *     description="Serveur de développement"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Entrez votre token Bearer obtenu via /api/auth/login"
 * )
 *
 * @OA\Schema(
 *     schema="ErrorResponse",
 *     @OA\Property(property="status", type="string", example="Error"),
 *     @OA\Property(property="message", type="string", example="Une erreur est survenue."),
 *     @OA\Property(property="errors", type="object", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="ValidationErrorResponse",
 *     @OA\Property(property="message", type="string", example="Les données fournies ne sont pas valides."),
 *     @OA\Property(property="errors", type="object",
 *         @OA\Property(property="field_name", type="array", @OA\Items(type="string", example="Ce champ est obligatoire."))
 *     )
 * )
 */
abstract class Controller
{
    use \Illuminate\Foundation\Auth\Access\AuthorizesRequests;
}
