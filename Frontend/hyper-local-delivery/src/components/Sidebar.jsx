import React from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authstore";

const Sidebar = () => {

  const user = useAuthStore((state) => state.user);

  return (
    <aside className="w-64 min-h-screen bg-white shadow-md p-5">

      <h1 className="text-2xl font-bold text-blue-600 mb-8">
        Dashboard
      </h1>

      <div className="flex flex-col gap-4">

        {/* Admin Sidebar */}
        {user?.role === "admin" && (
          <>

            <Link
              to="/admin/dashboard"
              className="px-4 py-2 rounded-lg hover:bg-blue-100"
            >
              📊 Dashboard
            </Link>

            <Link
              to="/admin/create-order"
              className="px-4 py-2 rounded-lg hover:bg-blue-100"
            >
              ➕ Create Order
            </Link>

            <Link
              to="/admin/orders"
              className="px-4 py-2 rounded-lg hover:bg-blue-100"
            >
              📦 Orders
            </Link>

            <Link
              to="/admin/riders"
              className="px-4 py-2 rounded-lg hover:bg-blue-100"
            >
              🛵 Riders
            </Link>

            <Link
              to="/admin/tracking"
              className="px-4 py-2 rounded-lg hover:bg-blue-100"
            >
              📍 Live Tracking
            </Link>

          </>
        )}

        {/* Rider Sidebar */}
        {user?.role === "rider" && (
          <>

            <Link
              to="/rider/dashboard"
              className="px-4 py-2 rounded-lg hover:bg-green-100"
            >
              🏠 Dashboard
            </Link>

            <Link
              to="/rider/orders"
              className="px-4 py-2 rounded-lg hover:bg-green-100"
            >
              📦 My Orders
            </Link>

            <Link
              to="/rider/earnings"
              className="px-4 py-2 rounded-lg hover:bg-green-100"
            >
              💰 Earnings
            </Link>

          </>
        )}

      </div>

    </aside>
  );
};

export default Sidebar;