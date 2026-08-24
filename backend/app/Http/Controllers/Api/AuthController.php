<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\DTO\ForgotPasswordDTO;
use App\DTO\LoginDTO;
use App\DTO\RegisterDTO;
use App\DTO\ResetPasswordDTO;
use App\DTO\SendOtpDTO;
use App\DTO\VerifyOtpDTO;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * @OA\Tag(
 *     name="Auth",
 *     description="Authentification, OTP, Mot de passe oublié, Tokens"
 * )
 */
class AuthController extends Controller
{
    use ApiResponseTrait;

    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    // ─── Register ───────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/auth/register",
     *     tags={"Auth"},
     *     summary="Inscription d'un nouveau candidat",
     *     description="Crée un nouveau compte candidat et retourne les tokens d'authentification",
     *     operationId="register",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"first_name","last_name","email","password","password_confirmation"},
     *             @OA\Property(property="first_name", type="string", example="Abakar"),
     *             @OA\Property(property="last_name", type="string", example="Brahim"),
     *             @OA\Property(property="email", type="string", format="email", example="abakar@example.td"),
     *             @OA\Property(property="password", type="string", format="password", example="P@ssw0rd!2026"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="P@ssw0rd!2026"),
     *             @OA\Property(property="nin", type="string", example="123456789", nullable=true),
     *             @OA\Property(property="phone", type="string", example="+23566000000", nullable=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Inscription réussie",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="message", type="string", example="Inscription réussie."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="user", ref="#/components/schemas/UserResource"),
     *                 @OA\Property(property="access_token", type="string"),
     *                 @OA\Property(property="refresh_token", type="string"),
     *                 @OA\Property(property="token_type", type="string", example="Bearer"),
     *                 @OA\Property(property="expires_in", type="integer", example=3600)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=422, description="Erreur de validation")
     * )
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $dto = RegisterDTO::fromRequest($request);
            $result = $this->authService->registerCandidate(
                $dto,
                $request->ip(),
                $request->userAgent()
            );

            return $this->successResponse([
                'user' => new UserResource($result['user']),
                'access_token' => $result['access_token'],
                'refresh_token' => $result['refresh_token'],
                'token_type' => 'Bearer',
                'expires_in' => 3600,
            ], 'Inscription réussie.', 201);
        } catch (\Exception $e) {
            Log::error('Registration failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    // ─── Login ──────────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/auth/login",
     *     tags={"Auth"},
     *     summary="Connexion utilisateur",
     *     description="Authentifie un utilisateur et retourne les tokens",
     *     operationId="login",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", format="email", example="abakar@example.td"),
     *             @OA\Property(property="password", type="string", format="password", example="P@ssw0rd!2026")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Connexion réussie",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="message", type="string", example="Connexion réussie."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="user", ref="#/components/schemas/UserResource"),
     *                 @OA\Property(property="access_token", type="string"),
     *                 @OA\Property(property="refresh_token", type="string"),
     *                 @OA\Property(property="token_type", type="string", example="Bearer"),
     *                 @OA\Property(property="expires_in", type="integer", example=3600)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=422, description="Identifiants incorrects"),
     *     @OA\Response(response=429, description="Trop de tentatives")
     * )
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $dto = LoginDTO::fromRequest($request);
        $result = $this->authService->login(
            $dto,
            $request->ip(),
            $request->userAgent()
        );

        return $this->successResponse([
            'user' => new UserResource($result['user']),
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 'Connexion réussie.');
    }

    // ─── Logout ─────────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/auth/logout",
     *     tags={"Auth"},
     *     summary="Déconnexion",
     *     description="Révoque le token courant et tous les refresh tokens",
     *     operationId="logout",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Déconnexion réussie",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="message", type="string", example="Déconnexion réussie.")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout(
            $request->user(),
            $request->ip(),
            $request->userAgent()
        );

        return $this->successResponse(null, 'Déconnexion réussie.');
    }

    // ─── Send OTP ───────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/auth/otp/send",
     *     tags={"Auth"},
     *     summary="Envoyer un code OTP",
     *     description="Envoie un code OTP par SMS ou Email",
     *     operationId="sendOtp",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","channel"},
     *             @OA\Property(property="email", type="string", format="email", example="abakar@example.td"),
     *             @OA\Property(property="channel", type="string", enum={"sms","email"}, example="email")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="OTP envoyé",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="message", type="string", example="Code de vérification envoyé.")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Erreur de validation"),
     *     @OA\Response(response=429, description="Trop de tentatives")
     * )
     */
    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $this->authService->sendOtp($dto, $request->ip(), $request->userAgent());

        // Jamais renvoyer le code dans la réponse HTTP : seul le canal e-mail/SMS du titulaire le reçoit.
        return $this->successResponse(
            null,
            'Si un compte existe pour cette adresse, un code de vérification a été envoyé.'
        );
    }

    // ─── Verify OTP ─────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/auth/otp/verify",
     *     tags={"Auth"},
     *     summary="Vérifier un code OTP",
     *     description="Vérifie le code OTP et retourne les tokens si valide",
     *     operationId="verifyOtp",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","otp_code","channel"},
     *             @OA\Property(property="email", type="string", format="email", example="abakar@example.td"),
     *             @OA\Property(property="otp_code", type="string", example="123456"),
     *             @OA\Property(property="channel", type="string", enum={"sms","email"}, example="email")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="OTP vérifié avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="message", type="string", example="Vérification réussie."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="user", ref="#/components/schemas/UserResource"),
     *                 @OA\Property(property="access_token", type="string"),
     *                 @OA\Property(property="refresh_token", type="string"),
     *                 @OA\Property(property="token_type", type="string", example="Bearer"),
     *                 @OA\Property(property="expires_in", type="integer", example=3600)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=422, description="Code OTP invalide"),
     *     @OA\Response(response=429, description="Trop de tentatives")
     * )
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $dto = VerifyOtpDTO::fromRequest($request);
        $result = $this->authService->verifyOtp($dto, $request->ip(), $request->userAgent());

        return $this->successResponse([
            'user' => new UserResource($result['user']),
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 'Vérification réussie.');
    }

    // ─── Forgot Password ────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/auth/forgot-password",
     *     tags={"Auth"},
     *     summary="Mot de passe oublié",
     *     description="Envoie un email de réinitialisation du mot de passe",
     *     operationId="forgotPassword",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email"},
     *             @OA\Property(property="email", type="string", format="email", example="abakar@example.td")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Email envoyé (toujours retourné même si l'email n'existe pas)",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="message", type="string", example="Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé.")
     *         )
     *     ),
     *     @OA\Response(response=429, description="Trop de tentatives")
     * )
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $dto = ForgotPasswordDTO::fromRequest($request);
        $this->authService->forgotPassword($dto, $request->ip(), $request->userAgent());

        // OWASP: Always return success to prevent user enumeration
        return $this->successResponse(
            null,
            'Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé.'
        );
    }

    // ─── Reset Password ─────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/auth/reset-password",
     *     tags={"Auth"},
     *     summary="Réinitialiser le mot de passe",
     *     description="Réinitialise le mot de passe avec un token valide",
     *     operationId="resetPassword",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","token","password","password_confirmation"},
     *             @OA\Property(property="email", type="string", format="email", example="abakar@example.td"),
     *             @OA\Property(property="token", type="string", example="abc123..."),
     *             @OA\Property(property="password", type="string", format="password", example="NewP@ss2026!"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="NewP@ss2026!")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Mot de passe réinitialisé",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="message", type="string", example="Mot de passe réinitialisé avec succès.")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Token invalide ou expiré")
     * )
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $dto = ResetPasswordDTO::fromRequest($request);
        $this->authService->resetPassword($dto, $request->ip(), $request->userAgent());

        return $this->successResponse(null, 'Mot de passe réinitialisé avec succès.');
    }

    // ─── Refresh Token ──────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/auth/refresh",
     *     tags={"Auth"},
     *     summary="Rafraîchir le token",
     *     description="Échange un refresh token contre un nouveau couple access/refresh token (rotation)",
     *     operationId="refreshToken",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"refresh_token"},
     *             @OA\Property(property="refresh_token", type="string", example="abc123...64chars")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Token rafraîchi",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="message", type="string", example="Token rafraîchi avec succès."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="user", ref="#/components/schemas/UserResource"),
     *                 @OA\Property(property="access_token", type="string"),
     *                 @OA\Property(property="refresh_token", type="string"),
     *                 @OA\Property(property="token_type", type="string", example="Bearer"),
     *                 @OA\Property(property="expires_in", type="integer", example=3600)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=422, description="Refresh token invalide")
     * )
     */
    public function refreshToken(RefreshTokenRequest $request): JsonResponse
    {
        $result = $this->authService->refreshToken(
            $request->validated('refresh_token'),
            $request->ip(),
            $request->userAgent()
        );

        return $this->successResponse([
            'user' => new UserResource($result['user']),
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 'Token rafraîchi avec succès.');
    }

    // ─── Current User ───────────────────────────────────────────────

    /**
     * @OA\Get(
     *     path="/api/auth/me",
     *     tags={"Auth"},
     *     summary="Utilisateur courant",
     *     description="Retourne les informations de l'utilisateur authentifié",
     *     operationId="me",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Profil utilisateur",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="Success"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="user", ref="#/components/schemas/UserResource")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('roles', 'permissions');

        return $this->successResponse([
            'user' => new UserResource($user),
        ]);
    }
}
