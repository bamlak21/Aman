import axios from "axios";
import toast from "react-hot-toast";
import { admin } from "../api/admin.api";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterSchema } from "../validation/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { userRegData } from "../types/auth";

type ConfirmModalProps = {
    isOpen: boolean;
    onClose: () => void;
}

const UserRegModal = ({ isOpen, onClose }: ConfirmModalProps) => {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<RegisterSchema>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: "client" }
    });

    if (!isOpen) return null;

    const createUser = async (data: userRegData) => {
        setLoading(true);
        try {
            await admin.newUser(data);
            toast.success("User created successfully");
            setLoading(false);
            reset();
            onClose();
        } catch (error) {
            setLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                console.error(error);
                toast.error("An unexpected error occurred");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
                >
                    ✕
                </button>
                <h2 className="text-xl font-bold mb-4">Register User</h2>
                <form onSubmit={handleSubmit(createUser)}>
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
                            <p className="text-red-500 text-sm">{errors.name.message}</p>
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
                            <p className="text-red-500 text-sm">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5 mb-3">
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
                        {errors.password && (
                            <p className="text-red-500 text-sm">{errors.password.message}</p>
                        )}
                    </div>
                    <fieldset className="mb-3">
                        <legend className="text-sm font-semibold mb-2">
                            I want to join as
                        </legend>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="client"
                                    className="accent-[hsl(var(--accent))]"
                                    {...register("role")}
                                />
                                Client
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="freelancer"
                                    className="accent-[hsl(var(--accent))]"
                                    {...register("role")}
                                />
                                Freelancer
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="admin"
                                    className="accent-[hsl(var(--accent))]"
                                    {...register("role")}
                                />
                                Admin
                            </label>
                        </div>
                        {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
                    </fieldset>
                    <button
                        type="submit"
                        disabled={loading}
                        className="text-md font-semibold rounded-lg w-full bg-black py-2 text-white disabled:opacity-50"
                    >
                        {loading ? "Creating Account..." : "Submit"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserRegModal;