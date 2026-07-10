import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { getTutorsOptions } from "@/lib/api/tutors/query-options";

export const Route = createFileRoute("/overview")({
  component: RouteComponent,
  loader({ context: { queryClient } }) {
    queryClient.ensureQueryData(getTutorsOptions());
  },
});

function RouteComponent() {
  const { data: tutors } = useSuspenseQuery(getTutorsOptions());
  return (
    <div>
      <Layout header={""}>
        <ul className="space-y-2">
          {Object.values(tutors).map((tutor) => (
            <li key={tutor?.tutorId}>
              <Button asChild>
                <Link
                  to={"/$tutor_id"}
                  params={{ tutor_id: tutor?.tutorId ?? "" }}
                >
                  {tutor?.displayName}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </Layout>
    </div>
  );
}
