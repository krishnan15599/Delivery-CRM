import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  EyeOff,
  ArrowRight,
  Eye,
  ShieldCheck,
  UserCheck,
  Bike,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common";
import type { UserRole } from "../../types/auth";

interface RoleConfig {
  role: UserRole;
  label: string;
  badge: string;
  email: string;
  defaultPass: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  landingPage: string;
  colorScheme: {
    badge: string;
    border: string;
    activeBg: string;
    iconBg: string;
    iconColor: string;
  };
  features: string[];
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  Admin: {
    role: "Admin",
    label: "Admin Console",
    badge: "Full Control",
    email: "admin@deliverycrm.in",
    defaultPass: "password123",
    icon: ShieldCheck,
    tagline: "Total control over operations, financial collections, settings & staff",
    landingPage: "/dashboard",
    colorScheme: {
      badge: "bg-neutral-100 text-black border-neutral-300 font-bold",
      border: "border-black ring-2 ring-[#84cc16]",
      activeBg: "bg-neutral-50",
      iconBg: "bg-black text-[#84cc16]",
      iconColor: "text-black",
    },
    features: ["All Dashboards & Reports", "Dispatch & Bulk Assign", "COD & Cash Settlement", "Settings & Users"],
  },
  Manager: {
    role: "Manager",
    label: "Hub Manager",
    badge: "Hub Operations",
    email: "manager@deliverycrm.in",
    defaultPass: "password123",
    icon: UserCheck,
    tagline: "Oversee shipments, customer inquiries, field agents & daily reports",
    landingPage: "/dashboard",
    colorScheme: {
      badge: "bg-neutral-100 text-black border-neutral-300 font-bold",
      border: "border-black ring-2 ring-[#84cc16]",
      activeBg: "bg-neutral-50",
      iconBg: "bg-black text-[#84cc16]",
      iconColor: "text-black",
    },
    features: ["Hub Operations Dashboard", "Deliveries & Agents Ops", "Customer Management", "Operational Reports"],
  },
  Agent: {
    role: "Agent",
    label: "Delivery Agent",
    badge: "Field App",
    email: "agent@deliverycrm.in",
    defaultPass: "password123",
    icon: Bike,
    tagline: "Deliver assigned shipments, update status, record POD & team chat",
    landingPage: "/deliveries",
    colorScheme: {
      badge: "bg-neutral-100 text-black border-neutral-300 font-bold",
      border: "border-black ring-2 ring-[#84cc16]",
      activeBg: "bg-neutral-50",
      iconBg: "bg-black text-[#84cc16]",
      iconColor: "text-black",
    },
    features: ["Field Deliveries Workspace", "Shipment Status Transitions", "Proof of Delivery (POD)", "Support Chat Inbox"],
  },
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, isLoading, isAuthenticated, getDefaultRoute } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>("Admin");
  const [formData, setFormData] = useState({
    email: ROLE_CONFIGS.Admin.email,
    password: ROLE_CONFIGS.Admin.defaultPass,
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If user is already authenticated, redirect to appropriate workspace
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [isAuthenticated, getDefaultRoute, navigate]);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setFormData((prev) => ({
      ...prev,
      email: ROLE_CONFIGS[role].email,
      password: ROLE_CONFIGS[role].defaultPass,
    }));
  };

  const handlePostLoginRedirect = (userRole: UserRole) => {
    const origin = (location.state as { from?: { pathname?: string } })?.from?.pathname;

    if (userRole === "Agent") {
      // Agents can only access /deliveries and /chat
      if (origin && (origin.startsWith("/deliveries") || origin.startsWith("/chat"))) {
        navigate(origin, { replace: true });
      } else {
        navigate("/deliveries", { replace: true });
      }
    } else if (userRole === "Manager") {
      // Managers can access everything except /collections and /components
      if (
        origin &&
        !origin.startsWith("/collections") &&
        !origin.startsWith("/components")
      ) {
        navigate(origin, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else {
      // Admin has full access
      navigate(origin || "/dashboard", { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    if (!formData.password) {
      toast.error("Please enter your password");
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(formData.email, formData.password);
      toast.success(`Welcome back, ${user.name}! Logged in as ${user.role}.`);
      handlePostLoginRedirect(user.role);
    } catch {
      toast.error("Invalid credentials. Please verify your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    const config = ROLE_CONFIGS[role];
    setSelectedRole(role);
    setFormData((prev) => ({
      ...prev,
      email: config.email,
      password: config.defaultPass,
    }));

    try {
      setSubmitting(true);
      const user = await login(config.email, config.defaultPass);
      toast.success(`Signed in as ${user.name} (${user.role})`);
      handlePostLoginRedirect(user.role);
    } catch {
      toast.error(`Could not sign in as ${role}. Please check your connection.`);
    } finally {
      setSubmitting(false);
    }
  };

  const activeConfig = ROLE_CONFIGS[selectedRole];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      {/* Left Feature Showcase Panel */}
      <div className="hidden lg:flex lg:flex-col w-5/12 bg-black text-white p-12 justify-between relative overflow-hidden select-none">
        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#84cc16]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#84cc16]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-[#84cc16] text-black shadow-lg shadow-[#84cc16]/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block">Delivery CRM</span>
              <span className="text-xs text-[#84cc16] font-semibold tracking-wider uppercase">
                Enterprise Logistics Platform
              </span>
            </div>
          </div>
        </div>

        {/* Center Role Highlights */}
        <div className="relative z-10 space-y-6 my-auto">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#84cc16]/15 text-[#84cc16] border border-[#84cc16]/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Role-Based Access Control
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-snug">
              Unified Platform for Admin, Hub Managers & Field Agents
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Experience seamless workflow segregation tailored for every stakeholder in the delivery chain.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((r) => {
              const cfg = ROLE_CONFIGS[r];
              const Icon = cfg.icon;
              const isSelected = selectedRole === r;
              return (
                <div
                  key={r}
                  onClick={() => handleSelectRole(r)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/10 border-[#84cc16] shadow-md translate-x-1"
                      : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          r === "Admin"
                            ? "bg-blue-500/20 text-blue-300"
                            : r === "Manager"
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          {cfg.label}
                          <span className="text-[10px] font-medium text-slate-400">
                            ({cfg.landingPage})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 line-clamp-1">{cfg.tagline}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
          <span>Production Ready v2.4</span>
          <span>© 2026 Delivery CRM</span>
        </div>
      </div>

      {/* Right Login Form Container */}
      <div className="flex flex-col justify-center items-center w-full lg:w-7/12 p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[460px]">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select your role profile or enter your account credentials to continue
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Select Role Profile
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((r) => {
                const cfg = ROLE_CONFIGS[r];
                const Icon = cfg.icon;
                const isSelected = selectedRole === r;

                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? `bg-white ${cfg.colorScheme.border} shadow-sm`
                        : "bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-1.5 ${cfg.colorScheme.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-900">{r}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{cfg.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Role Info Banner */}
          <div className={`mb-6 p-3.5 rounded-xl border text-xs ${activeConfig.colorScheme.activeBg} border-gray-200/80`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <activeConfig.icon className={`w-3.5 h-3.5 ${activeConfig.colorScheme.iconColor}`} />
                {activeConfig.label}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${activeConfig.colorScheme.badge}`}>
                Lands on {activeConfig.landingPage}
              </span>
            </div>
            <p className="text-gray-600 text-[11px] mb-2">{activeConfig.tagline}</p>

            {/* Quick 1-Click Button */}
            <button
              type="button"
              disabled={submitting || isLoading}
              onClick={() => handleQuickLogin(selectedRole)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Click Instant Sign In as {selectedRole}
            </button>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                  required
                  className="block w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-2 focus:ring-[#84cc16]/40 focus:border-black outline-none transition-colors shadow-2xs"
                  placeholder="name@deliverycrm.in"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">Password</label>
                <span className="text-xs text-neutral-900 hover:text-[#65a30d] cursor-pointer font-medium">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-2 focus:ring-[#84cc16]/40 focus:border-black outline-none transition-colors shadow-2xs"
                  placeholder="Enter account password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-[#84cc16] accent-black cursor-pointer"
                />
                <span className="text-xs text-gray-600">Keep me logged in</span>
              </label>

              <span className="text-xs text-gray-400">Demo pass: password123</span>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg font-semibold text-sm text-white bg-black hover:bg-neutral-900 active:bg-neutral-800 text-[#84cc16] border border-black transition-colors shadow-sm gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <>Signing in...</>
              ) : (
                <>
                  Sign In as {selectedRole} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Role access breakdown note */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500">
              Need access assistance? Contact your system administrator at{" "}
              <a href="mailto:admin@deliverycrm.in" className="text-black hover:text-[#65a30d] font-semibold hover:underline">
                admin@deliverycrm.in
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
