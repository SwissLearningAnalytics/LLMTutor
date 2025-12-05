import { useMemo } from "react";

function isStudyMode() {
  return (
    window.location.hostname !== import.meta.env.VITE_NON_STUDY_MODE_HOSTNAME
  );
}
export function useIsStudyMode() {
  return useMemo(() => isStudyMode(), []);
}
