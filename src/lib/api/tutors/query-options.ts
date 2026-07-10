import { queryOptions } from "@tanstack/react-query";
import { getTutor, getTutors } from "@/lib/api/tutors/tutors.functions";

export function getTutorsOptions() {
  return queryOptions({
    queryKey: ["tutors"],
    queryFn: getTutors,
  });
}

export function getTutorOptions(tutorId: string) {
  return queryOptions({
    queryKey: ["tutors", tutorId],
    queryFn: () => getTutor({ data: { tutorId } }),
  });
}
