import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Building,
  Shield,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  Tabs,
  FormField,
  Input,
  Button,
  Badge,
  useToast,
} from '../../components/common';

const VALID_SETTINGS_TABS = ['profile', 'company', 'roles'];

export const Settings: React.FC = () => {
  const toast = useToast();
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
  const [profile, setProfile] = useState({
    name: 'Krishnan K.',
    email: 'krishnan@deliverycrm.in',
    phone: '+91 98450 12345',
    role: 'Admin',
  });

  // Company Form state
  const [company, setCompany] = useState({
    companyName: 'Express Logistics CRM India Pvt Ltd',
    hubAddress: '100ft Road, Indiranagar, Bengaluru, KA',
    currency: '₹ INR (Indian Rupee)',
    supportEmail: 'ops-support@deliverycrm.in',
    supportPhone: '1800-419-8900',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Administrator profile updated successfully!');
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Company settings saved successfully!');
  };

  const roles = [
    {
      role: 'Admin',
      description: 'Full access to all CRM modules, settlements, agent rosters, and reports.',
      permissions: ['Manage Customers', 'Dispatch Deliveries', 'Settle Cash', 'System Settings', 'View All Reports'],
    },
    {
      role: 'Manager',
      description: 'Hub supervision, route dispatching, and agent tracking.',
      permissions: ['Manage Customers', 'Dispatch Deliveries', 'View Reports'],
    },
    {
      role: 'Agent',
      description: 'Mobile field app access to complete deliveries and collect COD.',
      permissions: ['View Assigned Deliveries', 'Update Status', 'Record Collections'],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      <PageHeader
        title="Settings & Organization"
        subtitle="Manage your personal profile, company configurations, and team roles."
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
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'company', label: 'Company & Operations', icon: Building },
            { id: 'roles', label: 'Users & Roles', icon: Shield },
          ]}
        />

        {/* 1. Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-[#2c5fbf] text-white text-xl font-bold flex items-center justify-center shadow-sm">
                KK
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{profile.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="primary" size="sm">{profile.role}</Badge>
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

        {/* 3. Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((r, i) => (
                <Card key={i} title={r.role} className="flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 leading-relaxed">{r.description}</p>
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                        Module Access:
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
