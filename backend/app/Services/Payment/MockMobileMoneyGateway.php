<?php

namespace App\Services\Payment;

use Illuminate\Support\Str;

class MockMobileMoneyGateway implements PaymentGatewayInterface
{
    public const WEBHOOK_SECRET = 'mock_secret_key_for_testing';

    public function initiatePayment(float $amount, string $reference, string $phoneNumber): array
    {
        return [
            'success' => true,
            'transaction_ref' => 'MOCK_TXN_' . Str::upper(Str::random(10)),
            'message' => 'Paiement initié. Veuillez confirmer sur votre téléphone.',
        ];
    }

    public function signWebhook(array $payload): string
    {
        return hash_hmac('sha256', json_encode($payload), self::WEBHOOK_SECRET);
    }

    public function verifyWebhookSignature(array $payload, string $signature): bool
    {
        return hash_equals($this->signWebhook($payload), $signature);
    }
}
