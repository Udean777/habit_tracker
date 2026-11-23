import { computeTooltipPlacement, FEATURE_TOUR_STEPS } from "./tourSteps";
import { useTourStore } from "./tourStore";

describe("feature tour", () => {
  beforeEach(() => {
    useTourStore.setState({ isOpen: false, stepIndex: 0 });
  });

  it("advances, goes back, and closes cleanly across tour steps", () => {
    useTourStore.getState().startTour();
    expect(useTourStore.getState().isOpen).toBe(true);
    expect(useTourStore.getState().stepIndex).toBe(0);

    useTourStore.getState().nextStep();
    expect(useTourStore.getState().stepIndex).toBe(1);

    useTourStore.getState().prevStep();
    expect(useTourStore.getState().stepIndex).toBe(0);

    // Clamps at 0
    useTourStore.getState().prevStep();
    expect(useTourStore.getState().stepIndex).toBe(0);

    // Jump to last step and finish
    useTourStore.getState().startTour(FEATURE_TOUR_STEPS.length - 1);
    useTourStore.getState().nextStep();
    expect(useTourStore.getState().isOpen).toBe(false);
  });

  it("places tooltip below upper targets and above lower targets", () => {
    const upper = computeTooltipPlacement(
      { x: 16, y: 100, width: 320, height: 120 },
      840,
      44,
      24,
    );
    expect(upper.position).toBe("below");
    expect(upper.top).toBeGreaterThan(220);

    const lower = computeTooltipPlacement(
      { x: 16, y: 660, width: 320, height: 100 },
      840,
      44,
      24,
    );
    expect(lower.position).toBe("above");
    expect(lower.top).toBeLessThan(660);

    const missing = computeTooltipPlacement(null, 840, 44, 24);
    expect(missing.position).toBe("center");
  });
});
