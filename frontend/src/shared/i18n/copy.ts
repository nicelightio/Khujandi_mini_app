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
    },
  },
};

export const getCopy = (language: SupportedLanguage = defaultLanguage): CopyDictionary => {
  return copyByLanguage[language] ?? copyByLanguage[defaultLanguage];
};
