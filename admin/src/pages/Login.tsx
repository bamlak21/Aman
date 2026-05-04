import { SideImage } from "../components/SideImage";
import { useForm } from "react-hook-form";
import type { LoginResponse, adminLogin } from "../types/auth";
import { auth } from "../api/auth.api";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import { Bug } from "lucide-react";
import axios from "axios";
import { loginSchema, type LoginSchema } from "../validation/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-hot-toast";

interface ResError {
  error: string;
  message: string;
}

const Login = () => {
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });
  const { login } = useAuthStore();

  const submit = async (data: adminLogin) => {
    try {
      setError(null);
      const d = await auth.login(data);
      Toast.success(d.message || "Login successful");
      login(d.admin, d.accessToken);
      navigate("/dashboard");
    } catch (error: unknown) {
      if (axios.isAxiosError<ResError>(error)) {
        Toast.error(error?.response?.data?.message || "Login failed");
      } else {
        Toast.error("Something went Wrong");
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4">
      <div className="flex-1 hidden md:block rounded-2xl overflow-hidden">
        <SideImage />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <p className="text-white bg-red-500 rounded p-2 flex justify-center items-center gap-2 mb-4">
              <Bug size={18} /> {error}
            </p>
          )}
          <div className="flex flex-col items-center gap-2 mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Admin Portal</h2>
            <p className="text-gray-500 text-center">
              Enter your email and password to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(submit)}>
            <div className="flex flex-col gap-1 mb-4">
              <label htmlFor="email" className="font-semibold text-gray-700">
                Email
              </label>
              <input
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-0 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition"
                type="email"
                id="email"
                placeholder="Enter your email"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1 mb-4">
              <label htmlFor="password" className="font-semibold text-gray-700">
                Password
              </label>
              <input
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-0 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition"
                type="password"
                id="password"
                placeholder="Enter your password"
                {...register("password", { required: "Password is required" })}
              />

              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>
            <div className="mb-4 flex justify-between items-center">
              <label htmlFor="remember" className="flex items-center text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  id="remember"
                  className="mr-2 accent-gray-700"
                />
                Remember Me
              </label>
              <a href="#" className="text-sm text-[hsl(var(--accent))] hover:underline">
                Forgot password?
              </a>
            </div>
            <button
              className="w-full h-11 bg-gray-900 text-white rounded-lg text-base font-semibold hover:bg-gray-800 transition"
              type="submit"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
