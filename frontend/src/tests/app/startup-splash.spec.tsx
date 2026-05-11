import { getStartupSplashTimings, resolveStartupSplashMode, startupSplashSeenStorageKey } from "../../app/startup-splash";

describe("startup splash", () => {
  it("uses the long animation by default and only accepts explicit quick mode", () => {
    expect(resolveStartupSplashMode(undefined)).toBe("full");
    expect(resolveStartupSplashMode("full")).toBe("full");
    expect(resolveStartupSplashMode("unexpected")).toBe("full");
    expect(resolveStartupSplashMode("quick")).toBe("quick");
  });

  it("keeps first-open splash long and repeat-open splash within one second", () => {
    expect(startupSplashSeenStorageKey).toBe("khujandi.startupSplash.seen");
    expect(getStartupSplashTimings("full")).toEqual({
      dismissMs: 3900,
      removeMs: 4400,
    });
    expect(getStartupSplashTimings("quick")).toEqual({
      dismissMs: 1000,
      removeMs: 1250,
    });
  });
});
