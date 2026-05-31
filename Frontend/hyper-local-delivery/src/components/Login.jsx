import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import useAuthStore from "../store/authstore";

const Login = () => {

  const navigate = useNavigate();

  // Zustand Login Function
  const login = useAuthStore(
    (state) => state.login
  );

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Handle Change
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  // Handle Submit
  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      // Backend Login API
      const response = await login(formData);

      // Redirect Based On Role
      if (response.user.role === "admin") {

        navigate("/admin/dashboard");

      } else {

        navigate("/rider/dashboard");

      }

    } catch (error) {

      alert(error.message);

    }

  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">

      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Login
        </h1>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
            className="border p-3 rounded-lg outline-none"
            required
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleChange}
            className="border p-3 rounded-lg outline-none"
            required
          />

          {/* Button */}
          <button
            type="submit"
            className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>

        </form>

        {/* Register Link */}
        <p className="text-center mt-5 text-gray-600">

          Don&apos;t have an account?

          <Link
            to="/register"
            className="text-blue-600 ml-2 font-semibold"
          >
            Register
          </Link>

        </p>

      </div>

    </div>
  );
};

export default Login;