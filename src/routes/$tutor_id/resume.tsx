import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { redeemResumeCode } from "@/lib/api/tutor-sessions";
import { writeTutorSession } from "@/lib/tutorSessionStorage";

// opened from a resume link, the code is in the fragment so it is never sent to the server as part of the url
export const Route = createFileRoute("/$tutor_id/resume")({
  component: RouteComponent,
});

function RouteComponent() {
  const tutorId = Route.useParams({
    select: (params) => params.tutor_id,
  });
  const navigate = Route.useNavigate();
  const [failed, setFailed] = useState(false);
  const redeemRequested = useRef(false);

  useEffect(() => {
    if (redeemRequested.current) {
      return;
    }
    redeemRequested.current = true;

    const code = window.location.hash.slice(1);
    // the link only works once, it should not stay in the history
    window.history.replaceState(null, "", window.location.pathname);
    if (!code) {
      setFailed(true);
      return;
    }

    redeemResumeCode({ data: { tutorId, code } })
      .then((credentials) => {
        writeTutorSession(tutorId, credentials);
        navigate({
          to: "/$tutor_id/tutor",
          params: { tutor_id: tutorId },
          replace: true,
        });
      })
      .catch((error) => {
        console.error("Error resuming session: ", error);
        setFailed(true);
      });
  }, []);

  if (!failed) {
    return <Loading />;
  }

  return (
    <div className="grid h-dvh w-full place-items-center p-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="text-base">
          Dieser Link ist ungültig oder abgelaufen. Bitte frag nach einem neuen
          Link.
        </p>
        <Link to="/$tutor_id" params={{ tutor_id: tutorId }}>
          <Button variant={"neutral"}>Neue Sitzung starten</Button>
        </Link>
      </div>
    </div>
  );
}
