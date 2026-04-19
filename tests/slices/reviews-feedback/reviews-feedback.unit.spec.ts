import { registerReviewsFeedbackFlowCases } from "./reviews-feedback.flow.cases";
import { registerReviewsFeedbackHarnessCases } from "./reviews-feedback.harness.cases";
import { registerReviewsFeedbackServiceCases } from "./reviews-feedback.service.cases";

describe("reviews-feedback service", () => {
  registerReviewsFeedbackHarnessCases();
  registerReviewsFeedbackFlowCases();
  registerReviewsFeedbackServiceCases();
});
