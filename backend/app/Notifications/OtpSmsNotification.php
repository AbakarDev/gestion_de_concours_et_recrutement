<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OtpSmsNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $otpCode,
        private readonly int $expiresInMinutes = 10
    ) {}

    /**
     * SMS channel — in production, replace 'mail' with a real SMS driver
     * (e.g., Vonage/Nexmo, Twilio, or custom channel).
     * For now, we log the SMS content via mail for development/testing.
     */
    public function via(object $notifiable): array
    {
        // TODO: Replace with ['sms'] or custom SMS channel in production
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('[SMS Simulation] Code OTP - ' . config('app.name'))
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("[SIMULATION SMS au {$notifiable->phone}]")
            ->line("Votre code OTP : **{$this->otpCode}**")
            ->line("Valide pendant {$this->expiresInMinutes} minutes.")
            ->salutation("Cordialement, l'équipe " . config('app.name'));
    }
}
