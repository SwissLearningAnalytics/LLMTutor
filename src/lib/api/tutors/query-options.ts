import { queryOptions } from "@tanstack/react-query";
import {
  getOwnTutor,
  getOwnTutors,
  getTutor,
  getTutors,
} from "@/lib/api/tutors/tutors.functions";

export function getTutorsOptions() {
  return queryOptions({
    queryKey: ["tutors", "published"],
    queryFn: getTutors,
  });
}

export function getTutorOptions(tutorId: string) {
  return queryOptions({
    queryKey: ["tutors", "published", tutorId],
    queryFn: () => getTutor({ data: { tutorId } }),
  });
}

export function getOwnTutorsOptions() {
  return queryOptions({
    queryKey: ["tutors", "mine"],
    queryFn: getOwnTutors,
  });
}

export function getOwnTutorOptions(tutorId: string) {
  return queryOptions({
    queryKey: ["tutors", "mine", tutorId],
    queryFn: () => getOwnTutor({ data: { tutorId } }),
  });
}
