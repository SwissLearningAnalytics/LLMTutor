export function DevTag() {
  if (import.meta.env.MODE === "prod") {
    return null;
  }
  return (
    <div className="fixed right-8 bottom-0 pr-1 pb-1 text-xs opacity-50 transition-opacity duration-200 hover:opacity-100">
      {import.meta.env.MODE} {import.meta.env.VITE_APP_VERSION}
    </div>
  );
}
