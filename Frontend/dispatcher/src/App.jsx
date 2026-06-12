import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// Layout
import RootLayout from "./components/RootLayout";

// Public Pages
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";

// Admin Pages
import AdminDashboard from "./components/AdminDashboard";
import ManageUsers from "./components/ManageUsers";
import BusinessSettings from "./components/BusinessSettings";
import CreateOrder from "./components/CreateOrder";
import ShopSetup from "./components/ShopSetup";
// Rider Pages
import RiderDashboard from "./components/RiderDashboard";
import MyOrders from "./components/MyOrders"
import Earnings from "./components/Earnings";

// Onboarding & Shop Owner Pages
import CreateShop from "./components/CreateShop";
import JoinShop from "./components/JoinShop";
import PendingApprovalPage from "./components/PendingApprovalPage";
import ShopDashboard from "./components/ShopDashboard";
import ShopOrders from "./components/ShopOrders";
import ShopRiders from "./components/ShopRiders";
import ShopTracking from "./components/ShopTracking";
import RiderAnalytics from "./components/RiderAnalytics";

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";

// Toast
import { Toaster } from "react-hot-toast";

function App() {

  const routerObj = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [

        // Home
        {
          path: "",
          element: <Home />,
        },

        // Auth
        {
          path: "login",
          element: <Login />,
        },

        {
          path: "register",
          element: <Register />,
        },

        // Admin Routes
        {
          path: "admin/dashboard",
          element: (
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          ),
        },

        {
          path: "admin/users",
          element: (
            <ProtectedRoute role="admin">
              <ManageUsers />
            </ProtectedRoute>
          ),
        },

        {
          path: "admin/settings",
          element: (
            <ProtectedRoute role="admin">
              <BusinessSettings />
            </ProtectedRoute>
          ),
        },

        // Rider Routes
        {
          path: "rider/dashboard",
          element: (
            <ProtectedRoute role="rider">
              <RiderDashboard />
            </ProtectedRoute>
          ),
        },

        {
          path: "rider/orders",
          element: (
            <ProtectedRoute role="rider">
              <MyOrders />
            </ProtectedRoute>
          ),
        },

        {
          path: "rider/earnings",
          element: (
            <ProtectedRoute role="rider">
              <Earnings />
            </ProtectedRoute>
          ),
        },

        // Onboarding Routes (Pending states)
        {
          path: "create-shop",
          element: (
            <ProtectedRoute role="shop_owner" allowPending={true}>
              <CreateShop />
            </ProtectedRoute>
          ),
        },
        {
          path: "join-shop",
          element: (
            <ProtectedRoute role="rider" allowPending={true}>
              <JoinShop />
            </ProtectedRoute>
          ),
        },
        {
          path: "pending-approval",
          element: (
            <ProtectedRoute role="rider" allowPending={true}>
              <PendingApprovalPage />
            </ProtectedRoute>
          ),
        },

        // Shop Owner Routes
        {
          path: "shop/dashboard",
          element: (
            <ProtectedRoute role="shop_owner">
              <ShopDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "shop/orders",
          element: (
            <ProtectedRoute role="shop_owner">
              <ShopOrders />
            </ProtectedRoute>
          ),
        },
        {
          path: "shop/create-order",
          element: (
            <ProtectedRoute role="shop_owner">
              <CreateOrder />
            </ProtectedRoute>
          ),
        },
        {
          path: "shop/riders",
          element: (
            <ProtectedRoute role="shop_owner">
              <ShopRiders />
            </ProtectedRoute>
          ),
        },

        {
          path: "shop/tracking",
          element: (
            <ProtectedRoute role="shop_owner">
              <ShopTracking />
            </ProtectedRoute>
          ),
        },
        {
          path: "shop/analytics",
          element: (
            <ProtectedRoute role="shop_owner">
              <RiderAnalytics />
            </ProtectedRoute>
          ),
        },
        {
          path: "shop/settings",
          element: (
            <ProtectedRoute role="shop_owner">
              <ShopSetup />
            </ProtectedRoute>
          ),
        },
        
      ],
    },
  ]);

  return (
    <div>
      <RouterProvider router={routerObj} />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;