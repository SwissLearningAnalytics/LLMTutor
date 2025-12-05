import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export function Layout({
  children,
  header,
  noConstrain = false,
  flex = false,
  sidebox,
}: {
  children: ReactNode;
  header: ReactNode;
  noConstrain?: boolean;
  flex?: boolean;
  sidebox?: ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full flex-col bg-surface-background-secondary px-3 pt-0 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-4 pl-1.5 text-sm text-white sm:gap-6">
        {header}
      </header>
      <div className="flex flex-1 gap-4 overflow-hidden">
        <main
          className={cn(
            "w-full overflow-y-auto rounded-t-lg bg-surface-background-primary",
            !noConstrain && "p-3 py-14 sm:p-6 sm:py-28",
            !!sidebox && "w-2/3",
          )}
        >
          <div
            className={cn(
              "h-full",
              flex && "flex",
              !noConstrain && "mx-auto max-w-3xl",
            )}
          >
            {children}
          </div>
        </main>
        {sidebox && (
          <aside className="w-1/3 overflow-y-auto rounded-t-lg bg-surface-background-primary p-3 sm:p-6">
            {sidebox}
          </aside>
        )}
      </div>
    </div>
  );
}
