import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Edit2, Plus, Search, UserCheck, UserX, Trash2, KeyRound, Pencil } from 'lucide-react';
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

const GROUP_LABELS: Record<string, string> = {
  applications: 'Candidatures',
  audit: 'Journal d’audit',
  competitions: 'Concours',
  departments: 'Organisations',
  documents: 'Documents',
  job_offers: 'Offres',
  results: 'Résultats',
  roles: 'Rôles',
  users: 'Utilisateurs',
};

const ACTION_LABELS: Record<string, string> = {
  view: 'Consulter',
  create: 'Créer',
  edit: 'Modifier',
  delete: 'Supprimer',
  upload: 'Téléverser',
  download: 'Télécharger',
  validate: 'Valider / rejeter',
  evaluate: 'Noter (jury)',
  preselect: 'Présélectionner',
  publish: 'Publier',
  quota: 'Gérer les quotas',
};

function groupPermission(name: string) {
  const [group] = name.split('.');
  return group || 'autres';
}

function permissionLabel(name: string) {
  const action = name.split('.')[1] || name;
  return ACTION_LABELS[action] || action;
}

export default function UsersPage() {
  const confirm = useConfirm();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [catalog, setCatalog] = useState<{ permissions: string[]; roles: Record<string, string[]> }>({
    permissions: [],
    roles: {},
  });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role: Role.Administrateur,
  });
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    usersApi.permissionsCatalog()
      .then((res) => setCatalog(res.data.data || { permissions: [], roles: {} }))
      .catch(() => { /* ignore */ });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 250);
    return () => clearTimeout(t);
  }, [search, roleFilter, page]);

  const fetchUsers = async () => {
    try {
      const res = await usersApi.list({
        search: search || undefined,
        role: roleFilter || undefined,
        per_page: 15,
        page,
      });
      setUsers(res.data.data || []);
      setTotalPages(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      notify.error(err, 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  const rolePermissions = useMemo(() => {
    const roleName = currentUser?.roles?.[0];
    return roleName ? (catalog.roles[roleName] || []) : [];
  }, [catalog.roles, currentUser]);

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const p of catalog.permissions) {
      const g = groupPermission(p);
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    }
    return groups;
  }, [catalog.permissions]);

  const handleOpenEdit = (user: any) => {
    setCurrentUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleOpenRole = (user: any) => {
    setCurrentUser(user);
    setSelectedRole(user.roles?.[0] || Role.Candidat);
    setShowRoleModal(true);
  };

  const handleOpenPermissions = (user: any) => {
    setCurrentUser(user);
    setSelectedPerms(user.direct_permissions || []);
    setShowPermModal(true);
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

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone: editForm.phone,
      };
      if (editForm.password.trim()) payload.password = editForm.password;
      await usersApi.update(currentUser.id, payload);
      setShowEditModal(false);
      notify.success('Compte mis à jour');
      fetchUsers();
    } catch (err) {
      notify.error(err, 'Mise à jour impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersApi.syncPermissions(currentUser.id, selectedPerms);
      setShowPermModal(false);
      notify.success('Permissions directes enregistrées');
      fetchUsers();
    } catch (err) {
      notify.error(err, 'Mise à jour des permissions impossible.');
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

  const handleDelete = async (user: any) => {
    if (user.id === me?.id) {
      notify.error('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    const ok = await confirm({
      title: 'Supprimer cet utilisateur ?',
      description: `${user.first_name} ${user.last_name} (${user.email}) sera définitivement retiré.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await usersApi.remove(user.id);
      notify.success('Utilisateur supprimé');
      fetchUsers();
    } catch (err) {
      notify.error(err, 'Suppression impossible.');
    }
  };

  const togglePerm = (name: string) => {
    setSelectedPerms((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  };

  if (loading) {
    return <div className="text-slate-800 text-center mt-10">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        kicker="Administration"
        title="Utilisateurs & rôles"
        subtitle="Créez des comptes staff, changez les rôles, permissions et activez ou désactivez les accès."
        actions={
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus size={18} /> Nouvel utilisateur
          </button>
        }
      />

      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher (nom, e-mail, NNI)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field md:w-56"
          >
            <option value="">Tous les rôles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
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
                          {user.direct_permissions?.length ? ` · ${user.direct_permissions.length} perm. directe(s)` : ''}
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
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 text-slate-500 hover:text-blue-700 bg-slate-50 rounded hover:bg-blue-50"
                        title="Modifier le compte"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenRole(user)}
                        className="p-2 text-slate-500 hover:text-blue-700 bg-slate-50 rounded hover:bg-blue-50"
                        title="Modifier le rôle"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenPermissions(user)}
                        className="p-2 text-slate-500 hover:text-indigo-700 bg-slate-50 rounded hover:bg-indigo-50"
                        title="Permissions directes"
                      >
                        <KeyRound size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className="p-2 text-slate-500 hover:text-amber-700 bg-slate-50 rounded hover:bg-amber-50"
                        title={user.is_active !== false ? 'Désactiver' : 'Activer'}
                      >
                        {user.is_active !== false ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 text-slate-500 hover:text-red-700 bg-slate-50 rounded hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
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

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
          <span className="text-sm text-slate-400">{total} utilisateur(s) · page {page} / {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Modifier le compte</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input required className="input-field" placeholder="Prénom" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                <input required className="input-field" placeholder="Nom" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
              </div>
              <input required type="email" className="input-field" placeholder="E-mail" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              <input type="tel" className="input-field" placeholder="Téléphone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              <input type="password" minLength={8} className="input-field" placeholder="Nouveau mot de passe (optionnel)" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50">
                  {submitting ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              {(catalog.roles[selectedRole] || []).length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-44 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                    Inclus dans ce rôle ({catalog.roles[selectedRole].length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(catalog.roles[selectedRole] || []).map((p) => (
                      <span key={p} className="inline-flex text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 whitespace-nowrap">
                        {GROUP_LABELS[groupPermission(p)] || groupPermission(p)} — {permissionLabel(p)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

      {showPermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-xl p-6 max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Permissions</h3>
            <p className="text-slate-500 mb-4 text-sm">
              {currentUser?.first_name} {currentUser?.last_name}
              <span className="text-slate-400"> · </span>
              rôle <span className="font-semibold text-slate-800">{currentUser?.roles?.[0] || 'aucun'}</span>
            </p>

            <form onSubmit={handleSyncPermissions} className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                {rolePermissions.length > 0 ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Déjà inclus dans le rôle
                    </p>
                    <p className="text-xs text-blue-800/70 mb-3">
                      Ces droits viennent du rôle. Ils ne se modifient pas ici.
                    </p>
                    <ul className="space-y-2">
                      {rolePermissions.map((name) => (
                        <li key={name} className="flex items-center gap-2 text-sm text-blue-950">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>
                            <span className="font-medium">{GROUP_LABELS[groupPermission(name)] || groupPermission(name)}</span>
                            <span className="text-blue-800/60"> — </span>
                            {permissionLabel(name)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-1">Droits supplémentaires</p>
                  <p className="text-xs text-slate-500 mb-3">
                    Cochez uniquement ce que vous voulez ajouter en plus du rôle.
                  </p>
                  <div className="space-y-3">
                    {Object.entries(groupedCatalog).map(([group, perms]) => {
                      const extras = perms.filter((name) => !rolePermissions.includes(name));
                      if (extras.length === 0) return null;
                      return (
                        <div key={group} className="border border-slate-200 rounded-xl p-3">
                          <p className="text-sm font-semibold text-slate-700 mb-2">
                            {GROUP_LABELS[group] || group}
                          </p>
                          <div className="space-y-1">
                            {extras.map((name) => {
                              const checked = selectedPerms.includes(name);
                              return (
                                <label
                                  key={name}
                                  className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer ${
                                    checked ? 'bg-indigo-50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-300"
                                    checked={checked}
                                    onChange={() => togglePerm(name)}
                                  />
                                  <span className="text-sm text-slate-800">{permissionLabel(name)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowPermModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50">
                  {submitting ? 'Enregistrement…' : 'Enregistrer'}
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
