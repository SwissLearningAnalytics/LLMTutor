import { createFileRoute } from "@tanstack/react-router";
import { AlertCircleIcon, LogInIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
});

function RouteComponent() {
  const { redirect } = Route.useSearch();
  const navigate = Route.useNavigate();
  const session = authClient.useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isPending = session.isPending || isSigningIn;
  const redirectTo = redirect || "/admin";

  useEffect(() => {
    if (!session.data) {
      return;
    }

    navigate({ to: redirectTo });
  }, [navigate, redirectTo, session.data]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    setIsSigningIn(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    setIsSigningIn(false);

    if (error) {
      setErrorMessage(getSignInErrorMessage(error));
      return;
    }

    await session.refetch();
    await navigate({ to: redirectTo });
  }

  return (
    <main className="grid min-h-dvh bg-surface-background-secondary px-4 py-8 text-primary sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)]">
        <section className="hidden max-w-xl flex-col gap-5 text-white md:flex">
          <img
            src="/favicon_insitura.svg"
            alt=""
            className="size-12 mix-blend-screen"
          />
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold">Tutor Administration</h1>
            <p className="text-base text-white/75">
              Sign in to manage tutors, user accounts, and admin access.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-border-primary bg-surface-primary p-5 shadow-floating sm:p-6">
          <form onSubmit={signIn} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-primary">Login</h1>
              <p className="text-sm text-secondary">
                Use your admin account to continue.
              </p>
            </div>

            {session.error && (
              <LoginError message="Could not check your current session." />
            )}

            {errorMessage && <LoginError message={errorMessage} />}

            <Label className="flex flex-col gap-2">
              Email
              <Input
                type="email"
                autoComplete="email"
                name="email"
                disabled={isPending}
                required
              />
            </Label>

            <Label className="flex flex-col gap-2">
              Password
              <Input
                type="password"
                name="password"
                autoComplete="current-password"
                disabled={isPending}
                required
              />
            </Label>

            <Button type="submit" disabled={isPending}>
              <LogInIcon data-icon="inline-start" />
              {isPending ? "Signing in..." : "Login"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

function LoginError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border-feedback-negative bg-surface-feedback-negative-light p-3 text-feedback-negative">
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <FieldError>{message}</FieldError>
    </div>
  );
}

function getSignInErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  return "Could not sign in. Check your email and password.";
}
