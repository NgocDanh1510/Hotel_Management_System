import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import HotelListPage from "@/pages/HotelListPage";
import HotelDetailPage from "@/pages/HotelDetailPage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import ProfilePage from "@/pages/ProfilePage";
import MyBookingsPage from "@/pages/MyBookingsPage";
import BookingDetailPage from "@/pages/BookingDetailPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminHotelsPage from "@/pages/admin/AdminHotelsPage";
import AdminBookingsPage from "@/pages/admin/AdminBookingsPage";
import AdminReviewsPage from "@/pages/admin/AdminReviewsPage";
import AdminPaymentsPage from "@/pages/admin/AdminPaymentsPage";
import AdminAmenitiesPage from "@/pages/admin/AdminAmenitiesPage";
import AdminRoomsPage from "@/pages/admin/AdminRoomsPage";
import AdminRolesPage from "@/pages/admin/AdminRolesPage";
import AdminPermissionsPage from "@/pages/admin/AdminPermissionsPage";
import AdminImagesPage from "@/pages/admin/AdminImagesPage";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/hotels",
    element: <HotelListPage />,
  },
  {
    path: "/hotels/:slug",
    element: <HotelDetailPage />,
  },
  {
    path: "/forbidden",
    element: <ForbiddenPage />,
  },
  // Protected Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/me",
        element: <ProfilePage />,
      },
      {
        path: "/me/bookings",
        element: <MyBookingsPage />,
      },
      {
        path: "/bookings/:id",
        element: <BookingDetailPage />,
      },
    ],
  },
  // Admin Routes
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "users",
        element: <AdminUsersPage />,
      },
      {
        path: "hotels",
        element: <AdminHotelsPage />,
      },
      {
        path: "rooms",
        element: <AdminRoomsPage />,
      },
      {
        path: "bookings",
        element: <AdminBookingsPage />,
      },
      {
        path: "reviews",
        element: <AdminReviewsPage />,
      },
      {
        path: "payments",
        element: <AdminPaymentsPage />,
      },
      {
        path: "amenities",
        element: <AdminAmenitiesPage />,
      },
      {
        path: "roles",
        element: <AdminRolesPage />,
      },
      {
        path: "permissions",
        element: <AdminPermissionsPage />,
      },
      {
        path: "images",
        element: <AdminImagesPage />,
      },
    ],
  },
]);

export default router;
