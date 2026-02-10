import { SideImage } from "../components/SideImage";
import { useForm } from "react-hook-form";
import type { RegUser } from "../types/auth";
import { auth } from "../api/auth.api";
import { useAuthStore } from "../store/useAuthStore";

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegUser>({
    defaultValues: {
      role: "client",
    },
  });

  const { login } = useAuthStore();

  const submit = async (data: RegUser) => {
    const res = await auth.register(data);
    login(res.user, res.accessToken);
  };

  return (
    <div className="flex h-dvh p-2">
      {/* Place Holder image */}
      <SideImage />
      {/* Sign up form */}
      <div className="flex-1 h-full flex flex-col items-center justify-center">
        <div className="gap-5">
          <div className="flex flex-col items-center justify-center gap-2">
            <h2 className="text-5xl font-semibold">Create Your Account</h2>
            <p className="text-md text-gray-600">
              Enter your details to create an account
            </p>
          </div>

          <form className="mt-5" onSubmit={handleSubmit(submit)}>
            <div className="flex flex-col gap-1.5 mb-3">
              <label htmlFor="name" className="text-sm font-semibold">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="p-2 bg-gray-200 rounded-lg outline-0 placeholder-gray-600"
                placeholder="Enter your name"
                {...register("name", { required: "Name is Required" })}
              />
              {errors.name && (
                <p className="text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 mb-3">
              <label htmlFor="email" className="text-sm font-semibold">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="p-2 bg-gray-200 rounded-lg outline-0 placeholder-gray-600"
                placeholder="Enter your email"
                {...register("email", { required: "Email is Required" })}
              />
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="p-2 bg-gray-200 rounded-lg outline-0 placeholder-gray-600"
                placeholder="Enter your password"
                {...register("password", { required: "Password is Required" })}
              />
              {errors.password && <p>{errors.password.message}</p>}
            </div>

            <fieldset className="mt-3 flex gap-3 items-center justify-start">
              <legend className="text-sm font-semibold mb-2">
                I want to join as
              </legend>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="client"
                  className="accent-[hsl(var(--accent))]"
                  {...register("role")}
                />
                Client
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="freelancer"
                  className="accent-[hsl(var(--accent))]"
                  {...register("role")}
                />
                Freelancer
              </label>

              {errors.role && <p>{errors.role.message}</p>}
            </fieldset>

            <button className="text-md font-semibold mt-3 rounded-lg w-full bg-[hsl(var(--accent))] py-2 text-white">
              Submit
            </button>
          </form>
        </div>
        <p className="fixed bottom-10 ">
          Already have an account?{" "}
          <a href="/sign-in" className="text-[hsl(var(--accent))]">
            Sign in
          </a>{" "}
        </p>
      </div>
    </div>
  );
};

export default Register;
