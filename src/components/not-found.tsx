import { TriangleAlert } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-grow items-center justify-center gap-4 pt-32">
      <TriangleAlert size={40} className="text-gray-400" />
      <h1 className="text-[3rem] text-gray-400"> Not Found</h1>
    </div>
  );
}
