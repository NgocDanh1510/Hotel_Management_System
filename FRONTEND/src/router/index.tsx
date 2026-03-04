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
import MyPaymentsPage from "@/pages/MyPaymentsPage";
import MyReviewsPage from "@/pages/MyReviewsPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminHotelsPage from "@/pages/admin/AdminHotelsPage";
import AdminBookingsPage from "@/pages/admin/AdminBookingsPage";
import AdminReviewsPage from "@/pages/admin/AdminReviewsPage";
import AdminPaymentsPage from "@/pages/admin/AdminPaymentsPage";
import AdminWithdrawalsPage from "@/pages/admin/AdminWithdrawalsPage";
import AdminAmenitiesPage from "@/pages/admin/AdminAmenitiesPage";
import AdminRoomTypesPage from "@/pages/admin/AdminRoomTypesPage";
import AdminRoomsPage from "@/pages/admin/AdminRoomsPage";
import AdminRolesPage from "@/pages/admin/AdminRolesPage";
import AdminPermissionsPage from "@/pages/admin/AdminPermissionsPage";
import AdminImagesPage from "@/pages/admin/AdminImagesPage";
import PartnerDashboard from "@/pages/partner/PartnerDashboard";
import PartnerHotelsPage from "@/pages/partner/PartnerHotelsPage";
import PartnerRoomTypesPage from "@/pages/partner/PartnerRoomTypesPage";
import PartnerRoomsPage from "@/pages/partner/PartnerRoomsPage";
import PartnerBookingsPage from "@/pages/partner/PartnerBookingsPage";
import PartnerReviewsPage from "@/pages/partner/PartnerReviewsPage";
// import PartnerImagesPage from "@/pages/partner/PartnerImagesPage";
// import PartnerAmenitiesPage from "@/pages/partner/PartnerAmenitiesPage";
import PartnerPaymentsPage from "@/pages/partner/PartnerPaymentsPage";
import PartnerWalletPage from "@/pages/partner/PartnerWalletPage";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import PartnerRoute from "./PartnerRoute";
import LayoutClient from "@/components/layouts/LayoutClient";

const router = createBrowserRouter([
  {
    element: <LayoutClient />,
    children: [
      {
        index: true,
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
            path: "/me/payments",
            element: <MyPaymentsPage />,
          },
          {
            path: "/me/reviews",
            element: <MyReviewsPage />,
          },
          {
            path: "/bookings/:id",
            element: <BookingDetailPage />,
          },
        ],
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
        path: "room-types",
        element: <AdminRoomTypesPage />,
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
        path: "withdrawals",
        element: <AdminWithdrawalsPage />,
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
  // Partner Routes
  {
    path: "/partner",
    element: <PartnerRoute />,
    children: [
      {
        index: true,
        element: <PartnerDashboard />,
      },
      {
        path: "dashboard",
        element: <PartnerDashboard />,
      },
      {
        path: "hotels",
        element: <PartnerHotelsPage />,
      },
      {
        path: "room-types",
        element: <PartnerRoomTypesPage />,
      },
      {
        path: "rooms",
        element: <PartnerRoomsPage />,
      },
      {
        path: "bookings",
        element: <PartnerBookingsPage />,
      },
      {
        path: "reviews",
        element: <PartnerReviewsPage />,
      },
      // {
      //   path: "images",
      //   element: <PartnerImagesPage />,
      // },
      // {
      //   path: "amenities",
      //   element: <PartnerAmenitiesPage />,
      // },
      {
        path: "payments",
        element: <PartnerPaymentsPage />,
      },
      {
        path: "wallet",
        element: <PartnerWalletPage />,
      },
    ],
  },
]);

export default router;
