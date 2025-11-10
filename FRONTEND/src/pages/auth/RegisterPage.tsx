import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "@/api/authService";
import { AxiosError } from "axios";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name || name.length < 2 || name.length > 100) {
      newErrors.name = "Name must be between 2 and 100 characters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
      newErrors.password =
        "Password must contain at least 1 uppercase letter, 1 digit, and 1 special character";
    }

    if (phone && !/^0\d{1,10}$/.test(phone)) {
      newErrors.phone = "Phone must be in 0xxxxxxxxx format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg("");

    if (!validate()) return;

    setIsLoading(true);
    try {
      await authService.register({
        name,
        email,
        password,
        ...(phone && { phone }),
      });
      setSuccessMsg("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      if (err.response?.status === 409) {
        setErrors({ general: "Email already registered" });
      } else {
        setErrors({
          general:
            err.response?.data?.message ||
            "Registration failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.name ? "border-red-300" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.email ? "border-red-300" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.phone ? "border-red-300" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="0xxxxxxxxx"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.password ? "border-red-300" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {errors.general}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    {successMsg}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !!successMsg}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <span className="text-gray-600">Already have an account? </span>
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
