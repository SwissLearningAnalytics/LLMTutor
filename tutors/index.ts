// This file is auto-generated. Do not edit directly.
import type { Tutor } from "@/lib/types/tutor";

export async function getTutor(tutorId: string): Promise<Tutor> {
  switch (tutorId) {
    case "erwachsene":
      return (await import("./tutors/erwachsene.yaml")).default as Tutor;
    case "gruppenstatistiken":
      return (await import("./tutors/gruppenstatistiken.yaml")).default as Tutor;
    case "individualdiagnostik":
      return (await import("./tutors/individualdiagnostik.yaml")).default as Tutor;
    case "kinder":
      return (await import("./tutors/kinder.yaml")).default as Tutor;
    case "korrelation":
      return (await import("./tutors/korrelation.yaml")).default as Tutor;
    case "regression":
      return (await import("./tutors/regression.yaml")).default as Tutor;
    case "t-test":
      return (await import("./tutors/t-test.yaml")).default as Tutor;
    default:
      throw new Error("Tutor not found");
  }
}

export const tutorIds = [
  "erwachsene",
  "gruppenstatistiken",
  "individualdiagnostik",
  "kinder",
  "korrelation",
  "regression",
  "t-test",
];
