"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Shared visual input primitive. It changes presentation only; native input semantics remain intact. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("input-base min-w-0", className)} {...props} />;
});

Input.displayName = "Input";
