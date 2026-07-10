import { mutationOptions } from "@tanstack/react-query";
import {
  createTutor,
  deleteTutor,
  updateTutor,
} from "@/lib/api/tutors/tutors.functions";

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

export function deleteTutorOptions() {
  return mutationOptions({
    mutationFn: deleteTutor,
  });
}
