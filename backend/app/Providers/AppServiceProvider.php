<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Interfaces\UserRepositoryInterface;
use App\Repositories\UserRepository;
use App\Interfaces\CompetitionRepositoryInterface;
use App\Repositories\CompetitionRepository;
use App\Services\Sms\SmsGatewayInterface;
use App\Services\Sms\MockSmsGateway;
use App\Services\Payment\PaymentGatewayInterface;
use App\Services\Payment\MockMobileMoneyGateway;
use Illuminate\Support\Facades\Event;
use App\Events\ApplicationStatusChanged;
use App\Listeners\SendApplicationStatusNotification;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(CompetitionRepositoryInterface::class, CompetitionRepository::class);
        $this->app->bind(\App\Interfaces\DepartmentRepositoryInterface::class, \App\Repositories\DepartmentRepository::class);
        $this->app->bind(\App\Interfaces\JobOfferRepositoryInterface::class, \App\Repositories\JobOfferRepository::class);
        $this->app->bind(\App\Interfaces\ApplicationRepositoryInterface::class, \App\Repositories\ApplicationRepository::class);
        $this->app->bind(\App\Interfaces\ApplicationRepositoryInterface::class, \App\Repositories\ApplicationRepository::class);
        $this->app->bind(SmsGatewayInterface::class, MockSmsGateway::class);
        $this->app->bind(PaymentGatewayInterface::class, MockMobileMoneyGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return $user->hasRole(\App\Enums\RoleName::SuperAdmin->value) ? true : null;
        });

        Event::listen(
            ApplicationStatusChanged::class,
            SendApplicationStatusNotification::class,
        );
    }
}
