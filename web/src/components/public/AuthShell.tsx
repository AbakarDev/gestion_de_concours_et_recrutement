import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Landmark } from 'lucide-react';
import PublicHeader from './PublicHeader';

const DEFAULT_POINTS = [
  { icon: Lock, text: 'Copies anonymes — le jury ne voit jamais votre identité' },
  { icon: ShieldCheck, text: 'Notes scellées par cachet HMAC, horodatées' },
  { icon: Landmark, text: 'Portail public des concours et des recrutements' },
];

type AuthShellProps = {
  children: ReactNode;
  headerRight?: ReactNode;
  kicker?: string;
  title?: string;
  subtitle?: string;
  wide?: boolean;
};

export default function AuthShell({
  children,
  headerRight,
  kicker = 'Portail Concours et Recrutements Tchad',
  title = 'Espace sécurisé',
  subtitle = 'Connexion au portail de gestion des concours et des recrutements.',
  wide = false,
}: AuthShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="min-h-screen flex flex-col bg-slate-50"
    >
      <PublicHeader right={headerRight} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        <aside className="auth-aside hidden lg:flex lg:col-span-5 relative flex-col justify-between p-10 xl:p-14 text-white">
          <div className="hero-mesh" />
          <div className="hero-grid" />
          <div className="relative z-10">
            <p className="home-kicker mb-4">{kicker}</p>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight mb-4">
              {title}
            </h1>
            <p className="text-blue-100/80 text-[15px] leading-relaxed max-w-md">
              {subtitle}
            </p>
          </div>
          <ul className="relative z-10 space-y-4 mt-10">
            {DEFAULT_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-blue-50/90">
                <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-accent-400" />
                </span>
                <span className="pt-2 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
          <p className="relative z-10 text-[12px] text-blue-200/50 mt-10">
            Portail Concours et Recrutements Tchad · N'Djaména
          </p>
        </aside>

        <div className="lg:col-span-7 flex items-center justify-center px-4 py-10 sm:px-8">
          <div className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'}`}>{children}</div>
        </div>
      </div>
    </motion.div>
  );
}
