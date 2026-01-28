import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { applyThemeToDocument, type Theme } from "../stores/uiStore";

const themes: Theme[] = ["light", "dark", "luther"];

describe("Theme Property Tests", () => {
  let originalTheme: string | null;

  beforeEach(() => {
    originalTheme = document.documentElement.getAttribute("data-theme");
  });

  afterEach(() => {
    if (originalTheme) {
      document.documentElement.setAttribute("data-theme", originalTheme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  });

  it("should set data-theme attribute for any theme", () => {
    fc.assert(
      fc.property(fc.constantFrom(...themes), (theme: Theme) => {
        applyThemeToDocument(theme);
        expect(document.documentElement.getAttribute("data-theme")).toBe(theme);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should have valid theme values", () => {
    for (const theme of themes) {
      expect(["light", "dark", "luther"]).toContain(theme);
    }
  });
});
