import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/test")({
  server: {
    handlers: {
      GET: async () => {
        auth.api.createUser({
          body: {
            email: "jutz@ubique.ch",
            password: "admin",
            name: "Jeremias Jutz",
            role: "admin",
          },
        });
        return new Response("OK");
      },
    },
  },
});
