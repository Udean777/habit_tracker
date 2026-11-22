# ANIMATION

Spec for the app's signature visuals and the rules that keep them fast. This is the product's differentiator; treat performance and accessibility as part of the design, not afterthoughts.

## 1. Design Principles

1. **Alive, not busy.** Motion communicates state (growth, health, reward). Ambient motion is slow and low-contrast. Reward motion is short and punchy.
2. **Never punish.** Missed days dim and soften the visuals. No red alarms, no dramatic death animations.
3. **Fast path stays fast.** Logging a habit needs a first visual response under 100 ms.
4. **Physical feel.** Springs over linear tweens, haptics synced with visuals, gestures tracked 1:1 with the finger.
5. **Graceful degradation.** Every effect has a cheaper version and a reduced-motion version.

## 2. Technology Split

| Need | Tool |
|---|---|
| Gestures (hold, drag, pan, tilt-optional) | Gesture Handler |
| Shared values, springs, timing, layout transitions | Reanimated |
| Custom drawing: world scene, particles, fluid heatmap, shaders | Skia |
| Haptic patterns | `expo-haptics` |
| Navigation shared-element transitions | Reanimated shared transitions / Expo Router transitions (verify support in the installed version) |

Skia is driven by Reanimated shared values directly so no JS-thread round trip happens per frame.

## 3. Signature Interactions

### 3.1 Living World (home)

**Concept (working):** bioluminescent garden. Each habit = one organism. Alternatives to evaluate in the Phase 1 spike: aurora ribbons, tide pool, constellation. Pick one based on performance and feel, then record the decision in `docs/ARCHITECTURE.md`.

State mapping (per habit):

| Input | Visual |
|---|---|
| Streak length / 30-day completion rate | Size, branching complexity, glow intensity |
| Completed today | Bloom/pulse state, brighter emission |
| Missed recently | Gently dimmed, slightly drooped, desaturated |
| Return after break | Slow regrowth animation |
| Time of day | Palette and light direction shift (dawn → night) |

Ambient layer: slow drifting particles/spores, soft noise-driven glow. Optional gyroscope parallax, off by default on low tier.

Interaction: tap an organism → shared-element transition into habit detail.

### 3.2 Hold-to-complete

Sequence:

1. **Press-in** (0 ms): ring appears under the finger, soft haptic.
2. **Charge** (about 600–900 ms hold): radial fill with easing, haptic ticks that increase in intensity at thresholds (for example 25/50/75%), particles gather toward the organism.
3. **Release early:** spring back, particles disperse, no completion.
4. **Complete:** success haptic, particle burst, organism bloom, brief world-wide ripple, streak counter rolls up.
5. **Undo:** a short press-and-hold on a completed organism reverses with a reversed softer animation.

Accessibility alternative: single tap toggle (setting or screen-reader detection). Duration and count habits open a compact value picker after the charge.

### 3.3 Fluid Heatmap

Instead of a grid, history renders as a liquid field:

- Each day contributes a blob whose radius and brightness map to completion.
- Neighboring days merge visually (metaball / threshold shader).
- Scrubbing a finger across the field moves a lens that shows the day's details and plays soft haptic ticks.

Implement first as a Skia canvas with a cached blob set. A runtime shader (SkSL) is the stretch path. Fallback on low tier: a smooth blurred grid with no shader.

### 3.4 Continuous Transitions

- World → habit detail: the organism scales and moves to the header position; background crossfades.
- Detail → stats: shared chart elements morph.
- Keep transition durations in 250–450 ms with spring physics; interruptible by gesture.

### 3.5 Micro-interactions (checklist)

- Streak number roll-up, number ticker
- Button press scale + haptic
- Sync status subtle pulse
- Empty-state idle animation
- Onboarding choreography

## 4. Quality Tiers

The app picks a tier at startup (`auto`) and the user can override it in Settings.

