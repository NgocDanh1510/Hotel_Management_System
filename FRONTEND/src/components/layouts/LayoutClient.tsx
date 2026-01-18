import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Compass,
  Hotel,
  LogOut,
  Menu,
  ReceiptText,
  Search,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const guestNav = [
  { to: "/", label: "Trang chủ", icon: Compass },
  { to: "/hotels", label: "Khách sạn", icon: Search },
];

const accountNav = [
  { to: "/me", label: "Hồ sơ", icon: UserRound },
  { to: "/me/bookings", label: "Booking của tôi", icon: CalendarDays },
  { to: "/me/payments", label: "Thanh toán", icon: ReceiptText },
  { to: "/me/reviews", label: "Đánh giá", icon: Star },
];

const LayoutClient = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = isAuthenticated ? [...guestNav, ...accountNav] : guestNav;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),linear-gradient(180deg,#fffaf2_0%,#f7f3ea_36%,#f6f7fb_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-[#fffaf0]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-11/12 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-amber-200/40">
              <Hotel size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                Stay Ease
              </p>
              <p className="text-lg font-semibold">
                Khách sạn cho mọi hành trình
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/me"}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {hasRole("admin") ? (
              <Link
                to="/admin"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                Admin
              </Link>
            ) : null}

            {isAuthenticated ? (
              <>
                <div className="rounded-full border border-white/70 bg-white px-4 py-2 text-sm shadow-sm">
                  <p className="font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Tạo tài khoản
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex rounded-2xl border border-slate-300 bg-white p-2 text-slate-700 lg:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="border-b border-white/70 bg-[#fffaf0] px-4 py-4 lg:hidden">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}

            <div className="pt-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto min-h-[calc(100vh-180px)] max-w-11/12 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/70 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-base font-semibold text-slate-900">
              Trải nghiệm đặt phòng rõ ràng, nhanh và dễ dùng.
            </p>
            <p className="mt-1">
              Dữ liệu lấy trực tiếp từ backend hiện tại để khách có thể tìm,
              đặt, thanh toán và quản lý booking ngay trên giao diện này.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/hotels" className="hover:text-slate-900">
              Khám phá khách sạn
            </Link>
            <Link to="/me/bookings" className="hover:text-slate-900">
              Booking của tôi
            </Link>
            <Link to="/me/reviews" className="hover:text-slate-900">
              Đánh giá của tôi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LayoutClient;
