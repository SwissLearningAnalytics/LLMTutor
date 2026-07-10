import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser } from "@/lib/auth.functions";
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
  return (
    <div className="grid min-h-dvh place-items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const email = formData.get("email")?.toString();
          const password = formData.get("password")?.toString();
          if (!email || !password) {
            // TODO: Error handling
            return;
          }
          authClient.signIn.email({
            email,
            password,
            fetchOptions: {
              onSuccess: () => {
                navigate({ to: redirect });
              },
            },
          });
        }}
        className="flex w-full max-w-xl flex-col gap-8"
      >
        <Label className="flex flex-col gap-2">
          Email
          <Input type="email" autoComplete="email" name="email" required />
        </Label>
        <Label className="flex flex-col gap-2">
          Password
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </Label>
        <Button type="submit">Login</Button>
        <Button
          type="button"
          onClick={() => {
            createUser();
          }}
        >
          Mock
        </Button>
      </form>
    </div>
  );
}
