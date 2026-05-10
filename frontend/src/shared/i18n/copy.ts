import { defaultLanguage, type SupportedLanguage } from "./languages";

type CopyDictionary = {
  languageOverlay: {
    title: string;
    description: string;
    options: Record<SupportedLanguage, string>;
  };
  catalog: {
    headline: string;
    loadingStatus: string;
    loadingBody: string;
    unavailableStatus: string;
    unavailableMessage: string;
    emptyStatus: string;
    emptyShopLabel: string;
    showcaseTitle: string;
    showcaseAvailableStatus: (count: number) => string;
    showcaseEmptyStatus: string;
    allKhujandLabel: string;
    favoriteShopsLabel: string;
    adminMenuLabel: string;
    removeFromShowcaseLabel: string;
    addToShowcaseLabel: string;
    favoriteShopLabel: string;
    unfavoriteShopLabel: string;
    curationPendingStatus: string;
    curationSuccessStatus: string;
    curationFailureStatus: string;
    keyboardTestLabel: string;
    keyboardTestPlaceholder: string;
    availableCount: (count: number) => string;
  };
  checkout: {
    headline: string;
    readyStatus: string;
    noteAuth: string;
    noteTrustedPayment: string;
    primaryAction: string;
    loadingStatus: string;
    loadingBody: string;
    unavailableStatus: string;
    unavailableMessage: string;
    retryAction: string;
    retryMessage: string;
    submittingStatus: string;
    submittingAction: string;
    successStatus: string;
    successAction: string;
    backendBoundaryNote: string;
    openInTelegramMessage: string;
    successConfirmation: string;
    missingCompositionStatus: string;
    missingCompositionMessage: string;
    missingCompositionAction: string;
    compositionSummaryTitle: string;
    compositionShopLabel: (shopPublicPath: string) => string;
    compositionLineLabel: (productName: string, quantity: number, unitPriceLabel: string) => string;
    compositionPreviewTotalLabel: (previewTotalLabel: string) => string;
    statusEntryLabel: string;
    statusEntryMetadata: (orderId: string, revision: string) => string;
  };
  orderTracking: {
    headline: string;
    loadingStatus: string;
    loadingBody: string;
    unavailableStatus: string;
    unavailableMessage: string;
    missingOrderMessage: string;
    recoveryAction: string;
    currentStatus: (status: string) => string;
    customerLifecycleTitle: Record<
      | "CREATED"
      | "DELAYED"
      | "ASSIGNED"
      | "PICKED_UP"
      | "IN_PROGRESS"
      | "DELIVERED"
      | "COMPLETED"
      | "CANCELLED_BY_ADMIN"
      | "CANCELLED_BY_COURIER_UNAVAILABLE",
      string
    >;
    customerLifecycleBody: Record<
      | "CREATED"
      | "DELAYED"
      | "ASSIGNED"
      | "PICKED_UP"
      | "IN_PROGRESS"
      | "DELIVERED"
      | "COMPLETED"
      | "CANCELLED_BY_ADMIN"
      | "CANCELLED_BY_COURIER_UNAVAILABLE",
      string
    >;
    updatesApplied: (count: number) => string;
    cursorLabel: (cursor: string) => string;
    latestRevision: (revision: string | null) => string;
    boundaryNote: string;
    pendingAction: string;
    availableActionsLabel: string;
    nextActionLabel: Record<"PICKED_UP" | "IN_PROGRESS" | "DELIVERED", string>;
  };
};

const languageOptions: Record<SupportedLanguage, string> = {
  ru: "Русский",
  en: "English",
  tj: "Тоҷикӣ",
};

