<?php

namespace App\Notifications;

use App\Models\Application;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Broadcasting\SmsChannel;
use App\Broadcasting\Messages\SmsMessage;

class ApplicationStatusNotification extends Notification
{
    public Application $application;
    public string $oldStatus;
    public string $newStatus;

    /**
     * Create a new notification instance.
     */
    public function __construct(Application $application, string $oldStatus, string $newStatus)
    {
        $this->application = $application;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail', SmsChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $statusLabel = $this->application->status->label();
        $appName = config('app.name');

        $message = (new MailMessage)
            ->subject("Mise à jour de votre candidature - {$appName}")
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("Le statut de votre candidature n° {$this->application->application_number} a été mis à jour.")
            ->line("Nouveau statut : **{$statusLabel}**.");

        if ($this->application->status->value === 'rejected' && $this->application->rejection_reason) {
            $message->line("Motif : " . $this->application->rejection_reason);
        }

        if ($this->application->status->value === 'accepted') {
            $message->line("Votre dossier a été validé. Vous pouvez dès à présent télécharger votre convocation depuis votre espace candidat.");
            $message->action('Accéder à mon espace', url('/candidat/dashboard'));
        } else {
            $message->action('Voir ma candidature', url('/candidat/dashboard'));
        }

        return $message->line("Merci de votre confiance.");
    }

    /**
     * Get the array representation of the notification (Database).
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'application_id' => $this->application->id,
            'application_number' => $this->application->application_number,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'rejection_reason' => $this->application->rejection_reason,
            'message' => "Votre candidature est passée au statut : " . $this->application->status->label(),
        ];
    }

    /**
     * Get the SMS representation of the notification.
     */
    public function toSms(object $notifiable): SmsMessage
    {
        $statusLabel = $this->application->status->label();
        $text = "Recrutement: Votre candidature {$this->application->application_number} est désormais {$statusLabel}.";
        
        return (new SmsMessage())
            ->to($notifiable->phone)
            ->content($text);
    }
}
