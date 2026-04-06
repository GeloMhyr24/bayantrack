import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Info, User } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api, authHeaders } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { FeedbackModal } from "@/components/FeedbackModal";

type AddressDetails = {
  street: string;
  subdivision: string;
};

const DEFAULT_ADDRESS: AddressDetails = {
  street: "",
  subdivision: "",
};

export default function ProfileSettings() {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState("");
  const [showPasswordOtpModal, setShowPasswordOtpModal] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    gender: "prefer-not-to-say",
    civilStatus: "single",
    avatarImage: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [addressDetails, setAddressDetails] = useState<AddressDetails>(DEFAULT_ADDRESS);
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await api.get("/api/auth/user", { headers: authHeaders() });
        const user = userRes.data;
        setFormData((prev) => ({
          ...prev,
          username: user.username || "",
          firstName: user.firstName || "",
          middleName: user.middleName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          contactNumber: user.contactNumber || "",
          gender: user.gender || "prefer-not-to-say",
          civilStatus: "single",
          avatarImage: user.avatarImage || "",
          newPassword: "",
          confirmNewPassword: "",
        }));
        setAddressDetails({
          street: user.addressDetails?.street || "",
          subdivision: user.addressDetails?.subdivision || "",
        });
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      }
    };

    void fetchProfile();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ isOpen: true, title: "Image Too Large", message: "Profile image must be 2MB or below.", type: "error" });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatarImage: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      setFeedback({ isOpen: true, title: "Password Mismatch", message: "New password and confirm password do not match.", type: "error" });
      return;
    }

    if (formData.newPassword && !passwordOtp) {
      setOtpSending(true);
      try {
        await api.post("/api/auth/change-password/request-otp", {}, { headers: authHeaders() });
        setShowPasswordOtpModal(true);
        setFeedback({ isOpen: true, title: "OTP Sent", message: "Check your registered email for the password-change OTP.", type: "success" });
      } catch (err: any) {
        setFeedback({ isOpen: true, title: "OTP Failed", message: err.response?.data?.msg || "Could not send password OTP.", type: "error" });
      } finally {
        setOtpSending(false);
      }
      return;
    }

    setSaving(true);
    try {
      await api.put(
        "/api/auth/user",
        {
          username: formData.username,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          contactNumber: formData.contactNumber,
          avatarImage: formData.avatarImage,
          gender: formData.gender,
          civilStatus: "single",
          marriageContractImage: "",
          preferredContactMethod: "Email",
          addressDetails: {
            street: addressDetails.street,
            subdivision: addressDetails.subdivision,
            barangay: "Mambog II",
            city: "Bacoor",
            province: "Cavite",
            zipCode: "4102",
          },
          children: [],
          ...(formData.newPassword ? { password: formData.newPassword, passwordOtp } : {}),
        },
        { headers: authHeaders() },
      );

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      setPasswordOtp("");
      setShowPasswordOtpModal(false);
      setFormData((prev) => ({ ...prev, newPassword: "", confirmNewPassword: "" }));
    } catch (err: any) {
      setFeedback({ isOpen: true, title: "Update Failed", message: err.response?.data?.msg || "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#f1f5f9]">
      <Header />

      {showToast ? (
        <div className="fixed right-4 top-24 z-50 md:right-8">
          <div className="rounded-md border border-[#22c55e] bg-[#e6fce5] px-5 py-3 text-sm text-[#166534] shadow-md">
            <span className="font-bold">Success!</span> Profile updated successfully.
          </div>
        </div>
      ) : null}

  
        <main className="flex flex-grow items-start justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-10">
            <div className="mb-6">
              <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#395886]">
                <User size={22} strokeWidth={2.5} /> Profile Settings
              </h1>

              <div className="mb-8 flex items-start gap-3 rounded-md border border-[#e2e8f0] bg-[#f4f7fb] p-4">
                <Info className="mt-0.5 shrink-0 text-gray-500" size={16} />
                <p className="text-[13px] leading-relaxed text-gray-600">
                  Account updates are reflected in admin and superadmin resident details.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <img
                        src={formData.avatarImage || "https://placehold.co/120x120/e2e8f0/475569?text=Profile"}
                        alt="Profile"
                        className="h-24 w-24 rounded-full border border-slate-200 object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Resident Profile Photo</p>
                        <p className="mt-1 text-xs text-slate-500">Use a clear image. Maximum file size is 2MB.</p>
                        <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        <button
                          className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          Choose Profile Photo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Name Layout</p>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-800">First Name</label>
                        <input className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-700" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-800">Middle Name</label>
                        <input className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-700" name="middleName" value={formData.middleName} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-800">Last Name</label>
                        <input className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-700" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Account and Contact</p>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-800">Username</label>
                        <input className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-700" name="username" value={formData.username} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-800">Email</label>
                        <input className="w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-700" name="email" value={formData.email} readOnly />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-800">Contact Number</label>
                        <input className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-700" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-800">Preferred Updates</label>
                        <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
                          Email notifications are currently disabled.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">Gender</label>
                      <select className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-700" name="gender" value={formData.gender} onChange={handleInputChange}>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">Civil Status</label>
                      <input className="w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-700" value="Single" readOnly />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <h2 className="text-sm font-bold text-[#1e3a8a]">Address</h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">Street</label>
                      <input className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-700" name="street" value={addressDetails.street} onChange={handleAddressChange} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">Comp/Subd (Optional)</label>
                      <input className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-700" name="subdivision" value={addressDetails.subdivision} onChange={handleAddressChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">Barangay</label>
                      <input className="w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-700" value="Mambog II" readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">City</label>
                      <input className="w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-700" value="Bacoor" readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">Province</label>
                      <input className="w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-700" value="Cavite" readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">ZIP Code</label>
                      <input className="w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-700" value="4102" readOnly />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <h2 className="text-sm font-bold text-[#1e3a8a]">Password and Security</h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">New Password (Optional)</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className="w-full rounded-md border border-gray-300 p-2.5 pr-10 text-sm text-gray-700"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                        />
                        <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="w-full rounded-md border border-gray-300 p-2.5 pr-10 text-sm text-gray-700"
                          name="confirmNewPassword"
                          value={formData.confirmNewPassword}
                          onChange={handleInputChange}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-2">
                  <button disabled={saving} className="w-full rounded-md bg-[#395886] py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60" type="submit">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
    

      {showPasswordOtpModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Verify Password Change</h3>
              <button type="button" onClick={() => setShowPasswordOtpModal(false)}>Close</button>
            </div>
            <p className="mb-3 text-sm text-slate-600">Enter the 6-digit OTP sent to your registered email.</p>
            <input
              value={passwordOtp}
              onChange={(e) => setPasswordOtp(e.target.value)}
              maxLength={6}
              placeholder="123456"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-center tracking-[0.3em]"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  setOtpSending(true);
                  try {
                    await api.post("/api/auth/change-password/request-otp", {}, { headers: authHeaders() });
                    setFeedback({ isOpen: true, title: "OTP Resent", message: "A new OTP was sent to your registered email.", type: "success" });
                  } catch (err: any) {
                    setFeedback({ isOpen: true, title: "OTP Failed", message: err.response?.data?.msg || "Could not resend OTP.", type: "error" });
                  } finally {
                    setOtpSending(false);
                  }
                }}
                disabled={otpSending}
                className="rounded-md border border-slate-300 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
              >
                {otpSending ? "Sending..." : "Resend OTP"}
              </button>
              <button type="button" onClick={() => setShowPasswordOtpModal(false)} className="rounded-md bg-slate-900 py-2 text-sm font-semibold text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        title={feedback.title}
        message={feedback.message}
        type={feedback.type}
      />
      <Footer />
    </div>
  );
}
