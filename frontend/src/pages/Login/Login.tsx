import { Mail, Lock, EyeOff, ArrowRight, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData)
    navigate("/dashboard")

  }

  const togglePassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:flex-col w-1/2 bg-[#f4f7fb] relative justify-center items-center overflow-hidden">
        <img
          src="/assets/Login/Login-leftside.png"
          alt="Delivery CRM Illustration"
          className="w-full h-[92%] object-contain"
        />
      </div>

      {/* Right Panel */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

        <div className="w-full max-w-[400px] bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1.5">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to your Delivery CRM account</p>
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
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-[13px] text-[#1a65ec] hover:text-blue-700">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  type={showPassword ? "text" : "password"}
                  className="block w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Enter your password"
                />
                <div
                  onClick={togglePassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" /> : <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />}
                </div>
              </div>
            </div>

            <div className="flex items-center pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                defaultChecked
                className="h-4 w-4 text-[#1a65ec] focus:ring-[#1a65ec] border-gray-300 rounded cursor-pointer accent-[#1a65ec]"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#1a65ec] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors gap-2 mt-2"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="my-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400 text-[11px] font-semibold uppercase tracking-wider">OR</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-200 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.72 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.7 16.69 5.82 14.1H2.15V16.94C3.96 20.53 7.69 23 12 23Z" fill="#34A853" />
                  <path d="M5.82 14.1C5.6 13.44 5.47 12.74 5.47 12C5.47 11.26 5.6 10.56 5.82 9.9V7.06H2.15C1.41 8.54 1 10.22 1 12C1 13.78 1.41 15.46 2.15 16.94L5.82 14.1Z" fill="#FBBC05" />
                  <path d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.36 3.86C17.45 2.08 14.97 1 12 1C7.69 1 3.96 3.47 2.15 7.06L5.82 9.9C6.7 7.31 9.13 5.38 12 5.38Z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500">
            Don't have an account?{" "}
            <a href="#" className="font-medium text-[#1a65ec] hover:text-blue-700">
              Contact your administrator
            </a>
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
