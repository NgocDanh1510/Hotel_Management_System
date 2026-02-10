import { useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BedDouble,
  Blocks,
  CalendarCheck,
  CreditCard,
  Hotel,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Star,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  {
    label: "Dashboard",
    description: "Tổng quan vận hành",
    path: "/partner/dashboard",
    icon: LayoutDashboard,
    matches: ["/partner", "/partner/dashboard"],
  },
  {
    label: "Hotels",
    description: "Hồ sơ khách sạn",
    path: "/partner/hotels",
    icon: Hotel,
  },
  {
    label: "Room Types",
    description: "Loại phòng và giá",
    path: "/partner/room-types",
    icon: BedDouble,
  },
  {
    label: "Rooms",
    description: "Phòng thực tế",
    path: "/partner/rooms",
    icon: BedDouble,
  },
  {
    label: "Bookings",
    description: "Đơn đặt phòng",
    path: "/partner/bookings",
    icon: CalendarCheck,
  },
  {
    label: "Reviews",
    description: "Phản hồi khách hàng",
    path: "/partner/reviews",
    icon: Star,
  },
  {
    label: "Images",
    description: "Thư viện ảnh",
    path: "/partner/images",
    icon: Image,
  },
  {
    label: "Amenities",
    description: "Tiện ích lưu trú",
    path: "/partner/amenities",
    icon: Blocks,
  },
  {
    label: "Payments",
    description: "Giao dịch và doanh thu",
    path: "/partner/payments",
    icon: CreditCard,
  },
];

const LayoutPartner = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = useMemo(
    () =>
      navItems.find((item) =>
        item.matches
          ? item.matches.includes(location.pathname)
          : location.pathname === item.path,
      ) || navItems[0],
    [location.pathname],
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-emerald-100 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-emerald-100 px-5 py-5">
              <Link
                to="/partner/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Hotel size={21} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Partner Center
                  </p>
                  <h1 className="truncate text-lg font-semibold text-slate-950">
                    Stay Ease Host
                  </h1>
                </div>
              </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => {
                    const active =
                      isActive || item.matches?.includes(location.pathname);

                    return `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                        : "text-slate-600 hover:bg-emerald-50 hover:text-slate-950"
                    }`;
                  }}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      item.matches?.includes(location.pathname) ||
                      location.pathname === item.path
                        ? "bg-white/15"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-700"
                    }`}
                  >
                    <item.icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs opacity-75">
                      {item.description}
                    </span>
                  </span>
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-emerald-100 p-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {user?.name || "Hotel partner"}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {user?.email || "partner workspace"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Partner Workspace
                </p>
                <div className="mt-1 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
                  <h2 className="truncate text-xl font-semibold text-slate-950">
                    {currentPage.label}
                  </h2>
                  <p className="truncate text-sm text-slate-500">
                    {currentPage.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/hotels"
                  className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:inline-flex"
                >
                  Xem trang khách
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen((current) => !current)}
                  className="inline-flex rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50 lg:hidden"
                  aria-label="Toggle partner menu"
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
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
          aria-label="Close partner menu"
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default LayoutPartner;
