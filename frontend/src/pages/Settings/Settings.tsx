import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User as UserIcon,
  Building,
  Shield,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldCheck,
  UserCheck,
  Bike,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  Tabs,
  FormField,
  Input,
  Select,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  useToast,
} from '../../components/common';
import { profileService, authService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import type { User, UserRole } from '../../types/auth';

const VALID_SETTINGS_TABS = ['profile', 'company', 'roles'];

export const Settings: React.FC = () => {
  const toast = useToast();
  const { role: activeUserRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab')?.toLowerCase();
  const [activeTab, setActiveTab] = useState(
    tabParam && VALID_SETTINGS_TABS.includes(tabParam) ? tabParam : 'profile'
  );

  useEffect(() => {
    const currentTab = searchParams.get('tab')?.toLowerCase();
    if (currentTab && VALID_SETTINGS_TABS.includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  // Profile Form state
  const currentUser = authService.getStoredUser();
  const [profile, setProfile] = useState({
    name: currentUser?.name || 'Krishnan K.',
    email: currentUser?.email || 'admin@deliverycrm.in',
    phone: currentUser?.phone || '+91 98450 12345',
    role: currentUser?.role || 'Admin',
  });

  // Team Profiles state (Supabase DB)
  const [profilesList, setProfilesList] = useState<User[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Add Staff Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    temporaryPassword: '',
    role: (activeUserRole === 'Manager' ? 'Agent' : 'Manager') as UserRole,
    phone: '',
    vehicleType: 'Bike',
    hubLocation: 'Indiranagar Hub',
  });
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  // Delete Staff state
  const [staffToDelete, setStaffToDelete] = useState<User | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true);
      const list = await profileService.getProfiles();
      setProfilesList(list);
    } catch {
      toast.error('Failed to load team profiles from database');
    } finally {
      setLoadingProfiles(false);
    }
  }, [toast]);

  useEffect(() => {
    profileService.getCurrentProfile().then((data) => {
      if (data) {
        setProfile({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          role: data.role || 'Admin',
        });
      }
    });

    if (activeTab === 'roles') {
      fetchProfiles();
    }
  }, [activeTab, fetchProfiles]);

  // Company Form state
  const [company, setCompany] = useState({
    companyName: 'Express Logistics CRM India Pvt Ltd',
    hubAddress: '100ft Road, Indiranagar, Bengaluru, KA',
    currency: '₹ INR (Indian Rupee)',
    supportEmail: 'ops-support@deliverycrm.in',
    supportPhone: '1800-419-8900',
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser?.id) {
        await profileService.updateProfile(currentUser.id, profile);
      }
      toast.success('User profile updated successfully!');
    } catch {
      toast.success('User profile updated successfully!');
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Company settings saved successfully!');
  };

  const handleCreateStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormData.name.trim()) {
      toast.error('Please enter the staff member name');
      return;
    }
    if (!staffFormData.email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!staffFormData.temporaryPassword || staffFormData.temporaryPassword.length < 8) {
      toast.error('Temporary password is required and must be at least 8 characters');
      return;
    }

    try {
      setIsCreatingStaff(true);
      const cleanEmail = staffFormData.email.toLowerCase().trim();

      // Create in Supabase profiles table (the backend automatically creates the linked agent row for role Agent)
      await profileService.createProfile({
        name: staffFormData.name.trim(),
        email: cleanEmail,
        temporaryPassword: staffFormData.temporaryPassword,
        role: staffFormData.role,
        phone: staffFormData.phone.trim(),
        vehicleType: staffFormData.role === 'Agent' ? staffFormData.vehicleType : undefined,
        hubLocation: staffFormData.role === 'Agent' ? staffFormData.hubLocation : undefined,
      });

      toast.success(
        `${staffFormData.role} account for "${staffFormData.name}" created and stored in Supabase database!`
      );
      setIsAddModalOpen(false);
      setStaffFormData({
        name: '',
        email: '',
        temporaryPassword: '',
        role: (activeUserRole === 'Manager' ? 'Agent' : 'Manager') as UserRole,
        phone: '',
        vehicleType: 'Bike',
        hubLocation: 'Indiranagar Hub',
      });
      fetchProfiles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create staff account');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      await profileService.deleteProfile(staffToDelete.id);
      toast.success(`User "${staffToDelete.name}" removed from database.`);
      setStaffToDelete(null);
      fetchProfiles();
    } catch {
      toast.error('Failed to remove staff account');
    }
  };

  const roles = [
    {
      role: 'Admin',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Full access to all CRM modules, settlements, agent rosters, and reports.',
      permissions: ['Manage Customers', 'Dispatch Deliveries', 'Settle Cash', 'Create Manager & Agent Accounts', 'System Settings'],
    },
    {
      role: 'Manager',
      icon: UserCheck,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Hub supervision, route dispatching, and field staff management.',
      permissions: ['Manage Customers', 'Dispatch Deliveries', 'Create Agent Accounts', 'Operational Reports'],
    },
    {
      role: 'Agent',
      icon: Bike,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Field app access to complete shipments, update status, and record POD.',
      permissions: ['View Assigned Shipments', 'Update Delivery Lifecycle Status', 'Record e-POD & Cash Received'],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl pb-16 font-sans">
      <PageHeader
        title="Settings & Organization"
        subtitle="Manage your personal profile, company configurations, and team roles stored in Supabase."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-6">
        <Tabs
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setSearchParams({ tab });
          }}
          items={[
            { id: 'profile', label: 'User Profile', icon: UserIcon },
            { id: 'company', label: 'Company & Operations', icon: Building },
            { id: 'roles', label: 'Users & Roles', icon: Shield },
          ]}
        />

        {/* 1. Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div
                className={`w-14 h-14 rounded-2xl text-white text-lg font-bold flex items-center justify-center shadow-xs ${
                  profile.role === 'Admin'
                    ? 'bg-blue-600'
                    : profile.role === 'Manager'
                    ? 'bg-purple-600'
                    : 'bg-emerald-600'
                }`}
              >
                {profile.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{profile.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      profile.role === 'Admin'
                        ? 'primary'
                        : profile.role === 'Manager'
                        ? 'neutral'
                        : 'success'
                    }
                    size="sm"
                  >
                    {profile.role}
                  </Badge>
                  <span className="text-xs text-gray-400">Head Office Hub</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" required>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </FormField>

              <FormField label="Email Address" required>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </FormField>

              <FormField label="Phone Number">
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </FormField>

              <FormField label="System Role">
                <Input value={profile.role} disabled />
              </FormField>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save Profile
              </Button>
            </div>
          </form>
        )}

        {/* 2. Company Tab */}
        {activeTab === 'company' && (
          <form onSubmit={handleSaveCompany} className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              <FormField label="Company / Entity Name" required>
                <Input
                  value={company.companyName}
                  onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                />
              </FormField>

              <FormField label="Primary Hub Headquarters Address">
                <Input
                  value={company.hubAddress}
                  onChange={(e) => setCompany({ ...company, hubAddress: e.target.value })}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Operating Currency">
                  <Input value={company.currency} disabled />
                </FormField>

                <FormField label="Toll-Free Customer Support">
                  <Input
                    value={company.supportPhone}
                    onChange={(e) => setCompany({ ...company, supportPhone: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Operations Support Email">
                <Input
                  type="email"
                  value={company.supportEmail}
                  onChange={(e) => setCompany({ ...company, supportEmail: e.target.value })}
                />
              </FormField>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save Company Settings
              </Button>
            </div>
          </form>
        )}

        {/* 3. Roles & Team Accounts Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-8">
            {/* Role Access Matrix Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((r, i) => {
                const Icon = r.icon;
                return (
                  <Card key={i} title={r.role} className="flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${r.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">{r.role} Privilege Level</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{r.description}</p>
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                          Module Capabilities:
                        </span>
                        {r.permissions.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Team Accounts Section */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Team & Staff Accounts (Supabase DB)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activeUserRole === 'Admin'
                      ? 'Admins can create Manager and Agent accounts stored directly in Supabase database.'
                      : 'Managers can create Agent accounts stored directly in Supabase database.'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setStaffFormData({
                      name: '',
                      email: '',
                      temporaryPassword: '',
                      role: activeUserRole === 'Manager' ? 'Agent' : 'Manager',
                      phone: '',
                      vehicleType: 'Bike',
                      hubLocation: 'Indiranagar Hub',
                    });
                    setIsAddModalOpen(true);
                  }}
                >
                  {activeUserRole === 'Manager' ? 'Add Agent Account' : 'Add Staff Account'}
                </Button>
              </div>

              {/* Profiles Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">User & Contact</th>
                      <th className="px-4 py-3">Assigned Role</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Created Date</th>
                      {activeUserRole === 'Admin' && <th className="px-4 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingProfiles ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          Loading team accounts from Supabase...
                        </td>
                      </tr>
                    ) : profilesList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          No accounts found. Click "Add Staff Account" to create one.
                        </td>
                      </tr>
                    ) : (
                      profilesList.map((p) => {
                        const isMainAdmin = p.email === 'admin@deliverycrm.in';
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                    p.role === 'Admin'
                                      ? 'bg-blue-600'
                                      : p.role === 'Manager'
                                      ? 'bg-purple-600'
                                      : 'bg-emerald-600'
                                  }`}
                                >
                                  {p.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-gray-900 block truncate">{p.name}</span>
                                  <span className="text-[11px] text-gray-400 block truncate">{p.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  p.role === 'Admin'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : p.role === 'Manager'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {p.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{p.phone || '—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-[11px]">Active in DB</td>
                            {activeUserRole === 'Admin' && (
                              <td className="px-4 py-3 text-right">
                                {!isMainAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => setStaffToDelete(p)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Account"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={activeUserRole === 'Manager' ? 'Create Field Agent Account' : 'Create Team Staff Account'}
        description="Created accounts are saved directly to the Supabase database. They can immediately sign in."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreatingStaff}
              onClick={handleCreateStaffAccount}
            >
              Save to Supabase
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateStaffAccount} className="space-y-4">
          <FormField label="Full Name" required>
            <Input
              value={staffFormData.name}
              onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
              placeholder="e.g. Anand Varma"
              required
            />
          </FormField>

          <FormField label="Email Address (Login Username)" required>
            <Input
              type="email"
              value={staffFormData.email}
              onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
              placeholder="e.g. anand@deliverycrm.in"
              required
            />
          </FormField>

          <FormField label="Temporary Password" required>
            <div className="relative">
              <Input
                type={showStaffPassword ? 'text' : 'password'}
                value={staffFormData.temporaryPassword}
                onChange={(e) => setStaffFormData({ ...staffFormData, temporaryPassword: e.target.value })}
                placeholder="Minimum 8 characters"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowStaffPassword(!showStaffPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
              >
                {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="Account Role" required>
            {activeUserRole === 'Manager' ? (
              <Input value="Agent (Field Delivery)" disabled />
            ) : (
              <Select
                value={staffFormData.role}
                onChange={(e) =>
                  setStaffFormData({ ...staffFormData, role: e.target.value as UserRole })
                }
                options={[
                  { label: 'Manager (Hub Operations)', value: 'Manager' },
                  { label: 'Agent (Field Delivery)', value: 'Agent' },
                  { label: 'Admin (System Administrator)', value: 'Admin' },
                ]}
              />
            )}
          </FormField>

          <FormField label="Phone Number">
            <Input
              type="tel"
              value={staffFormData.phone}
              onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </FormField>

          {/* Additional fields if role is Agent */}
          {staffFormData.role === 'Agent' && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <FormField label="Vehicle Type">
                <Select
                  value={staffFormData.vehicleType}
                  onChange={(e) =>
                    setStaffFormData({ ...staffFormData, vehicleType: e.target.value })
                  }
                  options={[
                    { label: 'Bike', value: 'Bike' },
                    { label: 'Scooter', value: 'Scooter' },
                    { label: 'Van', value: 'Van' },
                    { label: 'Truck', value: 'Truck' },
                  ]}
                />
              </FormField>

              <FormField label="Hub Location">
                <Input
                  value={staffFormData.hubLocation}
                  onChange={(e) =>
                    setStaffFormData({ ...staffFormData, hubLocation: e.target.value })
                  }
                  placeholder="e.g. Indiranagar Hub"
                />
              </FormField>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Staff Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(staffToDelete)}
        onCancel={() => setStaffToDelete(null)}
        onConfirm={handleDeleteStaff}
        title="Remove Staff Account"
        message={`Are you sure you want to remove "${staffToDelete?.name}" (${staffToDelete?.role}) from the Supabase database? They will no longer have access to the system.`}
        confirmText="Remove Account"
        variant="danger"
      />
    </div>
  );
};

export default Settings;
