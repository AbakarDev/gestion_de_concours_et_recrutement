<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $token
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $resetUrl = "{$frontendUrl}/reset-password?token={$this->token}&email={$notifiable->email}";

        return (new MailMessage)
            ->subject('Réinitialisation du mot de passe - ' . config('app.name'))
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("Vous avez demandé la réinitialisation de votre mot de passe.")
            ->action('Réinitialiser le mot de passe', $resetUrl)
            ->line("Ce lien est valide pendant 60 minutes.")
            ->line("Si vous n'avez pas fait cette demande, aucune action n'est nécessaire.")
            ->salutation("Cordialement, l'équipe " . config('app.name'));
    }
}
