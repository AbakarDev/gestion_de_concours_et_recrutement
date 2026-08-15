<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;

class MockSmsGateway implements SmsGatewayInterface
{
    public function send(string $to, string $message): bool
    {
        // Dans une vraie implémentation, on ferait un appel API Http::post()
        // Ici on simule l'envoi en logguant l'action.
        Log::info("MockSmsGateway: Envoi d'un SMS à [{$to}] - Contenu : {$message}");
        
        return true;
    }
}
