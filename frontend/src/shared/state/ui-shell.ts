export type UiShellState = {
  isReady: boolean;
};

export const createUiShellState = (): UiShellState => ({
  isReady: true,
});
