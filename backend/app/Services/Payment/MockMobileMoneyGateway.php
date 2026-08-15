<?php

namespace App\Services\Payment;

use Illuminate\Support\Str;

class MockMobileMoneyGateway implements PaymentGatewayInterface
{
    private string $secretKey = 'mock_secret_key_for_testing';

    public function initiatePayment(float $amount, string $reference, string $phoneNumber): array
    {
        // On simule une réponse de l'opérateur Mobile Money
        return [
            'success' => true,
            'transaction_ref' => 'MOCK_TXN_' . Str::upper(Str::random(10)),
            'message' => 'Paiement initié. Veuillez confirmer sur votre téléphone.',
            // Dans un vrai cas, on pourrait avoir un redirect_url
        ];
    }

    public function verifyWebhookSignature(array $payload, string $signature): bool
    {
        // On recrée la signature attendue à partir du payload et de la clé secrète
        $expectedSignature = hash_hmac('sha256', json_encode($payload), $this->secretKey);
        
        return hash_equals($expectedSignature, $signature);
    }
}
