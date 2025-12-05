import type { Feedback } from "@/lib/feedback/types";

// @Patricia - I added the questions in the new structure here, the nonStudyFeedback is just a placeholder

export const studyFeedback: Feedback = {
  user: [
    {
      label: "externalResource",
      text: "Haben Sie für Ihre Antwort externe Ressourcen gebraucht?",
      tooltip:
        "Haben Sie bei der Beurteilung der Qualität der Aussage des Tutors ODER bei der Ausarbeitung Ihrer Antwort, externe Quellen wie z.B. Unterrichtsmaterial, Google, Websites usw. genutzt?",
      options: ["Nein", "Ja"],
    },
    {
      label: "thoughtAboutIndex",
      text: "Wie aktiv haben Sie nachgedacht (0 = gar nicht, 10 = sehr aktiv)?",
      tooltip:
        "Aktives Nachdenken bedeutet, dass Sie sich bewusst mit dem Inhalt auseinandergesetzt haben – etwa indem Sie sich selbst Fragen gestellt, kritisch reflektiert, das Thema mit bereits Gelerntem verknüpft oder an konkrete Beispiele und Praxissituationen gedacht haben. Aktives Nachdenken zahlt sich aus – es verbessert nicht nur Ihr Verständnis, sondern auch Ihren Lernerfolg.",
      // generated strings 0 to 10
      options: Array.from({ length: 11 }, (_, i) => i.toString()),
    },
  ],
  ai: [
    {
      label: "isSuitable",
      text: "Die Aussage des Tutors ist angemessen / zum Gespräch passend?",
      tooltip:
        "Wählen Sie „Nein“, wenn die Aussage im Kontext des Gesprächs unerwartet oder nicht sinnvoll ist. Das ist zum Beispiel der Fall, wenn sie deutlich von der sokratischen Methode abweicht, keinen Bezug mehr zum Fallbeispiel oder zum aktuellen Thema hat, unerwartet von Ihrer Frage oder Anweisung abweicht oder ein erwarteter (fiktiver) statistischer Output fehlt.",
      options: ["Nein", "Ja"],
    },
    {
      label: "isCorrect",
      text: "Ist die Aussage des Tutors vollständig korrekt (fiktive Szenarien / Resultate ausgenommen)? ",
      tooltip:
        "Enthält die Aussage falsche, ungenaue, verzerrte oder unvollständige Anteile – oder ist sie klar, vollständig und korrekt formuliert? Fiktive Szenarien und Resultate, die der Tutor für das Fallbeispiel generiert, können ignoriert werden.",
      options: ["Nein", "Ja"],
    },
  ],
  required: true,
};

export const nonStudyFeedback: Feedback = {
  user: [
    {
      label: "externalResource",
      text: "Für meine Antwort habe ich externe Quellen genutzt (z. B. Internet oder andere Personen).",
      tooltip:
        "Wählen Sie diese Option, wenn Sie bei der Beurteilung der Qualität der Aussage des Tutors ODER bei der Ausarbeitung Ihrer Antwort, externe Quellen wie z.B. Unterrichtsmaterial, andere Personen, Google, Websites usw. genutzt haben.",
      options: ["Ja"],
    },
    {
      label: "thoughtAboutIndex",
      text: "Für die Antwort habe ich aktiv nachgedacht / Ich wusste die Antwort nicht sofort",
      tooltip:
        "Aktives Nachdenken bedeutet, dass Sie sich bewusst mit dem Inhalt auseinandergesetzt haben – etwa indem Sie sich selbst Fragen gestellt, kritisch reflektiert, das Thema mit bereits Gelerntem verknüpft oder an konkrete Beispiele und Praxissituationen gedacht haben. Aktives Nachdenken zahlt sich aus – es verbessert nicht nur Ihr Verständnis, sondern auch Ihren Lernerfolg.",
      options: ["Ja"],
    },
  ],
  ai: [
    {
      label: "isSuitable",
      text: "Was der Tutor schreibt, ist unangemessen (unerwartet) oder passt nicht zum Gespräch.",
      tooltip:
        "Wählen Sie diese Option , wenn die Aussage im Kontext des Gesprächs unerwartet oder nicht sinnvoll ist. Das ist zum Beispiel der Fall, wenn sie deutlich von der sokratischen Methode abweicht, keinen Bezug mehr zum Fallbeispiel oder zum aktuellen Thema hat oder unerwartet von Ihrer Frage oder Anweisung abweicht.",
      options: ["Nein"],
    },
    {
      label: "isCorrect",
      text: "Was der Tutor schreibt, ist nicht ganz richtig.",
      tooltip:
        "Wählen Sie diese Option, wenn die Aussage falsche, ungenaue, verzerrte oder unvollständige Anteile enthält. Fiktive Szenarien, die der Tutor für das Fallbeispiel generiert, können ignoriert werden.",
      options: ["Nein"],
    },
  ],
  required: false,
};
