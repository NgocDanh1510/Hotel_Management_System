import { useEffect, useState } from "react";
import userService from "@/api/userService";
import {
  ClientMessage,
  ClientPanel,
  ClientSection,
} from "@/components/client/ClientPrimitives";
import type { UserProfile } from "@/types/user";
import { getApiErrorMessage } from "@/utils/client";

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [emailForm, setEmailForm] = useState({ new_email: "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await userService.getProfile();
        setProfile(response.data);
        setProfileForm({
          name: response.data.name || "",
          phone: response.data.phone || "",
        });
        setEmailForm({ new_email: response.data.email || "" });
      } catch (fetchError) {
        setError(
          getApiErrorMessage(fetchError, "Không tải được hồ sơ người dùng."),
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      const response = await userService.updateProfile(profileForm);
      setProfile(response.data);
      setMessage("Đã cập nhật thông tin hồ sơ.");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Không cập nhật được hồ sơ."));
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      await userService.updateEmail(emailForm.new_email);
      setMessage("Đã gửi cập nhật email thành công.");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Không cập nhật được email."));
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      await userService.updatePassword(
        passwordForm.current_password,
        passwordForm.new_password,
      );
      setPasswordForm({ current_password: "", new_password: "" });
      setMessage("Đã cập nhật mật khẩu.");
    } catch (submitError) {
      setError(
        getApiErrorMessage(submitError, "Không cập nhật được mật khẩu."),
      );
    }
  };

  if (loading) {
    return (
      <div className="h-[50vh] animate-pulse rounded-[32px] bg-white/70" />
    );
  }

  return (
    <div className="space-y-6">
      <ClientSection
        eyebrow="My Profile"
        title="Quản lý hồ sơ khách hàng"
        description="Các form bên dưới đang dùng trực tiếp endpoint `user/profile`, `user/email` và `user/password` của backend."
      >
        {message ? <ClientMessage tone="success" message={message} /> : null}
        {error ? <ClientMessage tone="error" message={error} /> : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ClientPanel className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Hồ sơ chính
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Thông tin liên hệ
              </h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Họ và tên
                </span>
                <input
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Số điện thoại
                </span>
                <input
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Lưu hồ sơ
              </button>
            </form>
          </ClientPanel>

          <ClientPanel className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Tóm tắt
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {profile?.name}
            </h2>
            <p className="text-sm text-slate-600">{profile?.email}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Total
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {profile?.booking_summary?.total || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Upcoming
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {profile?.booking_summary?.upcoming || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Completed
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {profile?.booking_summary?.completed || 0}
                </p>
              </div>
            </div>
          </ClientPanel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ClientPanel className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Email
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Cập nhật email đăng nhập
              </h2>
            </div>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                value={emailForm.new_email}
                onChange={(event) =>
                  setEmailForm({ new_email: event.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              />
              <button
                type="submit"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                Cập nhật email
              </button>
            </form>
          </ClientPanel>

          <ClientPanel className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Security
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Đổi mật khẩu
              </h2>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Mật khẩu hiện tại"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    current_password: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              />
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    new_password: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              />
              <button
                type="submit"
                className="rounded-full bg-amber-500 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-amber-400"
              >
                Đổi mật khẩu
              </button>
            </form>
          </ClientPanel>
        </div>
      </ClientSection>
    </div>
  );
};

export default ProfilePage;
