export const Role = {
  User: "user",
  Ai: "ai",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