const copyByLanguage: Record<SupportedLanguage, CopyDictionary> = {
  ru: {
    languageOverlay: {
      title: "Выберите язык",
      description: "Выберите язык, чтобы продолжить.",
      options: languageOptions,
    },
    catalog: {
      headline: "Каталог",
      loadingStatus: "Загружаем магазины и товары...",
      loadingBody: "Загрузка каталога...",
      unavailableStatus: "Сейчас не удалось загрузить каталог.",
      unavailableMessage: "Каталог временно недоступен.",
      emptyStatus: "Сейчас нет доступных магазинов.",
      emptyShopLabel: "В этом магазине пока нет товаров.",
      showcaseTitle: "Сегодня популярны",
      showcaseAvailableStatus: (count) =>
        count === 0 ? "Выберите магазин или откройте весь Худжанд." : `${count} популярных товаров доступны сейчас.`,
      showcaseEmptyStatus: "Витрина пока пуста. Можно открыть весь Худжанд.",
      allKhujandLabel: "весь Худжанд",
      favoriteShopsLabel: "Избранные магазины",
      adminMenuLabel: "меню админов",
      removeFromShowcaseLabel: "Убрать с Витрины",
      addToShowcaseLabel: "Добавить на Витрину",
      favoriteShopLabel: "Сделать избранным",
      unfavoriteShopLabel: "Убрать из избранных",
      curationPendingStatus: "Обновляем Витрину...",
      curationSuccessStatus: "Витрина обновлена.",
      curationFailureStatus: "Не удалось обновить Витрину.",
      keyboardTestLabel: "Тестовое поле для клавиатуры",
      keyboardTestPlaceholder: "Нажмите сюда, чтобы открыть клавиатуру",
      availableCount: (count) =>
        `${count} ${count === 1 ? "магазин доступен" : count < 5 ? "магазина доступны" : "магазинов доступны"} для просмотра.`,
    },
    checkout: {
      headline: "Оформление заказа",
      readyStatus: "Безопасное оформление заказа готово.",
      noteAuth: "Авторизация через Telegram запрашивается только после начала оформления.",
      noteTrustedPayment:
        "Заказ создается только после доверенного серверного подтверждения оплаты.",
      primaryAction: "Перейти к оплате",
      loadingStatus: "Подготавливаем сессию оформления заказа...",
      loadingBody: "Подготавливаем безопасное оформление заказа...",
      unavailableStatus: "Сейчас не удалось завершить оформление заказа.",
      unavailableMessage: "Оформление заказа временно недоступно.",
      retryAction: "Повторить оплату",
      retryMessage: "Оплата не завершилась. Попробуйте еще раз.",
      submittingStatus: "Авторизуем Telegram и подтверждаем оплату...",
      submittingAction: "Обрабатываем оформление...",
      successStatus: "Оформление заказа завершено.",
      successAction: "Заказ создан",
      backendBoundaryNote:
        "Авторизация Telegram и подтверждение оплаты остаются на стороне backend.",
      openInTelegramMessage: "Откройте оформление заказа из Telegram, чтобы безопасно продолжить.",
      successConfirmation: "Заказ создан после доверенного подтверждения оплаты.",
      missingCompositionStatus: "Сначала соберите корзину в каталоге.",
      missingCompositionMessage:
        "Оформление заказа открывается только из непустой корзины. Вернитесь в каталог и выберите товары.",
      missingCompositionAction: "Вернуться в каталог",
      compositionSummaryTitle: "Подтверждение состава заказа",
      compositionShopLabel: (shopPublicPath) => `Магазин: ${shopPublicPath}`,
      compositionLineLabel: (productName, quantity, unitPriceLabel) =>
        `${productName} × ${quantity} · ${unitPriceLabel}`,
      compositionPreviewTotalLabel: (previewTotalLabel) => `Предварительный итог ${previewTotalLabel}`,
      statusEntryLabel: "Следить за статусом заказа",
      statusEntryMetadata: (orderId, revision) => `Заказ ${orderId} готов к отслеживанию с revision ${revision}.`,
    },
    orderTracking: {
      headline: "Отслеживание заказа",
      loadingStatus: "Подготавливаем polling и статус доставки...",
      loadingBody: "Загружаем scaffold отслеживания заказа...",
      unavailableStatus: "Не удалось подготовить отслеживание заказа.",
      unavailableMessage: "Отслеживание заказа временно недоступно.",
      missingOrderMessage:
        "Не нашли созданный заказ для отслеживания. Вернитесь в каталог или завершите оплату заново.",
      recoveryAction: "Вернуться в каталог",
      currentStatus: (status) => `Текущий статус: ${status}.`,
      customerLifecycleTitle: {
        CREATED: "Заказ оплачен и ожидает назначения курьера",
        DELAYED: "Заказ ожидает срочного внимания",
        ASSIGNED: "Курьер назначен",
        PICKED_UP: "Курьер забрал заказ",
        IN_PROGRESS: "Курьер в пути",
        DELIVERED: "Заказ доставлен",
        COMPLETED: "Заказ завершен",
        CANCELLED_BY_ADMIN: "Заказ отменен оператором",
        CANCELLED_BY_COURIER_UNAVAILABLE: "Заказ отменен: курьер недоступен",
      },
      customerLifecycleBody: {
        CREATED: "Мы подтвердили оплату. Операционная команда назначит курьера, когда заказ будет готов к доставке.",
        DELAYED: "Назначение курьера занимает больше времени. Операционная команда уже видит этот заказ.",
        ASSIGNED: "Курьер уже назначен. Мы покажем прогресс, когда курьер начнет доставку.",
        PICKED_UP: "Курьер забрал заказ из магазина и скоро начнет доставку.",
        IN_PROGRESS: "Курьер выполняет доставку. Статус обновится автоматически через polling.",
        DELIVERED: "Заказ отмечен доставленным. Ждем финальное завершение доставки.",
        COMPLETED: "Доставка завершена. Спасибо за заказ.",
        CANCELLED_BY_ADMIN: "Заказ отменен операционной командой. Подробности по возврату обрабатываются вне клиентского экрана.",
        CANCELLED_BY_COURIER_UNAVAILABLE: "Заказ отменен из-за недоступности курьера. Операционная команда обработает дальнейшие шаги.",
      },
      updatesApplied: (count) => `Применено обновлений: ${count}.`,
      cursorLabel: (cursor) => `Cursor: ${cursor}`,
      latestRevision: (revision) =>
        revision === null ? "Последняя revision: пока нет." : `Последняя revision: ${revision}.`,
      boundaryNote:
        "Polling consumer хранит opaque cursor, а state-machine остается на backend/bot command boundary.",
      pendingAction: "Отправляем courier action...",
      availableActionsLabel: "Courier actions",
      nextActionLabel: {
        PICKED_UP: "Забрать заказ",
        IN_PROGRESS: "Начать доставку",
        DELIVERED: "Отметить как доставлено",
      },
    },
  },
  en: {
    languageOverlay: {
      title: "Choose your language",
      description: "Select a language to continue.",
      options: languageOptions,
    },
    catalog: {
      headline: "Catalog",
      loadingStatus: "Loading shops and products...",
      loadingBody: "Loading catalog...",
      unavailableStatus: "We could not load the catalog right now.",
      unavailableMessage: "Catalog is temporarily unavailable.",
      emptyStatus: "No shops are available right now.",
      emptyShopLabel: "No products are available in this shop yet.",
      showcaseTitle: "Сегодня популярны",
      showcaseAvailableStatus: (count) =>
        count === 0 ? "Choose a shop or open all Khujand." : `${count} popular products are available now.`,
      showcaseEmptyStatus: "The showcase is empty for now. You can open all Khujand.",
      allKhujandLabel: "весь Худжанд",
      favoriteShopsLabel: "Favorite shops",
      adminMenuLabel: "меню админов",
      removeFromShowcaseLabel: "Remove from showcase",
      addToShowcaseLabel: "Add to showcase",
      favoriteShopLabel: "Mark favorite",
      unfavoriteShopLabel: "Remove favorite",
      curationPendingStatus: "Updating showcase...",
      curationSuccessStatus: "Showcase updated.",
      curationFailureStatus: "Could not update showcase.",
      keyboardTestLabel: "Keyboard test field",
      keyboardTestPlaceholder: "Tap here to open the keyboard",
      availableCount: (count) => `${count} shop${count === 1 ? "" : "s"} available for browsing.`,
    },
    checkout: {
      headline: "Checkout",
      readyStatus: "Secure checkout is ready.",
      noteAuth: "Telegram auth is requested only when you start checkout.",
      noteTrustedPayment:
        "Order creation stays locked behind trusted server-side payment confirmation.",
      primaryAction: "Continue to payment",
      loadingStatus: "Preparing checkout session...",
      loadingBody: "Preparing secure checkout...",
      unavailableStatus: "We could not complete checkout right now.",
      unavailableMessage: "Checkout is temporarily unavailable.",
      retryAction: "Try payment again",
      retryMessage: "Payment was not completed. You can try again.",
      submittingStatus: "Authorizing Telegram and confirming payment...",
      submittingAction: "Processing checkout...",
      successStatus: "Checkout completed.",
      successAction: "Order created",
      backendBoundaryNote: "Telegram auth and payment confirmation stay on the backend boundary.",
      openInTelegramMessage: "Open this checkout from Telegram to continue securely.",
      successConfirmation: "Order created after trusted payment confirmation.",
      missingCompositionStatus: "Build your cart in the catalog first.",
      missingCompositionMessage:
        "Checkout opens only from a non-empty cart. Return to the catalog and choose products before payment.",
      missingCompositionAction: "Return to catalog",
      compositionSummaryTitle: "Order composition confirmation",
      compositionShopLabel: (shopPublicPath) => `Shop: ${shopPublicPath}`,
      compositionLineLabel: (productName, quantity, unitPriceLabel) =>
        `${productName} × ${quantity} · ${unitPriceLabel}`,
      compositionPreviewTotalLabel: (previewTotalLabel) => `Preview total ${previewTotalLabel}`,
      statusEntryLabel: "Track order status",
      statusEntryMetadata: (orderId, revision) => `Order ${orderId} is ready for tracking from revision ${revision}.`,
    },
    orderTracking: {
      headline: "Order tracking",
      loadingStatus: "Preparing polling and delivery status...",
      loadingBody: "Loading the order-tracking scaffold...",
      unavailableStatus: "We could not prepare order tracking right now.",
      unavailableMessage: "Order tracking is temporarily unavailable.",
      missingOrderMessage:
        "We could not find the created order to track. Return to the catalog or complete checkout again.",
      recoveryAction: "Return to catalog",
      currentStatus: (status) => `Current status: ${status}.`,
      customerLifecycleTitle: {
        CREATED: "Order paid and waiting for courier assignment",
        DELAYED: "Order needs urgent attention",
        ASSIGNED: "Courier assigned",
        PICKED_UP: "Courier picked up the order",
        IN_PROGRESS: "Courier is on the way",
        DELIVERED: "Order delivered",
        COMPLETED: "Order completed",
        CANCELLED_BY_ADMIN: "Order cancelled by operations",
        CANCELLED_BY_COURIER_UNAVAILABLE: "Order cancelled: courier unavailable",
      },
      customerLifecycleBody: {
        CREATED: "Payment is confirmed. The operations team will assign a courier when the order is ready for delivery.",
        DELAYED: "Courier assignment is taking longer than expected. The operations team can already see this order.",
        ASSIGNED: "A courier is assigned. We will show delivery progress after the courier starts the trip.",
        PICKED_UP: "The courier picked up the order from the shop and will start delivery soon.",
        IN_PROGRESS: "The courier is handling your delivery. This screen updates automatically through polling.",
        DELIVERED: "The order is marked as delivered. We are waiting for final completion.",
        COMPLETED: "Delivery is complete. Thank you for your order.",
        CANCELLED_BY_ADMIN: "The operations team cancelled this order. Refund handling details stay outside the customer status screen.",
        CANCELLED_BY_COURIER_UNAVAILABLE: "The order was cancelled because the courier became unavailable. The operations team will handle next steps.",
      },
      updatesApplied: (count) => `Updates applied: ${count}.`,
      cursorLabel: (cursor) => `Cursor: ${cursor}`,
      latestRevision: (revision) =>
        revision === null ? "Latest revision: none yet." : `Latest revision: ${revision}.`,
      boundaryNote:
        "The polling consumer stores an opaque cursor while the state machine stays on the backend/bot command boundary.",
      pendingAction: "Sending courier action...",
      availableActionsLabel: "Courier actions",
      nextActionLabel: {
        PICKED_UP: "Mark picked up",
        IN_PROGRESS: "Start delivery",
        DELIVERED: "Mark as delivered",
      },
    },
  },
  tj: {
    languageOverlay: {
      title: "Забонро интихоб кунед",
      description: "Барои идома забонро интихоб кунед.",
      options: languageOptions,
    },
    catalog: {
      headline: "Феҳрист",
      loadingStatus: "Мағозаҳо ва молҳоро бор карда истодаем...",
      loadingBody: "Феҳристро бор карда истодаем...",
      unavailableStatus: "Ҳоло феҳристро бор кардан нашуд.",
      unavailableMessage: "Феҳрист муваққатан дастнорас аст.",
      emptyStatus: "Ҳоло ягон мағозаи дастрас нест.",
      emptyShopLabel: "Дар ин мағоза ҳоло мол нест.",
      showcaseTitle: "Сегодня популярны",
      showcaseAvailableStatus: (count) =>
        count === 0 ? "Мағозаро интихоб кунед ё тамоми Хуҷандро кушоед." : `${count} моли маъмул ҳоло дастрас аст.`,
      showcaseEmptyStatus: "Витрина ҳоло холӣ аст. Метавонед тамоми Хуҷандро кушоед.",
      allKhujandLabel: "весь Худжанд",
      favoriteShopsLabel: "Мағозаҳои интихобшуда",
      adminMenuLabel: "меню админов",
      removeFromShowcaseLabel: "Аз Витрина гиред",
      addToShowcaseLabel: "Ба Витрина илова кунед",
      favoriteShopLabel: "Интихобшуда кунед",
      unfavoriteShopLabel: "Аз интихобшуда гиред",
      curationPendingStatus: "Витрина нав мешавад...",
      curationSuccessStatus: "Витрина нав шуд.",
      curationFailureStatus: "Витринаро нав кардан нашуд.",
      keyboardTestLabel: "Майдони санҷиши клавиатура",
      keyboardTestPlaceholder: "Барои кушодани клавиатура ин ҷоро пахш кунед",
      availableCount: (count) => `${count} мағоза барои дидан дастрас аст.`,
    },
    checkout: {
      headline: "Пардохт",
      readyStatus: "Пардохти бехатар омода аст.",
      noteAuth: "Иҷозати Telegram танҳо ҳангоми оғози пардохт дархост мешавад.",
      noteTrustedPayment:
        "Фармоиш танҳо баъд аз тасдиқи боэътимоди пардохт аз ҷониби сервер сохта мешавад.",
      primaryAction: "Ба пардохт гузаред",
      loadingStatus: "Сессияи пардохтро омода карда истодаем...",
      loadingBody: "Пардохти бехатарро омода карда истодаем...",
      unavailableStatus: "Ҳоло анҷом додани пардохт нашуд.",
      unavailableMessage: "Пардохт муваққатан дастнорас аст.",
      retryAction: "Пардохтро такрор кунед",
      retryMessage: "Пардохт анҷом наёфт. Аз нав кӯшиш кунед.",
      submittingStatus: "Telegram-ро иҷозат дода, пардохтро тасдиқ карда истодаем...",
      submittingAction: "Пардохтро коркард карда истодаем...",
      successStatus: "Пардохт анҷом ёфт.",
      successAction: "Фармоиш сохта шуд",
      backendBoundaryNote:
        "Иҷозати Telegram ва тасдиқи пардохт дар ҳудуди backend мемонад.",
      openInTelegramMessage: "Барои идомаи бехатар пардохтро аз дохили Telegram кушоед.",
      successConfirmation: "Фармоиш баъд аз тасдиқи боэътимоди пардохт сохта шуд.",
      missingCompositionStatus: "Аввал сабадро дар феҳрист ҷамъ кунед.",
      missingCompositionMessage:
        "Пардохт танҳо аз сабади холӣ набуда кушода мешавад. Ба феҳрист баргардед ва молҳоро интихоб кунед.",
      missingCompositionAction: "Ба феҳрист баргардед",
      compositionSummaryTitle: "Тасдиқи таркиби фармоиш",
      compositionShopLabel: (shopPublicPath) => `Мағоза: ${shopPublicPath}`,
      compositionLineLabel: (productName, quantity, unitPriceLabel) =>
        `${productName} × ${quantity} · ${unitPriceLabel}`,
      compositionPreviewTotalLabel: (previewTotalLabel) => `Ҷамъи пешакӣ ${previewTotalLabel}`,
      statusEntryLabel: "Ҳолати фармоишро пайгирӣ кунед",
      statusEntryMetadata: (orderId, revision) => `Фармоиш ${orderId} аз revision ${revision} барои пайгирӣ омода аст.`,
    },
    orderTracking: {
      headline: "Пайгирии фармоиш",
      loadingStatus: "Polling ва ҳолати расонишро омода карда истодаем...",
      loadingBody: "Scaffold-и пайгирии фармоишро бор карда истодаем...",
      unavailableStatus: "Ҳоло пайгирии фармоишро омода кардан нашуд.",
      unavailableMessage: "Пайгирии фармоиш муваққатан дастнорас аст.",
      missingOrderMessage:
        "Фармоиши сохташударо барои пайгирӣ наёфтем. Ба феҳрист баргардед ё пардохтро аз нав анҷом диҳед.",
      recoveryAction: "Ба феҳрист баргардед",
      currentStatus: (status) => `Ҳолати ҷорӣ: ${status}.`,
      customerLifecycleTitle: {
        CREATED: "Фармоиш пардохт шуд ва таъини курьерро интизор аст",
        DELAYED: "Фармоиш таваҷҷуҳи фавриро интизор аст",
        ASSIGNED: "Курьер таъин шуд",
        PICKED_UP: "Курьер фармоишро гирифт",
        IN_PROGRESS: "Курьер дар роҳ аст",
        DELIVERED: "Фармоиш расонида шуд",
        COMPLETED: "Фармоиш анҷом ёфт",
        CANCELLED_BY_ADMIN: "Фармоиш аз ҷониби оператор бекор шуд",
        CANCELLED_BY_COURIER_UNAVAILABLE: "Фармоиш бекор шуд: курьер дастнорас аст",
      },
      customerLifecycleBody: {
        CREATED: "Пардохт тасдиқ шуд. Гурӯҳи амалиётӣ ҳангоми омода шудани фармоиш курьер таъин мекунад.",
        DELAYED: "Таъини курьер аз интизорӣ дарозтар шуд. Гурӯҳи амалиётӣ ин фармоишро аллакай мебинад.",
        ASSIGNED: "Курьер таъин шудааст. Пас аз оғози расониш пешрафтро нишон медиҳем.",
        PICKED_UP: "Курьер фармоишро аз мағоза гирифт ва ба зудӣ расонишро оғоз мекунад.",
        IN_PROGRESS: "Курьер фармоишро мерасонад. Ин экран бо polling худкор нав мешавад.",
        DELIVERED: "Фармоиш ҳамчун расонидашуда қайд шуд. Анҷоми ниҳоиро интизорем.",
        COMPLETED: "Расониш анҷом ёфт. Ташаккур барои фармоиш.",
        CANCELLED_BY_ADMIN: "Гурӯҳи амалиётӣ ин фармоишро бекор кард. Ҷузъиёти баргардонидани маблағ дар экрани муштарӣ нишон дода намешавад.",
        CANCELLED_BY_COURIER_UNAVAILABLE: "Фармоиш аз сабаби дастнорас шудани курьер бекор шуд. Гурӯҳи амалиётӣ қадамҳои минбаъдаро иҷро мекунад.",
      },
      updatesApplied: (count) => `Навсозиҳои татбиқшуда: ${count}.`,
      cursorLabel: (cursor) => `Cursor: ${cursor}`,
      latestRevision: (revision) =>
        revision === null ? "Revision-и охирин: ҳоло нест." : `Revision-и охирин: ${revision}.`,
      boundaryNote:
        "Polling consumer cursor-и opaque-ро нигоҳ медорад ва state machine дар ҳудуди backend/bot мемонад.",
      pendingAction: "Амали courier фиристода истодаем...",
      availableActionsLabel: "Амалҳои courier",
      nextActionLabel: {
        PICKED_UP: "Фармоиш гирифта шуд",
        IN_PROGRESS: "Расонишро оғоз кунед",
        DELIVERED: "Расонида шуд",
      },
    },
  },
};

export const getCopy = (language: SupportedLanguage = defaultLanguage): CopyDictionary => {
  return copyByLanguage[language] ?? copyByLanguage[defaultLanguage];
};
