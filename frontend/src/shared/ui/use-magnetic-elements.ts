import { useEffect, type RefObject } from "react";

const MAGNETIC_QUERY = "(hover: hover) and (pointer: fine)";
const MAX_OFFSET = 10;

const clampOffset = (value: number) => Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, value));

export const useMagneticElements = (
  rootRef: RefObject<HTMLElement | null>,
  selector = '[data-magnetic="true"]',
) => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = rootRef.current;

    if (root === null) {
      return;
    }

    const motionMedia = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const pointerMedia = window.matchMedia?.(MAGNETIC_QUERY);

    if (motionMedia?.matches === true || pointerMedia?.matches === false) {
      return;
    }

    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));

    const resetElement = (element: HTMLElement) => {
      element.style.setProperty("--magnetic-x", "0px");
      element.style.setProperty("--magnetic-y", "0px");
      element.style.setProperty("--magnetic-scale", "1");
    };

    const cleanups = elements.flatMap((element) => {
      resetElement(element);

      const handlePointerMove = (event: PointerEvent) => {
        const rect = element.getBoundingClientRect();
        const offsetX = clampOffset(((event.clientX - rect.left) / rect.width - 0.5) * 14);
        const offsetY = clampOffset(((event.clientY - rect.top) / rect.height - 0.5) * 10);

        element.style.setProperty("--magnetic-x", `${offsetX}px`);
        element.style.setProperty("--magnetic-y", `${offsetY}px`);
        element.style.setProperty("--magnetic-scale", "1.015");
      };

      const handlePointerLeave = () => {
        resetElement(element);
      };

      const handlePointerDown = () => {
        element.style.setProperty("--magnetic-scale", "0.992");
      };

      const handlePointerUp = () => {
        element.style.setProperty("--magnetic-scale", "1.01");
      };

      element.addEventListener("pointermove", handlePointerMove);
      element.addEventListener("pointerleave", handlePointerLeave);
      element.addEventListener("pointerdown", handlePointerDown);
      element.addEventListener("pointerup", handlePointerUp);

      return [
        () => element.removeEventListener("pointermove", handlePointerMove),
        () => element.removeEventListener("pointerleave", handlePointerLeave),
        () => element.removeEventListener("pointerdown", handlePointerDown),
        () => element.removeEventListener("pointerup", handlePointerUp),
        () => resetElement(element),
      ];
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [rootRef, selector]);
};
