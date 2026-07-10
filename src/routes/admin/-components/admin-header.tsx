import { useNavigate } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AdminHeader({
  children,
  title,
}: {
  children?: ReactNode;
  title: string;
}) {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    await navigate({ to: "/login" });
  }

  return (
    <>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        {children}
        <Button type="button" disabled={isSigningOut} onClick={signOut}>
          <LogOutIcon data-icon="inline-start" />
          Logout
        </Button>
      </div>
    </>
  );
}
