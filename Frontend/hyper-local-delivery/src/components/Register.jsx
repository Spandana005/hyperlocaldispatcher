import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import useAuthStore from "../store/authstore";

const Register = () => {

  const navigate = useNavigate();

  // Zustand Register Function
  const register = useAuthStore(
    (state) => state.register
  );

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "rider",
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

    console.log("REGISTER BUTTON CLICKED");

    try {

      console.log("FORM DATA:", formData);

      // Backend Register API
      const response = await register(formData);

      console.log("REGISTER RESPONSE:", response);

      alert("Registration Successful");

      navigate("/login");

    } catch (error) {

      console.log("REGISTER ERROR:", error);

      alert(error.message);

    }

  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">

      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-green-600 mb-6">
          Register
        </h1>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >

          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Enter Name"
            value={formData.name}
            onChange={handleChange}
            className="border p-3 rounded-lg outline-none"
            required
          />

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

          {/* Phone */}
          <input
            type="tel"
            name="phone"
            placeholder="Enter Phone Number"
            value={formData.phone}
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

          {/* Role */}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="border p-3 rounded-lg outline-none"
          >

            <option value="rider">
              Rider
            </option>

            <option value="admin">
              Admin
            </option>

          </select>

          {/* Button */}
          <button
            type="submit"
            className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
          >
            Register
          </button>

        </form>

        {/* Login Link */}
        <p className="text-center mt-5 text-gray-600">

          Already have an account?

          <Link
            to="/login"
            className="text-blue-600 ml-2 font-semibold"
          >
            Login
          </Link>

        </p>

      </div>

    </div>
  );
};

export default Register;