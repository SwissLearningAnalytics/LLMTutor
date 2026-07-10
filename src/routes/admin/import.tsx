import { createFileRoute } from "@tanstack/react-router";
import { importTutors } from "@/lib/api/tutors/tutors.functions";

export const Route = createFileRoute("/admin/import")({
  server: {
    handlers: {
      GET: async () => {
        await importTutors();
        return new Response("Import abgeschlossen");
      },
    },
  },
});
