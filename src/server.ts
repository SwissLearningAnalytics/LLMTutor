import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";
import { seedAiModelsIfEmpty } from "@/lib/seed/ai-models";
import { seedAdminUserIfNotExists } from "@/lib/seed/user";

globalThis.Response = FastResponse;

await seedAdminUserIfNotExists();
await seedAiModelsIfEmpty();

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});
