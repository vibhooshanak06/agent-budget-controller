import React, { useState, useContext } from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { listTeams, createTeam, updateTeam, deleteTeam } from '../api/teams.js';
import Spinner from '../components/UI/Spinner.jsx';
import ErrorState from '../components/UI/ErrorState.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import Card from '../components/UI/Card.jsx';
import ProgressBar from '../components/UI/ProgressBar.jsx';
import Badge from '../components/UI/Badge.jsx';
import Button from '../components/UI/Button.jsx';
import Modal from '../components/UI/Modal.jsx';
import ConfirmDialog from '../components/UI/ConfirmDialog.jsx';
import FormField, { Input } from '../components/UI/FormField.jsx';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCostShort } from '../utils/format.js';
import { ToastContext } from '../context/ToastContext.js';
import styles from './TablePage.module.css';
import formStyles from './FormPage.module.css';

const EMPTY_FORM = { name: '', slug: '', budget_limit: '' };

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function validateTeam(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.slug.trim()) errors.slug = 'Slug is required';
  else if (!/^[a-z0-9-]+$/.test(form.slug)) errors.slug = 'Slug must be lowercase letters, numbers, and hyphens only';
  if (!form.budget_limit) errors.budget_limit = 'Budget limit is required';
  else if (isNaN(form.budget_limit) || parseFloat(form.budget_limit) <= 0) errors.budget_limit = 'Must be a positive number';
  return errors;
}

export default function TeamsPage() {
  const { toast } = useContext(ToastContext);
  const { data, loading, error, execute } = useAsync(listTeams, []);

  const [modal, setModal]         = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing]     = useState(null); // team object being edited
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditing(null);
    setModal('create');
  };

  const openEdit = (team) => {
    setForm({ name: team.name, slug: team.slug, budget_limit: team.budgetLimit.toString() });
    setFormErrors({});
    setEditing(team);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-generate slug from name on create
      if (name === 'name' && modal === 'create') next.slug = slugify(value);
      return next;
    });
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSave = async () => {
    const errors = validateTeam(form);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), slug: form.slug.trim(), budget_limit: parseFloat(form.budget_limit) };
      if (modal === 'create') {
        await createTeam(payload);
        toast({ title: 'Team created', message: `"${payload.name}" is ready.`, type: 'success' });
      } else {
        await updateTeam(editing.id, payload);
        toast({ title: 'Team updated', type: 'success' });
      }
      closeModal();
      execute();
    } catch (err) {
      toast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTeam(deleteTarget.id);
      toast({ title: 'Team deleted', message: `"${deleteTarget.name}" was removed.`, type: 'success' });
      setDeleteTarget(null);
      execute();
    } catch (err) {
      toast({ title: 'Cannot delete', message: err.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner size={40} />;
  if (error) return <ErrorState error={error} onRetry={execute} />;

  const teams = data?.teams ?? [];

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Teams</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={14} aria-hidden="true" /> New Team
        </Button>
      </header>

      {!teams.length ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create a team to start controlling AI agent budgets."
          action={<Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} /> New Team</Button>}
        />
      ) : (
        <Card padding="none">
          <div className={styles.table} style={{ '--col-template': '2fr 2fr 1fr 1fr 100px' }}>
            <div className={styles.thead}>
              <div className={styles.th}>Name</div>
              <div className={styles.th}>Budget</div>
              <div className={styles.th}>Agents</div>
              <div className={styles.th}>Status</div>
              <div className={styles.th}></div>
            </div>
            <div className={styles.tbody}>
              {teams.map((t) => (
                <div key={t.id} className={styles.tr}>
                  <div className={styles.td}>
                    <div className={styles.name}>{t.name}</div>
                    <div className={styles.slug}>{t.slug}</div>
                  </div>
                  <div className={styles.td}>
                    <div className={styles.budget}>{formatCostShort(t.budgetUsed)} / {formatCostShort(t.budgetLimit)}</div>
                    <ProgressBar used={t.budgetUsed} limit={t.budgetLimit} height={4} />
                  </div>
                  <div className={styles.td}>{t.agents?.length ?? 0}</div>
                  <div className={styles.td}>
                    <Badge variant={t.status === 'active' ? 'success' : 'neutral'}>{t.status}</Badge>
                  </div>
                  <div className={`${styles.td} ${styles.actions}`}>
                    <button className={styles.iconBtn} onClick={() => openEdit(t)} title="Edit team" aria-label="Edit team">
                      <Pencil size={14} />
                    </button>
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteTarget(t)} title="Delete team" aria-label="Delete team">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal open={!!modal} title={modal === 'create' ? 'New Team' : 'Edit Team'} onClose={closeModal}>
        <div className={formStyles.form}>
          <FormField label="Team Name" required error={formErrors.name}>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Platform Engineering" autoFocus />
          </FormField>
          <FormField label="Slug" required error={formErrors.slug} hint="URL-friendly identifier — lowercase, hyphens only">
            <Input name="slug" value={form.slug} onChange={handleChange} placeholder="e.g. platform-eng" />
          </FormField>
          <FormField label="Budget Limit (USD)" required error={formErrors.budget_limit} hint="Total spend cap for all agents in this team">
            <Input name="budget_limit" type="number" min="0.01" step="0.01" value={form.budget_limit} onChange={handleChange} placeholder="e.g. 100.00" />
          </FormField>
          <div className={formStyles.actions}>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {modal === 'create' ? 'Create Team' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Team"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will fail if the team has agents. You must delete all agents first.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
