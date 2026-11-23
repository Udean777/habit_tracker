import { Circle } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { worldColors } from "@/theme/tokens";

export type ParticleSeed = {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly speed: number;
  readonly phase: number;
};

export function createParticleSeeds(count: number): readonly ParticleSeed[] {
  return Array.from({ length: count }, (_, i) => ({
    x: ((i * 73) % 100) / 100,
    y: ((i * 41) % 100) / 100,
    r: 1.4 + (i % 3) * 0.7,
    speed: 0.4 + (i % 5) * 0.15,
    phase: (i * 0.7) % (Math.PI * 2),
  }));
}

export function AmbientParticle({
  seed,
  clock,
  width,
  height,
  reduceMotion,
}: {
  readonly seed: ParticleSeed;
  readonly clock: { value: number };
  readonly width: number;
  readonly height: number;
  readonly reduceMotion: boolean;
}) {
  const cx = useDerivedValue(() => {
    if (reduceMotion) return seed.x * width;
    return seed.x * width + Math.sin(clock.value * seed.speed + seed.phase) * 10;
  });
  const cy = useDerivedValue(() => {
    if (reduceMotion) return seed.y * height;
    return (
      seed.y * height + Math.cos(clock.value * seed.speed + seed.phase) * 10
    );
  });

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={seed.r}
      color={worldColors.particle}
      opacity={0.32}
    />
  );
}
