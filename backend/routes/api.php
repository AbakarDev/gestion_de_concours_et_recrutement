<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Enums\RoleName;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompetitionController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\JobOfferController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ConvocationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DispatchController;
use App\Http\Controllers\Api\PrescreeningController;
use App\Http\Controllers\Api\RankingController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\SettingController;

/*
|--------------------------------------------------------------------------
| Auth Routes (Rate Limited)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::middleware('throttle:auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    });

    Route::middleware('throttle:otp')->group(function () {
        Route::post('/otp/send', [AuthController::class, 'sendOtp']);
        Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
    });

    Route::middleware('throttle:token_refresh')->group(function () {
        Route::post('/refresh', [AuthController::class, 'refreshToken']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('/departments', [DepartmentController::class, 'index']);
Route::get('/competitions', [CompetitionController::class, 'index']);
Route::get('/job-offers', [JobOfferController::class, 'index']);

Route::post('/payments/mock-webhook', [PaymentController::class, 'webhook']);

Route::get('/convocations/verify/{token}', [ConvocationController::class, 'verify']);
Route::get('/public/settings', [SettingController::class, 'publicIndex']);
Route::get('/public/stats', [SettingController::class, 'publicStats']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes — rôles déclarés explicitement (Spatie guard sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Utilisateurs & rôles — SuperAdmin uniquement
    Route::get('/users', [UserController::class, 'index'])
        ->middleware(RoleName::route([RoleName::SuperAdmin]));
    Route::post('/users', [UserController::class, 'store'])
        ->middleware(RoleName::route([RoleName::SuperAdmin]));
    Route::put('/users/{id}/role', [UserController::class, 'updateRole'])
        ->middleware(RoleName::route([RoleName::SuperAdmin]));
    Route::patch('/users/{id}/active', [UserController::class, 'toggleActive'])
        ->middleware(RoleName::route([RoleName::SuperAdmin]));

    Route::get('/settings', [SettingController::class, 'index'])
        ->middleware(RoleName::route([RoleName::SuperAdmin]));
    Route::put('/settings', [SettingController::class, 'update'])
        ->middleware(RoleName::route([RoleName::SuperAdmin]));

    // Départements — lecture publique ci-dessus ; CUD SuperAdmin
    Route::post('/departments', [DepartmentController::class, 'store'])
        ->middleware(RoleName::route(RoleName::departmentManagers()));
    Route::put('/departments/{id}', [DepartmentController::class, 'update'])
        ->middleware(RoleName::route(RoleName::departmentManagers()));
    Route::delete('/departments/{id}', [DepartmentController::class, 'destroy'])
        ->middleware(RoleName::route(RoleName::departmentManagers()));

    // Concours
    Route::post('/competitions', [CompetitionController::class, 'store'])
        ->middleware(RoleName::route(RoleName::competitionManagers()));
    Route::get('/competitions/{id}', [CompetitionController::class, 'show']);
    Route::put('/competitions/{id}', [CompetitionController::class, 'update'])
        ->middleware(RoleName::route(RoleName::competitionManagers()));
    Route::delete('/competitions/{id}', [CompetitionController::class, 'destroy'])
        ->middleware(RoleName::route(RoleName::competitionManagers()));
    Route::post('/competitions/{competition}/publish', [CompetitionController::class, 'publish'])
        ->middleware(RoleName::route(RoleName::competitionManagers()));
    Route::post('/competitions/{competition}/unpublish', [CompetitionController::class, 'unpublish'])
        ->middleware(RoleName::route(RoleName::competitionManagers()));
    Route::post('/competitions/{competition}/close', [CompetitionController::class, 'close'])
        ->middleware(RoleName::route(RoleName::competitionManagers()));
    Route::post('/competitions/{competition}/publish-results', [CompetitionController::class, 'publishResults'])
        ->middleware(RoleName::route(RoleName::competitionManagers()));
    Route::post('/competitions/{id}/dispatch', [DispatchController::class, 'dispatchCandidates'])
        ->middleware(RoleName::route(RoleName::dispatchers()));

    // Offres
    Route::post('/job-offers', [JobOfferController::class, 'store'])
        ->middleware(RoleName::route(RoleName::jobOfferManagers()));
    Route::get('/job-offers/{id}', [JobOfferController::class, 'show']);
    Route::put('/job-offers/{id}', [JobOfferController::class, 'update'])
        ->middleware(RoleName::route(RoleName::jobOfferManagers()));
    Route::delete('/job-offers/{id}', [JobOfferController::class, 'destroy'])
        ->middleware(RoleName::route(RoleName::jobOfferManagers()));
    Route::post('/job-offers/{id}/publish', [JobOfferController::class, 'publish'])
        ->middleware(RoleName::route(RoleName::jobOfferManagers()));
    Route::post('/job-offers/{jobOffer}/apply', [ApplicationController::class, 'store'])
        ->middleware(RoleName::route([RoleName::Candidat]));

    // Candidatures
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store'])
        ->middleware(RoleName::route([RoleName::Candidat]));
    Route::get('/applications/{id}', [ApplicationController::class, 'show']);
    Route::post('/applications/{id}/status', [ApplicationController::class, 'updateStatus'])
        ->middleware(RoleName::route(RoleName::applicationInstructors()));
    Route::patch('/applications/{id}/status', [ApplicationController::class, 'updateStatus'])
        ->middleware(RoleName::route(RoleName::applicationInstructors()));
    Route::post('/applications/{id}/scores', [ApplicationController::class, 'storeScore'])
        ->middleware(RoleName::route(RoleName::evaluators()));
    Route::post('/applications/{id}/prescreening', [PrescreeningController::class, 'updateDecision'])
        ->middleware(RoleName::route(RoleName::prescreeners()));
    Route::post('/applications/{id}/prescreening/lock', [PrescreeningController::class, 'lockDecision'])
        ->middleware(RoleName::route(RoleName::prescreeners()));

    // Paiement — propriétaire du dossier contrôlé dans le contrôleur
    Route::post('/payments/initiate', [PaymentController::class, 'initiate'])
        ->middleware(RoleName::route([RoleName::Candidat, RoleName::SuperAdmin]));

    // Classement & stats
    Route::get('/job-offers/{jobOfferId}/ranking', [RankingController::class, 'rankingByJobOffer'])
        ->middleware(RoleName::route(RoleName::rankingViewers()));
    Route::get('/admin/dashboard-stats', [RankingController::class, 'dashboardStats'])
        ->middleware(RoleName::route(RoleName::dashboardViewers()));

    // Documents — filtrage propriétaire dans le contrôleur / DocumentPolicy
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents/upload', [DocumentController::class, 'upload']);
    Route::get('/documents/{id}/view', [DocumentController::class, 'view']);
    Route::get('/documents/{id}/download', [DocumentController::class, 'download']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

    Route::get('/exports/competitions', [ExportController::class, 'competitions'])
        ->middleware(RoleName::route(RoleName::exporters()));
    Route::get('/exports/job-offers', [ExportController::class, 'jobOffers'])
        ->middleware(RoleName::route(RoleName::exporters()));
    Route::get('/exports/applications', [ExportController::class, 'applications'])
        ->middleware(RoleName::route(RoleName::exporters()));
    Route::get('/exports/ranking/{jobOfferId}', [ExportController::class, 'ranking'])
        ->middleware(RoleName::route(RoleName::rankingViewers()));
});
