import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  User,
  Check,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const SignUpPage = () => {
  // Your existing state
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  // New state for tracking password strength
  const [passwordChecks, setPasswordChecks] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasSymbol: false,
    passwordsMatch: false
  });

  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  // Check password strength on password change
  useEffect(() => {
    const password = formData.password;
    
    setPasswordChecks({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      passwordsMatch: password === formData.confirmPassword && password !== ""
    });
  }, [formData.password, formData.confirmPassword]);

  // Your existing form validation and submission functions
  const validateForm = () => {
    if (!formData.username.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    
    // Check if all password requirements are met
    const allRequirementsMet = Object.values(passwordChecks).every(check => check);
    if (!allRequirementsMet) return toast.error("Please meet all password requirements");

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) {
      const signupSuccess = await signup(formData);
      if (signupSuccess) {
        navigate("/login");
      }
    }
  };

  // Password requirement indicator component
  const PasswordRequirement = ({ met, label }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="size-4 text-success" />
      ) : (
        <X className="size-4 text-error" />
      )}
      <span className={met ? "text-success" : "text-base-content/60"}>
        {label}
      </span>
    </div>
  );


  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center mt-8 group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>

              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
              <p className="text-base-content/60">
                Get started with your free account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  className={`input input-bordered w-full pl-10 mt-2`}
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  className={`input input-bordered w-full pl-10 mt-2`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10 mt-2 ${
                    formData.password.length > 0
                      ? Object.values(passwordChecks).every(Boolean)
                        ? "border-success"
                        : "border-error"
                      : ""
                  }`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
              
              {/* Password requirements checklist */}
              {formData.password.length > 0 && (
                <div className="mt-2 p-3 bg-base-200 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <PasswordRequirement 
                    met={passwordChecks.hasMinLength} 
                    label="At least 8 characters" 
                  />
                  <PasswordRequirement 
                    met={passwordChecks.hasUppercase} 
                    label="One uppercase letter" 
                  />
                  <PasswordRequirement 
                    met={passwordChecks.hasLowercase} 
                    label="One lowercase letter" 
                  />
                  <PasswordRequirement 
                    met={passwordChecks.hasSymbol} 
                    label="One symbol (!@#$%...)" 
                  />
                </div>
              )}
            </div>
            
            {/* Confirm password field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10 mt-2 ${
                    formData.confirmPassword.length > 0
                      ? passwordChecks.passwordsMatch
                        ? "border-success"
                        : "border-error"
                      : ""
                  }`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
              
              {/* Password match indicator */}
              {formData.confirmPassword.length > 0 && (
                <div className="mt-2">
                  <PasswordRequirement 
                    met={passwordChecks.passwordsMatch} 
                    label="Passwords match" 
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSigningUp || !Object.values(passwordChecks).every(Boolean)}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* right side - keep your existing AuthImagePattern */}
      <AuthImagePattern
        title="Join our Devcord"
        subtitle="Connect with developers worlwide"
      />
    </div>
  );
};

export default SignUpPage;