import { SideImage } from "../components/SideImage";
import { useForm } from "react-hook-form";
import type { UserLogin } from "../types/auth";
import { auth } from "../api/auth.api";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import { Bug } from "lucide-react";
import axios from "axios";
import { loginSchema, type LoginSchema } from "../validation/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";

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

  const submit = async (data: UserLogin) => {
    try {
      setError(null);
      const d = await auth.login(data);

      login(d.user, d.accessToken);
      navigate("/dashboard");
    } catch (error: unknown) {
      if (axios.isAxiosError<ResError>(error)) {
        setError(error?.response?.data?.message ?? "Login failed");
      } else {
        setError("Something went Wrong");
      }
    }
  };

  return (
    <div className="flex h-dvh p-2">
      {/* Place Holder image */}
      <SideImage />
      {/* Sign In Form */}
      <div className="flex-1 h-full w-full flex flex-col items-center justify-center">
        <div className="gap-5">
          {/* Heading */}
          {error && (
            <p className="text-white bg-red-500 rounded p-1 flex justify-center items-center gap-5 mb-4">
              <Bug /> {error}
            </p>
          )}
          <div className="flex flex-col items-center justify-center gap-2">
            <h2 className="text-5xl font-semibold">Welcome Back</h2>
            <p className="text-md text-gray-600">
              Enter your email and password to access your account
            </p>
          </div>

          <form className="mt-5" onSubmit={handleSubmit(submit)}>
            <div className="flex flex-col justify-start gap-2 mb-4">
              <label htmlFor="email" className="font-semibold tracking-wider">
                Email
              </label>
              <input
                className="p-2 bg-gray-200 rounded-lg outline-0 placeholder-gray-600"
                type="email"
                id="email"
                placeholder="Enter your email"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-semibold">
                Password
              </label>
              <input
                className="p-2 bg-gray-200 rounded-lg outline-0 placeholder-gray-600"
                type="password"
                id="password"
                placeholder="Enter your password"
                {...register("password", { required: "Password is required" })}
              />

              {errors.password && (
                <p className="text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="mt-2 flex justify-between">
              <label htmlFor="remember">
                <input
                  type="checkbox"
                  name="remember"
                  id="remember"
                  placeholder="Remember Me"
                  className="mr-2"
                />
                Remember Me
              </label>
              <a href="#" className="text-[hsl(var(--accent))]">
                Forgot password?
              </a>
            </div>
            <button
              className="mt-3 mx-auto bg-[hsl(var(--accent))] text-white w-full h-10 rounded-md text-lg font-semibold"
              type="submit"
            >
              Login
            </button>
          </form>
        </div>
        <p className="fixed bottom-10 ">
          Don't have an account?{" "}
          <a href="/sign-up" className="text-[hsl(var(--accent))]">
            Sign up
          </a>{" "}
        </p>
      </div>
    </div>
  );
};

export default Login;
