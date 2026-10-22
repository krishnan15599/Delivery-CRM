import React, { useState } from "react";
import { Mail, Lock, EyeOff, ArrowRight, Eye, ShieldCheck, UserCheck, Bike } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "admin@deliverycrm.in",
    password: "••••••••",
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setSubmitting(true);
      await login(formData.email, formData.password);
      toast.success("Successfully authenticated!");

      const origin = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      if (formData.email.includes("agent")) {
        navigate(origin || "/deliveries");
      } else {
        navigate(origin || "/dashboard");
      }
    } catch {
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (email: string) => {
    setFormData((prev) => ({ ...prev, email }));
    try {
      setSubmitting(true);
      await login(email, "password123");
      toast.success(`Logged in as ${email.split("@")[0].toUpperCase()}`);
      if (email.includes("agent")) {
        navigate("/deliveries");
      } else {
        navigate("/dashboard");
      }
    } catch {
      toast.error("Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:flex-col w-1/2 bg-[#f4f7fb] relative justify-center items-center overflow-hidden p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-[#2c5fbf] text-white shadow-lg shadow-blue-500/20 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Delivery Operations & Cash Settlement CRM
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Enterprise delivery tracking, real-time dispatch management, cash collections, and agent audits.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

        <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1.5">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to your Delivery CRM account</p>
          </div>

          {/* Quick Demo Role Selector */}
          <div className="mb-5 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2 text-center">
              One-Click Role Demo Sign-In
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@deliverycrm.in")}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-center cursor-pointer group shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-800">Admin</span>
                <span className="text-[10px] text-gray-400">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("manager@deliverycrm.in")}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-gray-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all text-center cursor-pointer group shadow-2xs"
              >
                <UserCheck className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-800">Manager</span>
                <span className="text-[10px] text-gray-400">Hub Ops</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("agent@deliverycrm.in")}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-center cursor-pointer group shadow-2xs"
              >
                <Bike className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-800">Agent</span>
                <span className="text-[10px] text-gray-400">Delivery App</span>
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                  required
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <span className="text-[13px] text-[#1a65ec] hover:text-blue-700 cursor-pointer">
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
                  className="block w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="h-4 w-4 text-[#1a65ec] focus:ring-[#1a65ec] border-gray-300 rounded cursor-pointer accent-[#1a65ec]"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#1a65ec] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Default test account: <span className="font-semibold text-gray-700">admin@deliverycrm.in</span>
          </p>
        </div>

        {/* Page Footer */}
        <div className="absolute bottom-6 text-center w-full z-0">
          <p className="text-xs text-gray-400">© 2026 Delivery CRM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
