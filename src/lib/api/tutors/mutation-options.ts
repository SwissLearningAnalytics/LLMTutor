import { mutationOptions } from "@tanstack/react-query";
import { createTutor, updateTutor } from "@/lib/api/tutors/tutors.functions";

export function createTutorOptions() {
  return mutationOptions({
    mutationFn: createTutor,
  });
}

export function updateTutorOptions() {
  return mutationOptions({
    mutationFn: updateTutor,
  });
}
