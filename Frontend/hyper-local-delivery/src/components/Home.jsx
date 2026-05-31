import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">

      {/* Heading */}
      <h1 className="text-5xl font-bold text-blue-600 mb-6">
        🚚 HyperLocal Delivery Dispatcher
      </h1>

      {/* Description */}
      <p className="text-gray-700 text-lg max-w-2xl mb-8">
        Manage local store deliveries efficiently with
        real-time rider tracking, order management,
        and earnings dashboard.
      </p>

      {/* Buttons */}
      <div className="flex gap-5">

        <Link
          to="/login"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700"
        >
          Register
        </Link>

      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-bold mb-2">
            📦 Order Management
          </h2>

          <p className="text-gray-600">
            Create and manage delivery orders easily.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-bold mb-2">
            📍 Live Tracking
          </h2>

          <p className="text-gray-600">
            Track riders in real-time using GPS.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-bold mb-2">
            💰 Earnings Dashboard
          </h2>

          <p className="text-gray-600">
            Riders can monitor daily earnings instantly.
          </p>
        </div>

      </div>

    </div>
  );
};

export default Home;
