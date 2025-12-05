export function LoadingDots() {
  return (
    <div className="my-12 flex w-full justify-center space-x-2">
      <span className="h-2 w-2 animate-bounce rounded-full bg-secondary [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-secondary [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-secondary" />
    </div>
  );
}
