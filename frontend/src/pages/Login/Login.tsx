import React, { useState, useEffect } from "react";
import { Mail, Lock, EyeOff, Eye, ArrowRight, Check, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePwaInstall } from "../../context/PwaInstallContext";
import { useToast } from "../../components/common";
import type { UserRole } from "../../types/auth";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, isLoading, isAuthenticated, getDefaultRoute } = useAuth();
  const { isInstalled, promptInstall } = usePwaInstall();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

  const handlePostLoginRedirect = (userRole: UserRole) => {
    const origin = (location.state as { from?: { pathname?: string } })?.from?.pathname;

    if (userRole === "SuperAdmin") {
      navigate("/platform", { replace: true });
    } else if (userRole === "Agent") {
      if (origin && (origin.startsWith("/deliveries") || origin.startsWith("/chat"))) {
        navigate(origin, { replace: true });
      } else {
        navigate("/deliveries", { replace: true });
      }
    } else if (userRole === "Manager") {
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
    } catch (err: any) {
      toast.error(err?.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:h-screen w-full overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-[#eef4ff] relative flex flex-col items-center justify-center font-sans antialiased selection:bg-blue-600 selection:text-white px-4 py-6 sm:px-8 lg:px-12 lg:py-2">
      {/* Background soft decorative gradient blurs and curves */}
      <div className="absolute top-0 right-0 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-gradient-to-bl from-orange-400/20 via-blue-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[-10%] left-[25%] w-[380px] sm:w-[600px] h-[380px] sm:h-[600px] bg-gradient-to-b from-blue-200/40 via-sky-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-gradient-to-tr from-sky-300/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main Single-Screen Viewport Container */}
      <div className="w-full max-w-[1200px] lg:h-full lg:max-h-[88vh] bg-transparent flex flex-col lg:flex-row items-center justify-center lg:justify-between relative z-10 gap-5 lg:gap-10">
        {/* Mobile Compact Brand Header (shown only below lg) */}
        <div className="flex lg:hidden flex-col items-center text-center gap-2 select-none">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#1d68f2] to-[#3b82f6] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18.5" r="2.5" />
                <circle cx="7" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Delivery
              </span>
              <span className="text-xl font-extrabold tracking-tight text-[#1d68f2]">
                CRM
              </span>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-600 max-w-[260px]">
            Track every <span className="text-[#ff5c00] font-semibold">delivery</span> from dispatch to doorstep.
          </p>
        </div>

        {/* Desktop Left Visual Illustration & Brand Side */}
        <div className="hidden lg:flex w-full lg:w-[56%] h-full flex-col justify-between self-stretch relative select-none">
          {/* Top Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#1d68f2] to-[#3b82f6] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18.5" r="2.5" />
                <circle cx="7" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                Delivery
              </span>
              <span className="text-lg font-extrabold tracking-tight text-[#1d68f2]">
                CRM
              </span>
            </div>
          </div>

          {/* Headline & Description */}
          <div className="my-auto space-y-3 max-w-xl shrink-0">
            <div className="relative">
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-950 tracking-tight leading-[1.12]">
                Track every <span className="text-[#ff5c00]">delivery</span>
                <br />
                from dispatch to
                <br />
                doorstep.
              </h1>
              {/* Orange swoop under doorstep */}
              <svg className="w-24 h-2.5 text-[#ff5c00] mt-1" viewBox="0 0 100 12" fill="none">
                <path d="M2 9C28 2 72 2 98 9" stroke="#ff5c00" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>

            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md pt-0.5">
              Assign agents, follow status as it changes, and reconcile the cash they collect.
            </p>

            {/* Feature Badges/Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-xs border border-blue-100 shadow-2xs">
                <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                  </svg>
                </div>
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-bold text-slate-800">Real-time</div>
                  <div className="text-[9px] text-slate-500">Tracking</div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-xs border border-orange-100 shadow-2xs">
                <div className="w-5 h-5 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 9.2h3V19H5zM10.6 5h2.8v14.2h-2.8zm5.6 8h2.8v6.2h-2.8z"/>
                  </svg>
                </div>
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-bold text-slate-800">Live</div>
                  <div className="text-[9px] text-slate-500">Analytics</div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-xs border border-emerald-100 shadow-2xs">
                <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-bold text-slate-800">Secure &</div>
                  <div className="text-[9px] text-slate-500">Reliable</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Road Illustration from the design */}
          <div className="relative w-full flex-1 min-h-[160px] max-h-[260px] flex items-end overflow-hidden">
            <img
              src="/assets/Login/login-left-panel.png"
              alt="Delivery Scooter Illustration"
              className="w-full h-full object-contain object-bottom"
            />
          </div>

          {/* Footer note */}
          <div className="pt-1 text-[11px] text-slate-400 font-medium shrink-0">
            © 2026 Delivery CRM
          </div>
        </div>

        {/* Right Sign-in Form Card */}
        <div className="w-full lg:w-[44%] max-w-[430px] flex flex-col items-center justify-center shrink-0">
          <div className="w-full bg-white rounded-[22px] sm:rounded-[24px] shadow-[0_15px_45px_rgba(29,104,242,0.08)] border border-slate-100 p-5 sm:p-9 relative z-20">
            {/* Header */}
            <div className="mb-5">
              <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
                Sign in
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-normal">
                Use the email and password your administrator gave you.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3.5 py-3 sm:py-2.5 bg-[#f8faff] border border-slate-200/90 rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d68f2]/30 focus:border-[#1d68f2] focus:bg-white transition-all shadow-2xs"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Password
                  </label>
                  <a
                    href="mailto:admin@deliverycrm.in?subject=Password%20Reset%20Request"
                    className="text-xs font-semibold text-[#1d68f2] hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-10 py-3 sm:py-2.5 bg-[#f8faff] border border-slate-200/90 rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d68f2]/30 focus:border-[#1d68f2] focus:bg-white transition-all shadow-2xs"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-[#1d68f2] focus:ring-[#1d68f2] accent-[#1d68f2] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600">
                    Keep me signed in on this device
                  </span>
                </label>
              </div>

              {/* Sign in Button */}
              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full flex justify-center items-center py-3.5 sm:py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1d68f2] to-[#0091ff] hover:from-[#1754c5] hover:to-[#007fe3] active:scale-[0.99] transition-all shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed gap-2 mt-3"
              >
                {submitting ? (
                  "Signing in..."
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" /> Sign in
                  </>
                )}
              </button>
            </form>

            {/* Bottom Help Link */}
            <div className="mt-5 text-center">
              <p className="text-xs text-slate-500">
                Can&apos;t sign in?{" "}
                <a
                  href="mailto:admin@deliverycrm.in?subject=Access%20Assistance%20Request"
                  className="text-[#1d68f2] hover:underline font-semibold transition-colors"
                >
                  Ask your administrator to reset your access.
                </a>
              </p>
            </div>
          </div>

          {/* Install App Button (shown when not installed as PWA) */}
          {!isInstalled && (
            <button
              type="button"
              onClick={promptInstall}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white border border-blue-200/80 text-xs font-semibold text-[#1d68f2] shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Delivery CRM App</span>
            </button>
          )}

          {/* Mobile Footer */}
          <div className="mt-5 text-center text-[11px] text-slate-400 font-medium lg:hidden">
            © 2026 Delivery CRM
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
