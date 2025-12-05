import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tutor")({
  beforeLoad: () => {
    throw redirect({
      to: "/$tutor_id",
      params: {
        tutor_id: "regression",
      },
      search: {},
    });
  },
});
