import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, Landmark, GraduationCap, Briefcase, Users,
  ClipboardList, LogOut, Settings, Scale, MapPinned, Medal,
  Home, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/ui/NotificationBell';
import { Role } from '../lib/roles';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/admin', icon: LayoutGrid, label: 'Tableau de bord', end: true },
  { to: '/admin/departments', icon: Landmark, label: 'Départements', roles: [Role.SuperAdmin, Role.Administrateur, Role.ResponsableConcours] },
  { to: '/admin/competitions', icon: GraduationCap, label: 'Concours', roles: [Role.SuperAdmin, Role.Administrateur, Role.ResponsableConcours] },
  { to: '/admin/job-offers', icon: Briefcase, label: 'Postes / Offres', roles: [Role.SuperAdmin, Role.ResponsableConcours, Role.Recruteur] },
  { to: '/admin/applications', icon: ClipboardList, label: 'Candidatures', roles: [Role.SuperAdmin, Role.Administrateur, Role.Recruteur, Role.ResponsableConcours] },
  { to: '/admin/evaluations', icon: Scale, label: 'Jury — Notes', roles: [Role.SuperAdmin, Role.Jury] },
  { to: '/admin/ranking', icon: Medal, label: 'Classement', roles: [Role.SuperAdmin, Role.Jury, Role.ResponsableConcours, Role.Administrateur] },
  { to: '/admin/dispatch', icon: MapPinned, label: 'Dispatching', roles: [Role.SuperAdmin, Role.ResponsableConcours] },
  { to: '/admin/users', icon: Users, label: 'Utilisateurs & Rôles', roles: [Role.SuperAdmin] },
  { to: '/admin/settings', icon: Settings, label: 'Paramètres', roles: [Role.SuperAdmin] },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin_sidebar_collapsed') === '1');
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(r => hasRole(r));
  });

  const roleLabel = user?.roles?.[0] || 'Utilisateur';
  const toggleMenu = () => setCollapsed((v) => !v);

  return (
    <div className="app-shell">
      <div className="home-flag shrink-0" />
      <div className="flex flex-1 overflow-hidden">
        <motion.aside
          animate={{ width: collapsed ? 76 : 260 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className="app-sidebar flex flex-col flex-shrink-0 relative"
        >
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-5 border-b border-white/10 hover:bg-white/5 transition-colors"
            title="Retour à l'accueil"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-bold text-[10px]">eCR</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <p className="text-white font-semibold text-sm leading-tight">e-CR Tchad</p>
                  <p className="text-blue-200/50 text-[10px] uppercase tracking-wider mt-0.5">Administration</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="text-blue-200/50 text-[10px] uppercase tracking-wider mb-0.5">Connecté en tant que</p>
                <p className="text-xs font-semibold text-accent-400">{roleLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            {visibleItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-white/10 space-y-1">
            <div className={`flex items-center gap-3 px-2 py-2 rounded-xl ${!collapsed ? 'mb-1' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden flex-1 min-w-0"
                  >
                    <p className="text-white text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs truncate text-accent-400/90">{roleLabel}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? 'Déconnexion' : undefined}
              className="app-nav-link w-full hover:!text-red-300"
            >
              <LogOut size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Déconnexion
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              onClick={toggleMenu}
              title={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
              className="app-nav-link w-full"
            >
              {collapsed ? <PanelLeftOpen size={18} className="flex-shrink-0" /> : <PanelLeftClose size={18} className="flex-shrink-0" />}
              {!collapsed && <span>Fermer le menu</span>}
            </button>
          </div>
        </motion.aside>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="app-topbar">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={toggleMenu}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-[#1B4F8A] hover:bg-blue-50 shadow-sm shrink-0"
                aria-label={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
                title={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
              >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
              <div className="min-w-0">
                <p className="page-kicker">Administration</p>
                <p className="text-slate-800 font-semibold text-sm leading-tight truncate">Portail Concours et Recrutements Tchad</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 transition-colors"
              >
                <Home size={15} />
                <span className="hidden sm:inline">Accueil</span>
              </Link>
              <NotificationBell />
              {hasRole(Role.SuperAdmin) && (
                <Link
                  to="/admin/settings"
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all"
                  title="Paramètres"
                >
                  <Settings size={18} />
                </Link>
              )}
            </div>
          </header>

          <main className="app-main">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
