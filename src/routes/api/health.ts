import { createServerFileRoute } from "@tanstack/react-start/server";
import { json } from "@tanstack/react-start";

export const ServerRoute = createServerFileRoute("/api/health").methods({
  GET: ({ request, params }) => {
    return json({ message: "OK" });
  },
});
