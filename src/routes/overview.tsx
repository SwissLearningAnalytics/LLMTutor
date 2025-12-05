import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { getTutor, tutorIds } from "@/tutors";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/overview")({
  component: RouteComponent,
  loader: async () => {
    const tutors = await Promise.all(
      tutorIds.map(async (id) => {
        try {
          return await getTutor(id);
        } catch (error) {
          console.error("Error loading tutor:", error);
          return undefined;
        }
      }),
    );
    return tutors;
  },
});

function RouteComponent() {
  const tutors = Route.useLoaderData();
  return (
    <div>
      <Layout header={""}>
        <ul className="space-y-2">
          {Object.values(tutors).map((tutor) => (
            <li key={tutor?.tutor_id}>
              <Link
                to={"/$tutor_id"}
                params={{ tutor_id: tutor?.tutor_id ?? "" }}
              >
                <Button>{tutor?.displayName}</Button>
              </Link>
            </li>
          ))}
        </ul>
      </Layout>
    </div>
  );
}
