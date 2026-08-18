import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";
import { seedAdminUserIfNotExists } from "@/lib/seed/user";

globalThis.Response = FastResponse;

await seedAdminUserIfNotExists();

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});
