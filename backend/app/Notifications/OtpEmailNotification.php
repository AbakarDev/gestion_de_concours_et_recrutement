<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OtpEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $otpCode,
        private readonly int $expiresInMinutes = 10
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Code de vérification - ' . config('app.name'))
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("Votre code de vérification est :")
            ->line("**{$this->otpCode}**")
            ->line("Ce code est valide pendant {$this->expiresInMinutes} minutes.")
            ->line("Si vous n'avez pas demandé ce code, ignorez ce message.")
            ->salutation("Cordialement, l'équipe " . config('app.name'));
    }
}
