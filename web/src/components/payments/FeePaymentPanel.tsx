import { useState } from 'react';
import { paymentsApi } from '../../api';
import { notify } from '../../lib/feedback';

interface Props {
  applicationId: number;
  amount?: number | string | null;
  phoneDefault?: string | null;
  onPaid: () => void;
}

export default function FeePaymentPanel({ applicationId, amount, phoneDefault, onPaid }: Props) {
  const [phone, setPhone] = useState(phoneDefault || '+235');
  const [busy, setBusy] = useState(false);

  const label = amount
    ? `${Number(amount).toLocaleString('fr-FR')} FCFA`
    : 'frais de dossier';

  const pay = async () => {
    if (phone.trim().length < 8) {
      notify.warning('Numéro requis', 'Indiquez le numéro Mobile Money.');
      return;
    }
    setBusy(true);
    try {
      await paymentsApi.initiate({ application_id: applicationId, phone_number: phone.trim() });
      await paymentsApi.simulate({ application_id: applicationId });
      notify.success('Paiement confirmé', 'Simulation du callback opérateur (signature HMAC).');
      onPaid();
    } catch (err) {
      notify.error(err, 'Paiement impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-amber-950">Frais de dossier à régler ({label})</p>
      <p className="text-xs text-amber-800">
        L’instruction administrative est bloquée tant que le paiement n’est pas confirmé.
        Ici, Airtel/Moov est simulé : le webhook est signé HMAC, comme un vrai opérateur.
      </p>
      <input
        className="input-field bg-white"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="Numéro Mobile Money"
      />
      <button type="button" disabled={busy} onClick={pay} className="btn-primary text-sm disabled:opacity-50">
        {busy ? 'Confirmation…' : 'Payer via Mobile Money (simulation)'}
      </button>
    </div>
  );
}
