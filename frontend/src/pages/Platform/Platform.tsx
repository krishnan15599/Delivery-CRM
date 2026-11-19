import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Eye, EyeOff, RefreshCw, PauseCircle, PlayCircle } from 'lucide-react';
import {
  PageHeader,
  Button,
  Input,
  FormField,
  Modal,
  ConfirmDialog,
  useToast,
} from '../../components/common';
import {
  platformService,
  apiErrorMessage,
  type PlatformOrganization,
  type CreateOrganizationInput,
} from '../../services/platformService';

const EMPTY_FORM = {
  name: '',
  code: '',
  adminName: '',
  adminEmail: '',
  adminPhone: '',
  temporaryPassword: '',
};

/** "Quick Kart Logistics" -> "QUICKKARTLOGISTI" (letters/numbers, max 20) */
const codeFromName = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);

const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/**
 * Platform owner (SuperAdmin) home: every business using the CRM.
 * Create a business with its first Admin, and suspend / re-activate businesses.
 */
export const Platform: React.FC = () => {
  const toast = useToast();

  const [orgs, setOrgs] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [codeEdited, setCodeEdited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const [statusTarget, setStatusTarget] = useState<PlatformOrganization | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setOrgs(await platformService.listOrganizations());
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Could not load businesses.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCodeEdited(false);
    setShowPassword(false);
    setErrors({});
    setIsCreateOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Business name is required';
    if (!/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(form.code)) errs.code = '2-20 letters, numbers or dashes';
    if (!form.adminName.trim()) errs.adminName = "Admin's name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) errs.adminEmail = 'Enter a valid email';
    if (form.temporaryPassword.length < 8) errs.temporaryPassword = 'Minimum 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const input: CreateOrganizationInput = {
      name: form.name.trim(),
      code: form.code,
      admin: {
        name: form.adminName.trim(),
        email: form.adminEmail.trim().toLowerCase(),
        phone: form.adminPhone.trim() || undefined,
        temporaryPassword: form.temporaryPassword,
      },
    };

    try {
      setCreating(true);
      const { message } = await platformService.createOrganization(input);
      toast.success(message);
      setIsCreateOpen(false);
      loadOrgs();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create the business.'));
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    const next = statusTarget.status === 'Active' ? 'Suspended' : 'Active';
    try {
      setChangingStatus(true);
      await platformService.setStatus(statusTarget.id, next);
      toast.success(`${statusTarget.name} is now ${next}.`);
      setStatusTarget(null);
      loadOrgs();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not change the business status.'));
    } finally {
      setChangingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        subtitle="Every company using Delivery CRM. Each business only ever sees its own data."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadOrgs}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Create business
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 min-w-[720px]">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">First Admin</th>
                <th className="px-4 py-3 text-right">Users</th>
                <th className="px-4 py-3 text-right">Agents</th>
                <th className="px-4 py-3 text-right">Deliveries</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading businesses...</td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-rose-600">{loadError}</td>
                </tr>
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No businesses yet. Click "Create business" to add the first one.
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate">{org.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{org.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {org.primaryAdmin ? (
                        <>
                          <span className="text-slate-900 block">{org.primaryAdmin.name}</span>
                          <span className="text-[11px] text-slate-400">{org.primaryAdmin.email}</span>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{org.counts.users}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{org.counts.agents}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{org.counts.deliveries}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          org.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(org.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant={org.status === 'Active' ? 'outline' : 'success'}
                        size="xs"
                        leftIcon={
                          org.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />
                        }
                        onClick={() => setStatusTarget(org)}
                      >
                        {org.status === 'Active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create business */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !creating && setIsCreateOpen(false)}
        title="Create business"
        description="Creates the business, its Main Team, and its first Admin login."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="create-business-form" isLoading={creating}>
              Create business
            </Button>
          </div>
        }
      >
        <form id="create-business-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Business name" required error={errors.name}>
              <Input
                value={form.name}
                placeholder="e.g. QuickKart Logistics"
                error={Boolean(errors.name)}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, code: codeEdited ? f.code : codeFromName(name) }));
                }}
              />
            </FormField>
            <FormField label="Business code" required error={errors.code} helperText="Short unique ID, e.g. QKART">
              <Input
                value={form.code}
                placeholder="QKART"
                error={Boolean(errors.code)}
                className="font-mono uppercase"
                onChange={(e) => {
                  setCodeEdited(true);
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20) }));
                }}
              />
            </FormField>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">First Admin</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full name" required error={errors.adminName}>
                <Input
                  value={form.adminName}
                  error={Boolean(errors.adminName)}
                  onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  value={form.adminPhone}
                  placeholder="+91 ..."
                  onChange={(e) => setForm((f) => ({ ...f, adminPhone: e.target.value }))}
                />
              </FormField>
              <FormField label="Email (their login)" required error={errors.adminEmail} className="sm:col-span-2">
                <Input
                  type="email"
                  value={form.adminEmail}
                  error={Boolean(errors.adminEmail)}
                  onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                />
              </FormField>
              <FormField
                label="Temporary password"
                required
                error={errors.temporaryPassword}
                helperText="Share it with the Admin privately."
                className="sm:col-span-2"
              >
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.temporaryPassword}
                    placeholder="Minimum 8 characters"
                    error={Boolean(errors.temporaryPassword)}
                    className="pr-10"
                    onChange={(e) => setForm((f) => ({ ...f, temporaryPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>
            </div>
          </div>
        </form>
      </Modal>

      {/* Suspend / activate */}
      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        title={statusTarget?.status === 'Active' ? `Suspend ${statusTarget?.name}?` : `Activate ${statusTarget?.name}?`}
        message={
          statusTarget?.status === 'Active'
            ? 'Everyone in this business is signed out on their next action and cannot sign in until you activate it again. No data is deleted.'
            : 'Users of this business will be able to sign in again.'
        }
        confirmText={statusTarget?.status === 'Active' ? 'Suspend' : 'Activate'}
        variant={statusTarget?.status === 'Active' ? 'danger' : 'primary'}
        isLoading={changingStatus}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
};

export default Platform;
