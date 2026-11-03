import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ChevronDownIcon,
  GraduationCapIcon,
  LogOutIcon,
  type LucideIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { hasAdminRole } from "@/lib/auth-roles";
import { cn } from "@/lib/utils/cn";
import { TutorGuideLink } from "@/routes/admin/-components/tutor-guide-link";

const adminSections = [
  { to: "/admin/models", label: "Modelle", icon: SparklesIcon },
  { to: "/admin/users", label: "Benutzer", icon: UsersIcon },
] as const;

export function AdminLayout({
  actions,
  children,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <Layout header={<AdminHeader actions={actions} />}>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-semibold text-primary">{title}</h1>
        {children}
      </div>
    </Layout>
  );
}

function AdminHeader({ actions }: { actions?: ReactNode }) {
  const { data: session } = authClient.useSession();
  const isAdmin = hasAdminRole(session?.user);
  const pathname = useLocation({ select: (location) => location.pathname });
  // Everything under /admin that isn't another section belongs to the tutors
  const isTutorsSection = !adminSections.some((section) =>
    pathname.startsWith(section.to),
  );

  return (
    <>
      {isAdmin && (
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          <AdminSectionLink
            to="/admin"
            icon={GraduationCapIcon}
            active={isTutorsSection}
          >
            Tutoren
          </AdminSectionLink>
          {adminSections.map((section) => (
            <AdminSectionLink
              key={section.to}
              to={section.to}
              icon={section.icon}
              active={pathname.startsWith(section.to)}
            >
              {section.label}
            </AdminSectionLink>
          ))}
        </nav>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {isTutorsSection && <TutorGuideLink />}
        {actions}
        <UserMenu name={session?.user.name} email={session?.user.email} />
      </div>
    </>
  );
}

function AdminSectionLink({
  active,
  children,
  icon: Icon,
  to,
}: {
  active: boolean;
  children: ReactNode;
  icon: LucideIcon;
  to: "/admin" | (typeof adminSections)[number]["to"];
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white",
        active && "bg-white/15 text-white",
      )}
    >
      <Icon aria-hidden className="size-4" />
      {children}
    </Link>
  );
}

function UserMenu({ name, email }: { name?: string; email?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    queryClient.clear();
    await navigate({ to: "/login" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" aria-label="Benutzermenü">
          <UserIcon />
          <span className="hidden max-w-40 truncate sm:inline">
            {name ?? "Konto"}
          </span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-lg border-border-primary bg-surface-primary text-primary shadow-floating"
      >
        {email && (
          <>
            <DropdownMenuLabel className="truncate font-normal text-secondary">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border-primary" />
          </>
        )}
        <DropdownMenuItem disabled={isSigningOut} onSelect={signOut}>
          <LogOutIcon />
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
