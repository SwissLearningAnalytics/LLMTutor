import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTutorsOptions } from "@/lib/api/tutors/query-options";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
  loader({ context: { queryClient } }) {
    queryClient.ensureQueryData(getTutorsOptions());
  },
});

function RouteComponent() {
  const { data: tutors } = useSuspenseQuery(getTutorsOptions());
  return (
    <div>
      Hello "/admin/"!<pre>{JSON.stringify(tutors, null, 2)}</pre>
      <Button className="absolute top-6 right-6" asChild>
        <Link to="/admin/create">
          <PlusIcon data-icon="inline-start" />
          Create Tutor
        </Link>
      </Button>
    </div>
  );
}