| Tier | Target devices | World | Particles | Heatmap | Shaders |
|---|---|---|---|---|---|
| High | Flagships | Full scene, parallax | up to ~300 | Fluid shader | On |
| Medium | Mid-range | Full scene, no parallax | up to ~120 | Cached blobs | Limited |
| Low | Entry-level / thermal throttled | Simplified sprites | up to ~30 | Blurred grid | Off |

Auto-detection:
1. Static hint: device model/RAM/API level heuristics at first launch.
2. **Runtime adaptation:** measure average frame time over the first few seconds of the World screen and step the tier down if it exceeds budget; step back up only with hysteresis and never mid-interaction.

Persist the resolved tier so the first frame on next launch uses the right level.

## 5. Reduced Motion

When the OS "reduce motion" setting is on (or the app override is on):

- Replace large movement with opacity/scale crossfades under 150 ms
- Stop ambient drifting and parallax
- Keep completion feedback as a static state change + haptic (if enabled)
- Replace the charge-up hold with tap (optional per user)
- No flashing or rapid pulsing at any time

## 6. Performance Budgets

Reference device: a mid-range physical Android phone (record the exact model in the README once chosen).

| Metric | Budget |
|---|---|
| Frame rate (World, idle) | ≥ 58 fps, no frames > 32 ms |
| Frame rate (during hold-to-complete and burst) | ≥ 55 fps |
| Touch-to-first-visual response | < 100 ms |
| World screen first render (warm) | < 400 ms |
| Skia draw nodes per frame | Track and cap per tier; avoid per-frame allocation |
| JS thread during animations | No long tasks (> 16 ms) triggered by animation code |
| Memory (World) | No unbounded growth over 10 minutes idle |
| Battery | Ambient animation pauses when the screen is not visible or the app is backgrounded |

Measurement: React Native perf monitor for JS/UI fps, Android Studio profiler / `adb shell dumpsys gfxinfo`, Flipper-equivalent tooling available in the current RN version. Log findings in PR descriptions for animation changes.

## 6.1 Implementation Rules

- Create paints, paths, shaders, and image shaders **once** and memoize; never inside a per-frame callback.
- Particles live in preallocated typed arrays; animate by mutating shared values or using a Skia `Atlas`/batch draw. Do not render one React component per particle.
- Prefer transforms and opacity over layout-affecting properties.
- Pause or `cancelAnimation` on unmount and when the app backgrounds.
- Keep animation parameters in a single `motion` config (durations, springs, thresholds) so they can be tuned in one place.
- Haptics fire from `runOnJS` at discrete threshold crossings only, not every frame.

## 7. Phase 1 Spike (before committing to the visual direction)

Time-box: about 3–5 days.

1. Build a minimal Skia scene with 10 animated organisms + ambient particles.
2. Prototype hold-to-complete with the burst effect and haptics.
3. Test on the reference mid-range Android device and record fps with the budgets above.
4. Prototype the heatmap blob field with 90 days of fake data.
5. Decide: metaphor, tier definitions, and which effects are MVP versus stretch.
6. Write the outcome in the Architecture Decision Log.

Exit criteria: the main scene holds ≥ 55 fps on the reference device on the Medium tier.

## 8. Asset and Style Guidelines

- Prefer procedural drawing (paths, noise, gradients) over bitmap assets to keep the bundle small and the visuals resolution-independent.
- Palette tokens live in `src/theme`; the world palette is defined per time-of-day and per theme (light/dark).
- Maintain contrast for any text drawn over the scene. Render text with RN `Text` overlays rather than Skia text when accessibility labels are needed.

## 9. Testing

- Manual device checklist per release: all tiers, reduced-motion on/off, haptics on/off, low battery mode, rotation lock behavior.
- Snapshot test the **state mapping** functions (habit stats → visual parameters) as pure functions in `src/features/world`.
- Keep animation logic parameterized so these pure mappers are unit-testable without rendering Skia.
