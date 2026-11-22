"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/login/actions";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-bold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="input"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-bold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
