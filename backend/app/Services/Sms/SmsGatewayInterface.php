<?php

namespace App\Services\Sms;

interface SmsGatewayInterface
{
    /**
     * Envoie un SMS à un numéro donné.
     *
     * @param string $to Le numéro de téléphone du destinataire.
     * @param string $message Le contenu du message.
     * @return bool True si envoyé, false sinon.
     */
    public function send(string $to, string $message): bool;
}
