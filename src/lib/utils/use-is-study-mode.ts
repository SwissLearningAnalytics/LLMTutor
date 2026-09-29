import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useMemo } from "react";

const isStudyMode = createIsomorphicFn()
  .server(
    () =>
      new URL(getRequest().url).hostname !==
      import.meta.env.VITE_NON_STUDY_MODE_HOSTNAME,
  )
  .client(
    () =>
      window.location.hostname !== import.meta.env.VITE_NON_STUDY_MODE_HOSTNAME,
  );

export function useIsStudyMode() {
  return useMemo(() => isStudyMode(), []);
}
