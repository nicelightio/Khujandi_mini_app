import type { ReviewsFeedbackNotifier } from "../domain/reviews-feedback.types";
import { ReviewsFeedbackService } from "../application/reviews-feedback.service";
import type { ReviewsFeedbackPrismaProvider } from "../infrastructure/prisma-reviews-feedback.repository";
import { PrismaReviewsFeedbackRepository } from "../infrastructure/prisma-reviews-feedback.repository";
import { ReviewsFeedbackController } from "./reviews-feedback.controller";

export type ReviewsFeedbackModule = {
  controller: ReviewsFeedbackController;
  service: ReviewsFeedbackService;
  repository: PrismaReviewsFeedbackRepository;
};

export const createReviewsFeedbackModule = (
  prisma: ReviewsFeedbackPrismaProvider,
  notifier?: ReviewsFeedbackNotifier,
): ReviewsFeedbackModule => {
  const repository = new PrismaReviewsFeedbackRepository(prisma);
  const service = new ReviewsFeedbackService(repository, notifier);
  const controller = new ReviewsFeedbackController(service);

  return {
    controller,
    service,
    repository,
  };
};
