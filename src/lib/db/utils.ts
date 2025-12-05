export type WithoutTimestampsOrId<T extends { createdAt: Date; id: number }> =
  Omit<T, "createdAt" | "id">;
