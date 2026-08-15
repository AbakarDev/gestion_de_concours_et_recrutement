<?php

namespace App\Services\Payment;

interface PaymentGatewayInterface
{
    /**
     * Initialise un paiement.
     *
     * @param float $amount Le montant à payer.
     * @param string $reference Référence unique (ex: application_id_timestamp).
     * @param string $phoneNumber Numéro de téléphone (Mobile Money).
     * @return array Retourne un tableau avec la transaction_ref et/ou une URL de paiement.
     */
    public function initiatePayment(float $amount, string $reference, string $phoneNumber): array;

    /**
     * Vérifie la signature HMAC du webhook.
     *
     * @param array $payload Les données du webhook.
     * @param string $signature La signature reçue dans le header.
     * @return bool
     */
    public function verifyWebhookSignature(array $payload, string $signature): bool;
}
