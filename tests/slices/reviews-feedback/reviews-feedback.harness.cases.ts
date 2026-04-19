import {
  buildReviewStepperCallbackData,
  parseReviewStepperCallbackData,
  TelegramBotNegativeReviewAlertHarness,
  TelegramBotReviewsFeedbackHarness,
} from "../../../backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness";

export const registerReviewsFeedbackHarnessCases = () => {
  it("builds a transport-only Telegram review rating prompt", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const harness = new TelegramBotReviewsFeedbackHarness({ sendMessage });

    await expect(
      harness.notifyRatingStep({
        chatId: "70001",
        orderId: "order-1",
        direction: "client_to_courier",
        revision: "22",
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: "70001",
      text: "Order order-1 review (client -> courier): choose a rating from 1 to 5.",
      dedupeKey: "review.stepper:order-1:client_to_courier:rating:22",
      buttons: [
        { label: "1", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:1" },
        { label: "2", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:2" },
        { label: "3", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:3" },
        { label: "4", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:4" },
        { label: "5", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:5" },
      ],
    });
  });

  it("parses review callback payloads as transport-only step intents", () => {
    const callbackData = buildReviewStepperCallbackData({
      orderId: "order-1",
      direction: "courier_to_client",
      stage: "reason_code",
      revision: "rating:2",
      value: "LATE_RESPONSE",
    });

    expect(callbackData).toBe(
      "reviews-feedback:order-1:courier_to_client:reason_code:rating%3A2:LATE_RESPONSE",
    );
    expect(parseReviewStepperCallbackData(callbackData)).toEqual({
      orderId: "order-1",
      direction: "courier_to_client",
      stage: "reason_code",
      revision: "rating:2",
      value: "LATE_RESPONSE",
    });
    expect(
      parseReviewStepperCallbackData("reviews-feedback:order-1:courier_to_client:comment:test"),
    ).toBeNull();
  });

  it("fans out negative review alerts to unique admin chat targets", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const harness = new TelegramBotNegativeReviewAlertHarness({ sendMessage });

    await expect(
      harness.notifyActiveAdmins({
        adminTelegramIds: ["80001", "80002", "80001", ""],
        orderId: "order-1",
        reviewId: "11",
        direction: "client_to_courier",
        rating: 2,
        reasonCode: "RUDE",
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenNthCalledWith(1, {
      chatId: "80001",
      text:
        "Negative review alert for order order-1. Direction: client -> courier. Rating: 2. Reason: RUDE.",
      dedupeKey: "review.negative:11:80001",
    });
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      chatId: "80002",
      text:
        "Negative review alert for order order-1. Direction: client -> courier. Rating: 2. Reason: RUDE.",
      dedupeKey: "review.negative:11:80002",
    });
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });
};
