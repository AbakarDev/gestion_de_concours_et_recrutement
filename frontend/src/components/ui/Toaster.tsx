import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={4200}
      offset={80}
      toastOptions={{
        className: 'font-sans',
      }}
      style={{ zIndex: 200 }}
    />
  );
}
