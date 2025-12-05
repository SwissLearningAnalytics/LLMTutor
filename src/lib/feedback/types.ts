// @Patricia - Definition of the new Feedback structure

export type FeedbackField = {
  label: string;
  text: string;
  tooltip: string;
  options: string[];
};

export type Feedback = {
  user: FeedbackField[];
  ai: FeedbackField[];
  required: boolean;
};
