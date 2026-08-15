import React, { useEffect, useState } from 'react';
import { Shield, Edit2, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { usersApi } from '../../api';
import { notify } from '../../lib/feedback';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../lib/roles';
import PageHeader from '../../components/ui/PageHeader';

const ROLES = [
  Role.SuperAdmin,
  Role.Administrateur,
  Role.ResponsableConcours,
  Role.Jury,
  Role.Recruteur,
  Role.Candidat,
];

export default function UsersPage() {
  const confirm = useConfirm();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role: Role.Administrateur,
  });

  useEffect(() => {
    const t = setTimeout(fetchUsers, 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async () => {
    try {
      const res = await usersApi.list({ search, per_page: 50 });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setCurrentUser(user);
    setSelectedRole(user.roles?.[0] || Role.Candidat);
    setShowRoleModal(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersApi.updateRole(currentUser.id, selectedRole);
      setShowRoleModal(false);
      notify.success('Rôle mis à jour');
      fetchUsers();
    } catch (err) {
      notify.error(err, 'Erreur lors de la mise à jour du rôle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersApi.create(createForm);
      setShowCreateModal(false);
      setCreateForm({
        first_name: '', last_name: '', email: '', password: '', phone: '', role: Role.Administrateur,
      });
      notify.success('Utilisateur créé');
      fetchUsers();
    } catch (err) {
      notify.error(err, 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    if (user.id === me?.id) {
      notify.error('Vous ne pouvez pas désactiver votre propre compte.');
      return;
    }
    const ok = await confirm({
      title: user.is_active ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?',
      confirmLabel: user.is_active ? 'Désactiver' : 'Activer',
      variant: user.is_active ? 'danger' : 'primary',
    });
    if (!ok) return;
    try {
      await usersApi.toggleActive(user.id);
      notify.success(user.is_active ? 'Compte désactivé' : 'Compte activé');
      fetchUsers();
    } catch (err) {
      notify.error(err, 'Action impossible.');
    }
  };

  if (loading) {
    return <div className="text-slate-800 text-center mt-10">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        kicker="Administration"
        title="Utilisateurs & rôles"
        subtitle="Créez des comptes staff, changez les rôles et activez ou désactivez les accès."
        actions={
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus size={18} /> Nouvel utilisateur
          </button>
        }
      />

      <div className="glass-card p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher (nom, e-mail, NNI)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Contact</th>
                <th>NNI</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <div>
                        <div className="text-slate-800 font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-xs text-slate-400">
                          {user.created_at ? `Inscrit le ${new Date(user.created_at).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-slate-600">{user.email}</div>
                    <div className="text-xs text-slate-400">{user.phone || '-'}</div>
                  </td>
                  <td className="font-mono text-slate-500 text-xs">{user.nin || 'Non renseigné'}</td>
                  <td>
                    <span className="badge badge-blue gap-1">
                      <Shield size={12} />
                      {user.roles?.[0] || 'Aucun rôle'}
                    </span>
                  </td>
                  <td>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {user.is_active !== false ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className="p-2 text-slate-500 hover:text-amber-700 bg-slate-50 rounded hover:bg-amber-50"
                        title={user.is_active !== false ? 'Désactiver' : 'Activer'}
                      >
                        {user.is_active !== false ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 text-slate-500 hover:text-blue-700 bg-slate-50 rounded hover:bg-blue-50"
                        title="Modifier le rôle"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Aucun utilisateur trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Modifier le rôle</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Accès de <span className="text-slate-900 font-bold">{currentUser?.first_name} {currentUser?.last_name}</span>.
            </p>
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full input-field">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50">
                  {submitting ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Nouvel utilisateur</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Prénom" className="input-field" value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} />
                <input required placeholder="Nom" className="input-field" value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} />
              </div>
              <input required type="email" placeholder="E-mail" className="input-field" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              <input type="tel" placeholder="Téléphone" className="input-field" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              <input required type="password" minLength={8} placeholder="Mot de passe (8 caractères min.)" className="input-field" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
              <select className="input-field" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as typeof createForm.role })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50">
                  {submitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
