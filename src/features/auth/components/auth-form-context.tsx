"use client";

import { createContext, useContext } from "react";

import { AuthFormState } from "@/features/auth/types/auth-form-state";

const AuthFormContext = createContext<AuthFormState | null>(null);

type AuthFormProviderProps = {
  value: AuthFormState;
  children: React.ReactNode;
};

export function AuthFormProvider({ value, children }: AuthFormProviderProps) {
  return <AuthFormContext.Provider value={value}>{children}</AuthFormContext.Provider>;
}

export function useAuthFormState() {
  return useContext(AuthFormContext);
}
