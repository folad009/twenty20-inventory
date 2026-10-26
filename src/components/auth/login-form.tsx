"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: ActionResult = { success: true };

const demoHintId = "login-demo-hint";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="auth-form-inner">
      <header className="auth-form-header">
        <h2 id="login-heading" className="font-heading text-2xl font-bold tracking-tight">
          Sign in
        </h2>
        <p id={demoHintId} className="mt-1.5 text-sm text-muted-foreground">
          Use your team credentials to access the console.
        </p>
      </header>

      <form
        action={formAction}
        className="auth-form-fields"
        aria-labelledby="login-heading"
        aria-describedby={demoHintId}
      >
        {state.success === false && (
          <Alert variant="destructive" role="alert" aria-live="polite">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue="manager@inventory.local"
            className="auth-input h-10"
            aria-invalid={state.success === false ? true : undefined}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            defaultValue="password123"
            className="auth-input h-10"
            aria-invalid={state.success === false ? true : undefined}
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="auth-submit h-10 w-full"
          aria-busy={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
