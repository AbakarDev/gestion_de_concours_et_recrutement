<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Payment;
use App\Models\AuditLog;
use App\Services\Payment\MockMobileMoneyGateway;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    protected PaymentGatewayInterface $paymentGateway;

    public function __construct(PaymentGatewayInterface $paymentGateway)
    {
        $this->paymentGateway = $paymentGateway;
    }

    /**
     * @OA\Post(
     *     path="/api/payments/initiate",
     *     tags={"Payments"},
     *     summary="Initier un paiement Mobile Money pour une candidature",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"application_id", "phone_number"},
     *             @OA\Property(property="application_id", type="integer"),
     *             @OA\Property(property="phone_number", type="string")
     *         )
     *     )
     * )
     */
    public function initiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'application_id' => 'required|exists:applications,id',
            'phone_number'   => 'required|string|max:20',
        ]);

        $application = Application::with(['jobOffer.competition', 'payment'])->findOrFail($validated['application_id']);

        if ($application->user_id !== $request->user()->id
            && ! $request->user()->hasRole(\App\Enums\RoleName::SuperAdmin->value)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        // Check if payment already confirmed
        if ($application->payment && $application->payment->isConfirmed()) {
            return response()->json(['message' => 'Cette candidature est déjà payée.'], 422);
        }

        // Determine fee
        $feeAmount = $application->jobOffer->fee_amount ?? $application->jobOffer->competition?->fee_amount;
        
        if (!$feeAmount || $feeAmount <= 0) {
            return response()->json(['message' => 'Aucun frais n\'est requis pour cette candidature.'], 422);
        }

        $reference = 'APP_' . $application->id . '_' . time();

        try {
            DB::beginTransaction();

            $response = $this->paymentGateway->initiatePayment($feeAmount, $reference, $validated['phone_number']);

            $payment = Payment::updateOrCreate(
                ['application_id' => $application->id],
                [
                    'montant' => $feeAmount,
                    'provider' => 'mobile_money',
                    'transaction_ref' => $response['transaction_ref'],
                    'status' => 'pending',
                ]
            );

            AuditLog::record('payment.initiated', $payment);

            DB::commit();

            return response()->json([
                'status' => 'Success',
                'message' => $response['message'],
                'transaction_ref' => $response['transaction_ref']
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'initiation du paiement.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/payments/mock-webhook",
     *     tags={"Payments"},
     *     summary="Webhook de confirmation de paiement (Mock)",
     * )
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        $signature = $request->header('X-Webhook-Signature', '');

        if (!$this->paymentGateway->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['message' => 'Signature invalide.'], 403);
        }

        $transactionRef = $payload['transaction_ref'] ?? null;
        $status = $payload['status'] ?? null; // e.g. 'successful' or 'failed'

        if (!$transactionRef) {
            return response()->json(['message' => 'Transaction_ref manquant.'], 400);
        }

        $payment = Payment::where('transaction_ref', $transactionRef)->first();
        if (!$payment) {
            return response()->json(['message' => 'Paiement introuvable.'], 404);
        }

        DB::transaction(function () use ($payment, $status, $payload) {
            if ($status === 'successful') {
                $payment->update([
                    'status' => 'confirmed',
                    'confirmed_at' => now(),
                    'webhook_payload' => $payload,
                ]);
                AuditLog::record('payment.confirmed', $payment);
                
                // TODO: Générer reçu PDF en queue
                
            } else {
                $payment->update([
                    'status' => 'failed',
                    'failure_reason' => $payload['reason'] ?? 'Erreur opérateur',
                    'webhook_payload' => $payload,
                ]);
                AuditLog::record('payment.failed', $payment);
            }
        });

        return response()->json(['message' => 'Webhook traité avec succès.']);
    }

    /**
     * Simulation du callback opérateur (passerelle mock uniquement).
     * En production, seul le webhook signé de l'opérateur confirme le paiement.
     */
    public function simulate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'application_id' => 'required|exists:applications,id',
        ]);

        $application = Application::with('payment')->findOrFail($validated['application_id']);

        if ($application->user_id !== $request->user()->id
            && ! $request->user()->hasRole(\App\Enums\RoleName::SuperAdmin->value)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if (! $this->paymentGateway instanceof MockMobileMoneyGateway) {
            return response()->json(['message' => 'La simulation n\'est disponible qu\'avec la passerelle mock.'], 422);
        }

        $payment = $application->payment;
        if (! $payment) {
            return response()->json(['message' => 'Initiez d\'abord le paiement Mobile Money.'], 422);
        }

        if ($payment->isConfirmed()) {
            return response()->json(['message' => 'Cette candidature est déjà payée.'], 422);
        }

        $payload = [
            'transaction_ref' => $payment->transaction_ref,
            'status' => 'successful',
        ];

        $webhook = Request::create('/api/payments/mock-webhook', 'POST', $payload);
        $webhook->headers->set('X-Webhook-Signature', $this->paymentGateway->signWebhook($payload));

        return $this->webhook($webhook);
    }
}
