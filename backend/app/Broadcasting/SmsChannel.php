<?php

namespace App\Broadcasting;

use Illuminate\Notifications\Notification;
use App\Services\Sms\SmsGatewayInterface;

class SmsChannel
{
    protected SmsGatewayInterface $smsGateway;

    public function __construct(SmsGatewayInterface $smsGateway)
    {
        $this->smsGateway = $smsGateway;
    }

    /**
     * Send the given notification.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toSms')) {
            return;
        }

        $message = $notification->toSms($notifiable);

        if (!$message->to) {
            // Fallback sur le téléphone du notifiable si non précisé explicitement
            if (isset($notifiable->phone)) {
                $message->to($notifiable->phone);
            } else {
                return; // Pas de numéro
            }
        }

        $this->smsGateway->send($message->to, $message->content);
    }
}
