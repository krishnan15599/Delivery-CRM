import React, { useEffect, useState, useCallback } from 'react';
import {
  Store,
  Plus,
  Key,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Card,
  SearchBar,
  StatusBadge,
  Modal,
  FormField,
  Input,
  Select,
  EmptyState,
  useToast,
} from '../../components/common';
import {
  merchantService,
  type Merchant,
  type MerchantApiKey,
  type CreateMerchantInput,
} from '../../services/merchantService';
import { organizationService } from '../../services/organizationService';
import { useAuth } from '../../context/AuthContext';

export const Merchants: React.FC = () => {
  const toast = useToast();
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      toast[type](message);
    },
    [toast]
  );
  const { role } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create / Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateMerchantInput>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    pickupAddress: '',
    city: 'Chennai',
    pincode: '',
    defaultTeamId: '',
    status: 'Active',
  });

  // API Keys Modal
  const [keyMerchant, setKeyMerchant] = useState<Merchant | null>(null);
  const [apiKeys, setApiKeys] = useState<MerchantApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('Production Store Key');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [mList, tList] = await Promise.all([
        merchantService.getMerchants(search ? { search } : undefined),
        organizationService.getTeams().catch(() => []),
      ]);
      setMerchants(mList);
      setTeams((tList || []).map((t: any) => ({ id: t.id, name: t.name })));
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to load merchants', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      pickupAddress: '',
      city: 'Chennai',
      pincode: '',
      defaultTeamId: teams[0]?.id || '',
      status: 'Active',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (m: Merchant) => {
    setEditing(m);
    setForm({
      name: m.name,
      contactName: m.contact_name || '',
      email: m.email || '',
      phone: m.phone,
      pickupAddress: m.pickup_address,
      city: m.city || 'Chennai',
      pincode: m.pincode || '',
      defaultTeamId: m.default_team_id || '',
      status: m.status,
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.pickupAddress.trim()) {
      showToast('Shop name, phone, and pickup address are required.', 'error');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await merchantService.updateMerchant(editing.id, form);
        showToast('Merchant updated successfully', 'success');
      } else {
        await merchantService.createMerchant(form);
        showToast('Merchant created successfully', 'success');
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to save merchant', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Merchant) => {
    if (!window.confirm(`Delete merchant "${m.name}"? Their API keys will also be removed.`)) {
      return;
    }
    try {
      await merchantService.deleteMerchant(m.id);
      showToast('Merchant deleted', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to delete merchant', 'error');
    }
  };

  const openKeysModal = async (m: Merchant) => {
    setKeyMerchant(m);
    setGeneratedKey(null);
    setCopiedKey(false);
    setKeysLoading(true);
    try {
      const keys = await merchantService.getApiKeys(m.id);
      setApiKeys(keys);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to load API keys', 'error');
    } finally {
      setKeysLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!keyMerchant) return;
    try {
      const created = await merchantService.createApiKey(
        keyMerchant.id,
        newKeyName.trim() || 'Default Key'
      );
      setGeneratedKey(created.apiKey || null);
      setCopiedKey(false);
      const keys = await merchantService.getApiKeys(keyMerchant.id);
      setApiKeys(keys);
      showToast('API key generated!', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to generate API key', 'error');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!keyMerchant) return;
    try {
      await merchantService.revokeApiKey(keyMerchant.id, keyId);
      setApiKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, status: 'Revoked' } : k))
      );
      showToast('API key revoked', 'info');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to revoke key', 'error');
    }
  };

  const handleCopyKey = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merchants & E-Commerce Stores"
        subtitle="Manage partner shops sending orders into your courier hubs and generate their API keys."
        actions={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            Add Merchant
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search merchant name, phone, city..."
            className="w-full sm:w-80"
          />
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading merchants...</div>
        ) : merchants.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No merchants yet"
            description="Add an e-commerce shop so they can send orders directly via API."
            action={
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
                Add First Merchant
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Shop / Merchant</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Pickup Address</th>
                  <th className="py-3 px-4">Default Hub</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {merchants.map((m) => {
                  const hubName =
                    teams.find((t) => t.id === m.default_team_id)?.name || 'Default Hub';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{m.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{m.contact_name || '-'}</div>
                        <div className="text-xs text-slate-500">{m.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-700 truncate">{m.pickup_address}</div>
                        <div className="text-xs text-slate-500">
                          {m.city}
                          {m.pincode ? ` - ${m.pincode}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{hubName}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={m.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Key className="w-3.5 h-3.5" />}
                          onClick={() => openKeysModal(m)}
                        >
                          API Keys
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => openEditModal(m)}>
                          Edit
                        </Button>
                        {role === 'Admin' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(m)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Merchant Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add Merchant'}
        description="Configure the e-commerce shop details and default sorting hub."
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Shop / Merchant Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. FreshKart Store"
                required
              />
            </FormField>
            <FormField label="Phone Number" required>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98400 12345"
                required
              />
            </FormField>
            <FormField label="Contact Person">
              <Input
                value={form.contactName || ''}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Store Manager"
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ops@freshkart.in"
              />
            </FormField>
          </div>

          <FormField label="Pickup Address" required>
            <Input
              value={form.pickupAddress}
              onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
              placeholder="Warehouse / Shop address for first-mile pickup"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="City">
              <Input
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Chennai"
              />
            </FormField>
            <FormField label="Pincode">
              <Input
                value={form.pincode || ''}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                placeholder="600032"
              />
            </FormField>
            <FormField label="Default Hub (Team)">
              <Select
                value={form.defaultTeamId || ''}
                onChange={(e) => setForm({ ...form, defaultTeamId: e.target.value })}
                options={[
                  { value: '', label: 'Organization Default Hub' },
                  ...teams.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editing ? 'Save Changes' : 'Create Merchant'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* API Keys Modal */}
      <Modal
        isOpen={Boolean(keyMerchant)}
        onClose={() => setKeyMerchant(null)}
        title={`API Keys — ${keyMerchant?.name || ''}`}
        description="Generate API keys for POST /api/integrations/orders"
        size="lg"
      >
        <div className="space-y-5">
          {/* Generate new key bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key label (e.g. Shopify Prod)"
              className="flex-1"
            />
            <Button variant="primary" leftIcon={<Key className="w-4 h-4" />} onClick={handleGenerateKey}>
              Generate Key
            </Button>
          </div>

          {/* Newly generated raw key (shown once) */}
          {generatedKey && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <ShieldAlert className="w-4 h-4" />
                Copy this API key now — it will not be shown again!
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white px-3 py-2 rounded border border-amber-200 font-mono break-all">
                  {generatedKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  onClick={handleCopyKey}
                >
                  {copiedKey ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="text-[11px] text-amber-900 font-mono pt-1">
                Test command: <code>node backend/scripts/test-merchant-order.js {generatedKey}</code>
              </div>
            </div>
          )}

          {/* Existing keys list */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {keysLoading ? (
              <div className="p-6 text-center text-sm text-slate-500">Loading keys...</div>
            ) : apiKeys.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No API keys yet. Generate one above.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Prefix</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apiKeys.map((k) => (
                    <tr key={k.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{k.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{k.key_prefix}...</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={k.status === 'Active' ? 'Active' : 'Inactive'} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {k.status === 'Active' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => handleRevokeKey(k.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Merchants;
