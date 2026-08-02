// export function AuthPage() {
//   return (
//     <section className="panel">
//       <h1>Authentication Shell</h1>
//       <p className="muted">TODO: implement registration, login, JWT storage, and current-user retrieval.</p>
//       <ul className="todo-list">
//         <li>Email/password registration.</li>
//         <li>Sign in and sign out.</li>
//         <li>Auth error states.</li>
//         <li>Protected route handling.</li>
//       </ul>
//     </section>
//   );
// }

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerUser, loginUser } from "../services/authApi";
import { getToken } from "../services/apiClient";

const authFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof authFormSchema>;

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(authFormSchema),
  });

  useEffect(() => {
    if (getToken()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  async function onSubmit(values: FormValues) {
    setError(null);
    if (mode === "register" && !values.name) {
      setError("Name is required");
      return;
    }
    try {
      if (mode === "register") {
        await registerUser(values.name!, values.email, values.password);
      } else {
        await loginUser(values.email, values.password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="mb-4 text-xl font-bold">{mode === "login" ? "Sign In" : "Register"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-sm flex-col gap-3">
        {mode === "register" && (
          <label className="text-sm font-medium">
            Name
            <input
              type="text"
              {...register("name")}
              className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-xs text-red-700">{errors.name.message}</p>}
          </label>
        )}

        <label className="text-sm font-medium">
          Email
          <input
            type="email"
            {...register("email")}
            className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
          />
          {errors.email && <p className="mt-1 text-xs text-red-700">{errors.email.message}</p>}
        </label>

        <label className="text-sm font-medium">
          Password
          <input
            type="password"
            {...register("password")}
            className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
          />
          {errors.password && <p className="mt-1 text-xs text-red-700">{errors.password.message}</p>}
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
        >
          {isSubmitting ? "Please wait..." : mode === "login" ? "Sign In" : "Register"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
            reset();
          }}
          className="font-semibold text-teal-800 hover:underline"
        >
          {mode === "login" ? "Register" : "Sign In"}
        </button>
      </p>
    </section>
  );
}