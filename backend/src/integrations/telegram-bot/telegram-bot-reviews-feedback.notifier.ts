import type { ReviewsFeedbackNegativeAlertNotificationInput, ReviewsFeedbackNotifier } from "../../slices/reviews-feedback/domain/reviews-feedback.types";
import { TelegramBotNegativeReviewAlertHarness } from "./telegram-bot-reviews-feedback.harness";

export class TelegramBotReviewsFeedbackNotifier implements ReviewsFeedbackNotifier {
  constructor(private readonly harness: TelegramBotNegativeReviewAlertHarness) {}

  notifyNegativeReview(input: ReviewsFeedbackNegativeAlertNotificationInput): Promise<void> {
    return this.harness.notifyActiveAdmins(input);
  }
}
