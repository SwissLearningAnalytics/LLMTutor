// This file is auto-generated. Do not edit directly.
import type { Tutor } from "@/lib/types/tutor";

export async function getTutor(tutorId: string): Promise<Tutor> {
  switch (tutorId) {
    case "deskriptive_statistik_heilpaed_offen":
      return (await import("./tutors/deskriptive_statistik_heil.yaml")).default as Tutor;
    case "deskriptive_statistik_heilpaed_offen_2":
      return (await import("./tutors/deskriptive_statistik_heil_2.yaml")).default as Tutor;
    case "diagnostik_i_technischer_test":
      return (await import("./tutors/diagnostik_technischer_test.yaml")).default as Tutor;
    case "diagnostik_i_uebung":
      return (await import("./tutors/diagnostik_i.yaml")).default as Tutor;
    case "erwachsene":
      return (await import("./tutors/erwachsene.yaml")).default as Tutor;
    case "fernuni_cfa":
      return (await import("./tutors/fernuni_cfa.yaml")).default as Tutor;
    case "fernuni_mediation":
      return (await import("./tutors/fernuni_mediation.yaml")).default as Tutor;
    case "gruppenstatistiken":
      return (await import("./tutors/gruppenstatistiken.yaml")).default as Tutor;
    case "individualdiagnostik":
      return (await import("./tutors/individualdiagnostik.yaml")).default as Tutor;
    case "kinder":
      return (await import("./tutors/kinder.yaml")).default as Tutor;
    case "klinische_studien_master":
      return (await import("./tutors/Studien_Lesen_Tutor.yaml")).default as Tutor;
    case "korrelation":
      return (await import("./tutors/korrelation.yaml")).default as Tutor;
    case "leadership":
      return (await import("./tutors/leadership.yaml")).default as Tutor;
    case "regression":
      return (await import("./tutors/regression.yaml")).default as Tutor;
    case "t-test":
      return (await import("./tutors/t-test.yaml")).default as Tutor;
    case "variabel":
      return (await import("./tutors/variabel.yaml")).default as Tutor;
    default:
      throw new Error("Tutor not found");
  }
}

export const tutorIds = [
  "deskriptive_statistik_heilpaed_offen",
  "deskriptive_statistik_heilpaed_offen_2",
  "diagnostik_i_technischer_test",
  "diagnostik_i_uebung",
  "erwachsene",
  "fernuni_cfa",
  "fernuni_mediation",
  "gruppenstatistiken",
  "individualdiagnostik",
  "kinder",
  "klinische_studien_master",
  "korrelation",
  "leadership",
  "regression",
  "t-test",
  "variabel",
];
