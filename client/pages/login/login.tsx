import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Lock, ArrowRight, ArrowLeft, Mail, Phone, Upload, X, CloudSun, Megaphone, Activity, CheckCircle } from "lucide-react";
import { FeedbackModal } from "@/components/FeedbackModal";
import { getRole, getRoleHome, getToken, setAuthSession, type UserRole } from "@/lib/auth";
import { api } from "@/lib/api";

type ViewState = "login" | "forgot" | "create" | "reset";
type LiveUpdate = { category: string; text: string; module?: string };

const Login = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingRegisterOtp, setSendingRegisterOtp] = useState(false);
  const [verifyingRegistration, setVerifyingRegistration] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);

  // Live Updates State
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);

  // Login State
  const [loginData, setLoginData] = useState({
    identifier: "",
    password: ""
  });

  // Register State
  const [registerData, setRegisterData] = useState({
    username: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "prefer-not-to-say",
    civilStatus: "single",
    blk: "",
    lot: "",
    street: "",
    subdivision: "",
    barangay: "Mambog II",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    contactNumber: "",
    email: "",
    validIdType: "barangay-id",
    validIdImage: "",
    password: "",
    confirmPassword: ""
  });
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Reset Password State
  const [resetData, setResetData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  // Feedback Modal State
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ isOpen: false, title: "", message: "", type: "success" });

  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);

  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const res = await api.get("/api/announcements?limit=8");
        const mapped = (res.data || []).map((item: any) => ({
          category: item.category || item.module || "Announcement",
          text: item.title ? `${item.title}: ${item.content}` : item.content,
          module: item.module,
        }));
        setLiveUpdates(mapped.length > 0 ? mapped : [{ category: "Announcement", text: "No updates posted yet." }]);
      } catch {
        setLiveUpdates([{ category: "Announcement", text: "Unable to load live updates right now." }]);
      }
    };
    void loadUpdates();
  }, []);

  useEffect(() => {
    if (liveUpdates.length === 0) return;
    if (currentUpdateIndex >= liveUpdates.length) {
      setCurrentUpdateIndex(0);
    }
    const timer = setInterval(() => {
      setCurrentUpdateIndex((prev) => (prev + 1) % liveUpdates.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [liveUpdates.length, currentUpdateIndex]);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleIdTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegisterData({ ...registerData, validIdType: e.target.value });
  };

  const handleValidIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFeedback({
        isOpen: true,
        title: "Image Too Large",
        message: "Valid ID image must be 2MB or below.",
        type: "error",
      });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRegisterData((prev) => ({ ...prev, validIdImage: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (view === "login") {
      setLoginLoading(true);
      setLoginProgress(20);
      try {
        const res = await api.post("/api/auth/login", {
          identifier: loginData.identifier,
          password: loginData.password,
        });
        const role: UserRole =
          res.data.role === "admin" || res.data.role === "superadmin"
            ? res.data.role
            : "resident";

        setAuthSession(res.data.token, role);
        setLoginProgress(100);
        navigate(getRoleHome(role));
      } catch (err: any) {
        setFeedback({ isOpen: true, title: "Login Failed", message: err.response?.data?.msg || "Invalid credentials.", type: "error" });
      } finally {
        setTimeout(() => { setLoginLoading(false); setLoginProgress(0); }, 300);
      }
    } else if (view === "create") {
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!agreeTerms) {
        setFeedback({ isOpen: true, title: "Terms Required", message: "You must agree to the Terms and Conditions.", type: "error" });
        return;
      }
      if (registerData.password !== registerData.confirmPassword) {
        setFeedback({ isOpen: true, title: "Password Mismatch", message: "Passwords do not match.", type: "error" });
        return;
      }
      if (!passwordPattern.test(registerData.password)) {
        setFeedback({ isOpen: true, title: "Weak Password", message: "Password must be at least 8 characters with uppercase, lowercase, and 1 special character.", type: "error" });
        return;
      }
      if (!/^\d{11}$/.test(registerData.contactNumber)) {
        setFeedback({ isOpen: true, title: "Invalid Contact", message: "Contact number must be exactly 11 digits.", type: "error" });
        return;
      }
      if (!registerData.validIdType || !registerData.validIdImage) {
        setFeedback({ isOpen: true, title: "Valid ID Required", message: "Select a valid ID type and upload an ID image.", type: "error" });
        return;
      }
      if (!registerData.street.trim()) {
        setFeedback({ isOpen: true, title: "Address Required", message: "Street in Mambog II is required.", type: "error" });
        return;
      }
      if (sendingRegisterOtp) return;

      try {
        setSendingRegisterOtp(true);
        const addressDetails = {
          blk: registerData.blk,
          lot: registerData.lot,
          street: registerData.street,
          subdivision: registerData.subdivision,
          barangay: registerData.barangay,
          city: registerData.city,
          province: registerData.province,
          zipCode: registerData.zipCode,
        };
        await api.post("/api/auth/register/check", {
          username: registerData.username,
          email: registerData.email,
          contactNumber: registerData.contactNumber,
          address: `${registerData.street}, ${registerData.barangay}, ${registerData.city}, ${registerData.province}`,
          addressDetails,
        });
        await api.post("/api/auth/send-otp", { email: registerData.email });
        setShowOtpModal(true);
        setFeedback({ isOpen: true, title: "OTP Sent", message: "Please check your email for the verification code.", type: "success" });
      } catch (err: any) {
        setFeedback({ isOpen: true, title: "Error", message: err.response?.data?.msg || "Failed to send OTP.", type: "error" });
      } finally {
        setSendingRegisterOtp(false);
      }
    } else if (view === "forgot") {
      if (!resetData.email) {
        setFeedback({ isOpen: true, title: "Email Required", message: "Please enter your email address.", type: "error" });
        return;
      }
      try {
        await api.post("/api/auth/forgot-password", { email: resetData.email });
        setFeedback({ isOpen: true, title: "OTP Sent", message: "Please check your email for the verification code.", type: "success" });
        setView("reset");
      } catch (err: any) {
        setFeedback({ isOpen: true, title: "Error", message: err.response?.data?.msg || "Failed to send OTP.", type: "error" });
      }
    } else if (view === "reset") {
      if (resetData.newPassword !== resetData.confirmNewPassword) {
        setFeedback({ isOpen: true, title: "Password Mismatch", message: "Passwords do not match.", type: "error" });
        return;
      }
      try {
        await api.post("/api/auth/reset-password", {
          email: resetData.email,
          otp: resetData.otp,
          newPassword: resetData.newPassword
        });
        setFeedback({ isOpen: true, title: "Success", message: "Password reset successfully! You can now login.", type: "success" });
        setView("login");
      } catch (err: any) {
        setFeedback({ isOpen: true, title: "Reset Failed", message: err.response?.data?.msg || "Failed to reset password.", type: "error" });
      }
    }
  };

  const handleVerifyAndRegister = async () => {
    if (verifyingRegistration) return;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPattern.test(registerData.password)) {
      setFeedback({ isOpen: true, title: "Weak Password", message: "Password must be at least 8 characters with uppercase, lowercase, and 1 special character.", type: "error" });
      return;
    }
    try {
      setVerifyingRegistration(true);
      const addressDetails = {
        blk: registerData.blk,
        lot: registerData.lot,
        street: registerData.street,
        subdivision: registerData.subdivision,
        barangay: registerData.barangay,
        city: registerData.city,
        province: registerData.province,
        zipCode: registerData.zipCode,
      };
      await api.post("/api/auth/register", {
        ...registerData,
        otp,
        address: `${registerData.street}, ${registerData.barangay}, ${registerData.city}, ${registerData.province}`,
        addressDetails,
      });
      setFeedback({ isOpen: true, title: "Registration Submitted", message: "Thanks for registering. Please wait for the admin to approve your account.", type: "success" });
      setShowOtpModal(false);
      setOtp("");
      setView("login");
    } catch (err: any) {
      setFeedback({ isOpen: true, title: "Registration Failed", message: err.response?.data?.msg || "Something went wrong.", type: "error" });
    } finally {
      setVerifyingRegistration(false);
    }
  };

  const handleResendRegisterOtp = async () => {
    if (sendingRegisterOtp) return;
    try {
      setSendingRegisterOtp(true);
      await api.post("/api/auth/send-otp", { email: registerData.email });
      setFeedback({ isOpen: true, title: "OTP Resent", message: "A new OTP has been sent to your email.", type: "success" });
    } catch (err: any) {
      setFeedback({ isOpen: true, title: "Resend Failed", message: err.response?.data?.msg || "Failed to resend OTP.", type: "error" });
    } finally {
      setSendingRegisterOtp(false);
    }
  };

  useEffect(() => {
    if (!loginLoading) return;
    const timer = setInterval(() => {
      setLoginProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 250);
    return () => clearInterval(timer);
  }, [loginLoading]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      navigate(getRoleHome(getRole()));
    }
  }, [navigate]);

  const currentUpdate = liveUpdates[currentUpdateIndex] || { category: "Announcement", text: "Loading updates..." };

  const getUpdateIcon = (moduleOrCategory?: string) => {
    const key = (moduleOrCategory || "").toLowerCase();
    if (key.includes("weather")) return <CloudSun size={16} className="text-orange-500" />;
    if (key.includes("phivolcs")) return <Activity size={16} className="text-red-500" />;
    if (key.includes("fact")) return <CheckCircle size={16} className="text-emerald-500" />;
    return <Megaphone size={16} className="text-blue-500" />;
  };

  return (
    <div className={`relative flex min-h-screen w-full flex-col items-center overflow-x-hidden overflow-y-hidden bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 font-sans selection:bg-blue-100 selection:text-blue-900 ${view === "create" ? "justify-start" : "justify-center"}`}>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50" />
        
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 45, 0]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-[12%] -left-[18%] h-[360px] w-[360px] rounded-full bg-blue-200/30 blur-[100px] sm:-left-[10%] sm:h-[600px] sm:w-[600px]"
        />

        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-[24%] -right-[24%] h-[320px] w-[320px] rounded-full bg-indigo-200/30 blur-[120px] sm:-right-[10%] sm:h-[500px] sm:w-[500px]"
        />

        <motion.div 
          animate={{ 
            x: [0, 60, 0],
            y: [0, -60, 0],
          }}
          transition={{ 
            duration: 22, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute -bottom-[26%] left-[10%] h-[380px] w-[380px] rounded-full bg-sky-200/30 blur-[100px] sm:-bottom-[20%] sm:left-[20%] sm:h-[700px] sm:w-[700px]"
        />
      </div>

      <div className="relative z-10 mb-3 w-full max-w-[520px] lg:hidden">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e293b] text-sm font-bold text-white">BT</div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900" >BAYANTRACK +</h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Mambog II, Bacoor</p>
          </div>
        </div>
      </div>

      <div className={`relative z-10 flex w-full max-w-6xl flex-col items-center gap-4 sm:gap-6 lg:items-start lg:gap-12 ${view === "create" ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
        
        {/* LEFT SIDE: Branding (Hidden on mobile) */}
        <motion.div layout transition={{ type: "spring", stiffness: 100, damping: 20 }} className="hidden flex-1 flex-col gap-6 lg:flex sticky top-20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1e293b] text-white font-bold text-xl">
              BT
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">BAYANTRACK +</h1>
              <p className="text-xs font-semibold text-slate-500 tracking-widest uppercase">Mambog II, Bacoor</p>
            </div>
          </div>
          <h2 className="text-6xl font-extrabold text-[#2563eb] leading-tight">
            Digital Governance <br /> Made Simple.
          </h2>
          <p className="max-w-md text-lg text-slate-600 leading-relaxed">
            Access barangay services, stay updated with news, and report community issues all in one secure platform.
          </p>

          {/* Live Updates Ticker */}
          <div className="mt-8 w-full max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Community Updates</span>
            </div>
            
            <div className="relative h-24 w-full">
              <motion.div
                key={currentUpdateIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col justify-center rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  {getUpdateIcon(currentUpdate.module || currentUpdate.category)}
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">{currentUpdate.category}</span>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {currentUpdate.text}
                </p>
              </motion.div>
            </div>

            <div className="flex gap-1.5 mt-4 pl-1">
              {liveUpdates.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-500 ${idx === currentUpdateIndex ? "w-8 bg-blue-600" : "w-2 bg-slate-300"}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT SIDE: Dynamic Card */}
        <motion.div layout transition={{ type: "spring", stiffness: 100, damping: 20 }} className="w-full max-w-[520px] rounded-[24px] border border-white/60 bg-white/90 p-4 shadow-2xl shadow-blue-900/5 backdrop-blur-2xl sm:rounded-[32px] sm:p-6 md:rounded-[40px] md:p-8">
          
          {/* --- LOGIN VIEW --- */}
          {view === "login" && (
            <>
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">Resident Login</h3>
              <p className="mt-2 text-sm text-slate-500">Enter your credentials to access the resident portal.</p>
              {loginLoading && (
                <div className="mt-4">
                  <p className="mb-1 text-xs font-semibold text-slate-500">Logging in... {loginProgress}%</p>
                  <div className="h-2 w-full rounded bg-slate-200">
                    <div className="h-2 rounded bg-blue-600 transition-all duration-200" style={{ width: `${loginProgress}%` }} />
                  </div>
                </div>
              )}
              <form className="mt-6 flex flex-col gap-4 sm:mt-8 sm:gap-5" onSubmit={handleAction}>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Username / Email / Phone</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><User size={18} /></span>
                    <input type="text" required placeholder="Username, Email, Phone, or approved child name/email" name="identifier" value={loginData.identifier} onChange={handleLoginChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 text-sm outline-none transition focus:border-blue-500 focus:bg-white sm:py-4 sm:pl-12" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></span>
                    <input type={showPassword ? "text" : "password"} required placeholder="••••••••" name="password" value={loginData.password} onChange={handleLoginChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm outline-none transition focus:border-blue-500 focus:bg-white sm:py-4 sm:pl-12 sm:pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button disabled={loginLoading} type="submit" className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#1e293b] py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:mt-2 sm:py-4">
                  {loginLoading ? "Logging in..." : "Login to Portal"} <ArrowRight size={18} />
                </button>
              </form>
              <div className="mt-7 sm:mt-10">
                <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Quick Access</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => setView("create")} className="w-full rounded-xl border border-slate-200 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 sm:py-4">Create Resident Account</button>
                  <button onClick={() => setView("forgot")} className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 sm:py-4">Forgot Password</button>
                </div>
              </div>
            </>
          )}

          {/* --- FORGOT PASSWORD VIEW --- */}
          {view === "forgot" && (
            <>
              <button onClick={() => setView("login")} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600"><ArrowLeft size={16} /> Back to Login</button>
              <h3 className="mt-5 text-3xl font-extrabold text-slate-900 sm:mt-6 sm:text-4xl">Forgot Password</h3>
              <p className="mt-3 text-slate-500">Enter your email address to reset your password.</p>
              <form className="mt-10 flex flex-col gap-6" onSubmit={handleAction}>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18} /></span>
                    <input type="email" required placeholder="your@email.com" name="email" value={resetData.email} onChange={handleResetChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-5 pl-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white" />
                  </div>
                </div>
                <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-[#1e293b] py-5 text-sm font-bold text-white transition hover:bg-slate-800">Get OTP</button>
              </form>
            </>
          )}

          {/* --- RESET PASSWORD VIEW --- */}
          {view === "reset" && (
            <>
              <button onClick={() => setView("forgot")} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600"><ArrowLeft size={16} /> Back</button>
              <h3 className="mt-6 text-3xl font-bold text-slate-900">Reset Password</h3>
              <p className="mt-3 text-slate-500">Enter the OTP sent to your email and your new password.</p>
              <form className="mt-6 flex flex-col gap-4 sm:mt-8 sm:gap-5" onSubmit={handleAction}>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">OTP Code</label>
                  <input type="text" required placeholder="Enter 6-digit OTP" name="otp" value={resetData.otp} onChange={handleResetChange} maxLength={6} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 px-4 text-center text-lg font-bold tracking-widest outline-none transition focus:border-blue-500 focus:bg-white" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">New Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></span>
                    <input type={showResetPassword ? "text" : "password"} required placeholder="Input a password" name="newPassword" value={resetData.newPassword} onChange={handleResetChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm outline-none transition focus:border-blue-500 focus:bg-white sm:py-4 sm:pl-12 sm:pr-12" />
                    <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></span>
                    <input type={showResetConfirmPassword ? "text" : "password"} required placeholder="Confirm your password" name="confirmNewPassword" value={resetData.confirmNewPassword} onChange={handleResetChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm outline-none transition focus:border-blue-500 focus:bg-white sm:py-4 sm:pl-12 sm:pr-12" />
                    <button type="button" onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showResetConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#1e293b] py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:py-4">
                  Reset Password
                </button>
              </form>
            </>
          )}

          {/* --- CREATE ACCOUNT VIEW --- */}
          {view === "create" && (
            <div className="max-h-[72vh] overflow-y-auto pr-1 custom-scrollbar sm:max-h-[80vh] sm:pr-2">
              <button onClick={() => setView("login")} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition"><ArrowLeft size={16} /> Back to Login</button>
              <h3 className="mt-4 text-2xl font-bold text-slate-900 sm:mt-6 sm:text-3xl">Create Account</h3>
              <p className="mt-2 text-sm text-slate-500">Register to join the Mambog II community portal.</p>
              
              <form className="mt-6 flex flex-col gap-4 pb-3 sm:mt-8 sm:gap-5 sm:pb-4" onSubmit={handleAction}>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Username</label>
                  <input type="text" placeholder="Username" name="username" value={registerData.username} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs outline-none focus:border-blue-500 focus:bg-white" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">First Name</label>
                    <input type="text" placeholder="First Name" name="firstName" value={registerData.firstName} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Middle Name</label>
                    <input type="text" placeholder="Optional" name="middleName" value={registerData.middleName} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Last Name</label>
                    <input type="text" placeholder="Last Name" name="lastName" value={registerData.lastName} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Gender</label>
                    <select name="gender" value={registerData.gender} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs outline-none focus:border-blue-500 focus:bg-white">
                      <option value="prefer-not-to-say">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Civil Status</label>
                    <select name="civilStatus" value={registerData.civilStatus} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs outline-none focus:border-blue-500 focus:bg-white">
                      <option value="single">Single</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Street</label>
                    <input type="text" placeholder="Street / Road in Mambog II" name="street" value={registerData.street} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Barangay</label>
                    <input type="text" name="barangay" value="Mambog II" disabled className="w-full rounded-xl border border-slate-100 bg-slate-100 p-3 text-xs text-slate-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">City</label>
                    <input type="text" name="city" value="Bacoor" disabled className="w-full rounded-xl border border-slate-100 bg-slate-100 p-3 text-xs text-slate-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Province</label>
                    <input type="text" name="province" value="Cavite" disabled className="w-full rounded-xl border border-slate-100 bg-slate-100 p-3 text-xs text-slate-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">ZIP</label>
                    <input type="text" name="zipCode" value="4102" disabled className="w-full rounded-xl border border-slate-100 bg-slate-100 p-3 text-xs text-slate-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Phone No.</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={14} /></span>
                      <input type="text" placeholder="09XX XXX XXXX" name="contactNumber" value={registerData.contactNumber} onChange={handleRegisterChange} maxLength={11} className="w-full rounded-xl border border-slate-100 bg-slate-50 py-3 pl-9 text-xs outline-none focus:border-blue-500 focus:bg-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={14} /></span>
                      <input type="email" placeholder="your@email.com" name="email" value={registerData.email} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 py-3 pl-9 text-xs outline-none focus:border-blue-500 focus:bg-white" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-xs text-blue-700">
                  Email notifications are currently disabled.
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valid ID Type</label>
                    <select
                      value={registerData.validIdType}
                      onChange={handleIdTypeChange}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="barangay-id">Barangay ID</option>
                      <option value="voters-id">Voter's ID</option>
                      <option value="other">Other Government ID</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Upload Valid ID</label>
                    <div className="relative flex min-h-[124px] w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 transition hover:bg-slate-100 cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleValidIdUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center gap-2 text-center text-slate-400">
                        <Upload size={20} />
                        <span className="text-[10px]">{registerData.validIdImage ? "Valid ID uploaded" : "Click or drag to upload image"}</span>
                      </div>
                    </div>
                    {registerData.validIdImage && (
                      <img
                        src={registerData.validIdImage}
                        alt="Valid ID preview"
                        className="mt-2 h-20 w-full rounded-lg border border-slate-200 object-cover"
                      />
                    )}
                  </div>

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
                    <div className="relative">
                      <input type={showRegisterPassword ? "text" : "password"} placeholder="Input a password here" name="password" value={registerData.password} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 pr-10 text-xs outline-none focus:border-blue-500 focus:bg-white" />
                      <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showRegisterPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Confirm Password</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" name="confirmPassword" value={registerData.confirmPassword} onChange={handleRegisterChange} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 pr-10 text-xs outline-none focus:border-blue-500 focus:bg-white" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                    </div>
                  </div>
                </div>
                <p className="px-1 text-[10px] text-slate-500">Password: minimum 8 characters, 1 uppercase, 1 lowercase, 1 special character.</p>

                <p className="px-1 text-[10px] text-slate-500">Username, contact number, and email must be unique before account submission.</p>

                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="h-4 w-4 rounded border-slate-200" />
                  <p className="text-[10px] text-slate-500">I accept the <span className="text-blue-600 underline">Terms & Conditions</span> and <span className="text-blue-600 underline">Privacy Policy</span>.</p>
                </div>

                <button disabled={sendingRegisterOtp} type="submit" className="mt-2 rounded-xl bg-[#1e293b] py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:py-4">
                  {sendingRegisterOtp ? "Sending OTP..." : "Register Account"}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>

      <div className="relative z-10 mt-4 w-full max-w-[520px] rounded-2xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:mt-6 sm:p-5 lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Community Updates
          </span>
        </div>
        <div className="flex items-start gap-2">
          {getUpdateIcon(currentUpdate.module || currentUpdate.category)}
          <p className="max-h-12 overflow-hidden text-sm font-medium leading-6 text-slate-700">{currentUpdate.text}</p>
        </div>
      </div>

      {/* OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Enter OTP</h3>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <p className="mt-2 text-sm text-slate-500">We sent a 6-digit code to <span className="font-bold text-slate-700">{registerData.email}</span></p>
            
            <div className="mt-6">
              <input type="text" placeholder="123456" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-2xl font-bold tracking-widest outline-none focus:border-blue-500 focus:bg-white" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={sendingRegisterOtp}
                onClick={handleResendRegisterOtp}
                className="rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:py-4"
              >
                {sendingRegisterOtp ? "Sending..." : "Resend OTP"}
              </button>
              <button
                type="button"
                disabled={verifyingRegistration}
                onClick={handleVerifyAndRegister}
                className="rounded-xl bg-[#1e293b] py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:py-4"
              >
                {verifyingRegistration ? "Verifying..." : "Verify & Register"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sendingRegisterOtp && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
            <p className="text-sm font-semibold text-slate-900">Sending OTP</p>
            <p className="mt-1 text-xs text-slate-500">Please wait, do not close this screen.</p>
          </div>
        </div>
      )}

      <FeedbackModal 
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        title={feedback.title}
        message={feedback.message}
        type={feedback.type}
      />
    </div>
  );
};

export default Login;





