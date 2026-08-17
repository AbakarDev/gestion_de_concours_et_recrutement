import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const isDanger = options?.variant !== 'primary';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={options.description ? 'confirm-desc' : undefined}
            className="glass-card w-full max-w-md p-6 shadow-soft"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-xl shrink-0 ${isDanger ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 id="confirm-title" className="text-lg font-bold text-slate-900">
                  {options.title}
                </h3>
                {options.description && (
                  <p id="confirm-desc" className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {options.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => settle(false)}
                className="btn-ghost text-sm"
              >
                {options.cancelLabel || 'Annuler'}
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                className={isDanger
                  ? 'px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors'
                  : 'btn-primary text-sm'}
              >
                {options.confirmLabel || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
