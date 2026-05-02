import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CreditCard,
  Hotel,
  LayoutDashboard,
  LogOut,
  Menu,
  Star,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Hotels", path: "/admin/hotels", icon: Hotel },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarCheck },
  { label: "Reviews", path: "/admin/reviews", icon: Star },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
];

const LayoutAdmin = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Hotel Management
              </p>
              <h1 className="mt-2 text-xl font-semibold">Admin Workspace</h1>
            </div>

            <nav className="flex-1 space-y-2 px-4 py-5">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || "Admin"}
                </p>
                <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Admin
              </p>
              <p className="text-sm text-slate-500">
                Giao diện tối giản để test nghiệp vụ backend
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="inline-flex rounded-xl border border-slate-300 p-2 text-slate-700 lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-5">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default LayoutAdmin;
