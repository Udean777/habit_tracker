import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Check from "lucide-react-native/icons/check";
import Pause from "lucide-react-native/icons/pause";
import Play from "lucide-react-native/icons/play";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";
import Timer from "lucide-react-native/icons/timer";
import { Text } from "@/components/Text";
import { triggerHaptic } from "@/lib/haptics";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const SECONDS_PER_MINUTE = 60;
const TICK_INTERVAL_MS = 250;

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const mins = Math.floor(clamped / SECONDS_PER_MINUTE);
  const secs = clamped % SECONDS_PER_MINUTE;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

type HabitTimerControlProps = {
  readonly habitName: string;
  readonly targetMinutes: number;
  readonly loggedMinutes: number;
  readonly isDone: boolean;
  readonly accentColor: string;
  readonly hapticsEnabled: boolean;
  readonly onCommitMinutes: (minutes: number) => void;
};

export function HabitTimerControl({
  habitName,
  targetMinutes,
  loggedMinutes,
  isDone,
  accentColor,
  hapticsEnabled,
  onCommitMinutes,
}: HabitTimerControlProps) {
  const { colors } = useTheme();
  const safeTargetMin = Math.max(1, targetMinutes);
  const totalSeconds = safeTargetMin * SECONDS_PER_MINUTE;
  const derivedRemaining = Math.max(
    0,
    totalSeconds - loggedMinutes * SECONDS_PER_MINUTE,
  );

  const [overrideRemainingSec, setOverrideRemainingSec] = useState<
    number | null
  >(null);
  const [isRunning, setIsRunning] = useState(false);
  const endTimeMsRef = useRef<number | null>(null);
  const committedDoneRef = useRef(isDone);

  const remainingSec = isDone
    ? 0
    : overrideRemainingSec !== null
      ? overrideRemainingSec
      : derivedRemaining;

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      const endMs = endTimeMsRef.current;
      if (endMs === null) return;
      const nextRemaining = Math.max(0, (endMs - Date.now()) / 1000);
      setOverrideRemainingSec(nextRemaining);

      if (nextRemaining <= 0) {
        clearInterval(timer);
        endTimeMsRef.current = null;
        setIsRunning(false);
        setOverrideRemainingSec(null);
        if (!committedDoneRef.current) {
          committedDoneRef.current = true;
          triggerHaptic("success", hapticsEnabled);
          onCommitMinutes(safeTargetMin);
        }
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isRunning, hapticsEnabled, onCommitMinutes, safeTargetMin]);

  function handleToggleRun() {
    if (isRunning) {
      triggerHaptic("light", hapticsEnabled);
      endTimeMsRef.current = null;
      setIsRunning(false);
      const elapsedMin = Math.floor(
        (totalSeconds - remainingSec) / SECONDS_PER_MINUTE,
      );
      if (elapsedMin > loggedMinutes) {
        onCommitMinutes(Math.min(safeTargetMin, elapsedMin));
      }
      return;
    }

    const startFrom = remainingSec <= 0 ? totalSeconds : remainingSec;
    if (remainingSec <= 0) {
      committedDoneRef.current = false;
      setOverrideRemainingSec(totalSeconds);
    }
    triggerHaptic("medium", hapticsEnabled);
    endTimeMsRef.current = Date.now() + startFrom * 1000;
    setIsRunning(true);
  }

  function handleReset() {
    triggerHaptic("light", hapticsEnabled);
    endTimeMsRef.current = null;
    committedDoneRef.current = false;
    setIsRunning(false);
    setOverrideRemainingSec(null);
    if (loggedMinutes > 0) {
      onCommitMinutes(0);
    }
  }

  function handleCompleteNow() {
    triggerHaptic("success", hapticsEnabled);
    endTimeMsRef.current = null;
    committedDoneRef.current = true;
    setIsRunning(false);
    setOverrideRemainingSec(null);
    onCommitMinutes(safeTargetMin);
  }

  const elapsedSec = Math.max(0, totalSeconds - remainingSec);
  const progressPct = Math.min(
    100,
    Math.round((elapsedSec / totalSeconds) * 100),
  );
  const hasStarted = elapsedSec > 0 || loggedMinutes > 0;

  return (
    <View
      style={{
        borderRadius: radii.button,
        borderWidth: 1,
        borderColor: isRunning ? colors.primaryTextAccent : colors.border,
        backgroundColor: colors.background,
      }}
      className="mt-3 p-3"
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <Timer
            size={18}
            color={isRunning ? colors.primaryTextAccent : colors.textSecondary}
            strokeWidth={2.5}
          />
          <View>
            <Text tabularNums className="text-xl font-extrabold leading-6">
              {formatCountdown(remainingSec)}
            </Text>
            <Text variant="caption" tabularNums className="text-[11px]">
              {isDone
                ? `Completed · ${safeTargetMin}m`
                : isRunning
                  ? `Running · ${safeTargetMin}m goal`
                  : hasStarted
                    ? `Paused · ${progressPct}%`
                    : `${safeTargetMin}m countdown`}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          {hasStarted ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Reset ${habitName} timer`}
              onPress={handleReset}
              style={{
                borderRadius: radii.button,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                backgroundColor: colors.surface,
              }}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <RotateCcw size={16} color={colors.textPrimary} strokeWidth={2.5} />
            </Pressable>
          ) : null}

          {!isDone ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isRunning
                    ? `Pause ${habitName} timer`
                    : `Start ${habitName} timer`
                }
                onPress={handleToggleRun}
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderBottomWidth: 3,
                  borderColor: isRunning
                    ? colors.accentBorder
                    : colors.primaryPressed,
                  backgroundColor: isRunning
                    ? colors.accentBg
                    : colors.primary,
                }}
                className="min-h-[44px] flex-row items-center gap-1.5 px-3.5"
              >
                {isRunning ? (
                  <Pause size={15} color={colors.accentText} strokeWidth={2.5} />
                ) : (
                  <Play size={15} color={colors.primaryText} strokeWidth={2.5} />
                )}
                <Text
                  tone={isRunning ? "onAccent" : "onPrimary"}
                  className="text-xs font-extrabold"
                >
                  {isRunning ? "Pause" : hasStarted ? "Resume" : "Start"}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Mark ${habitName} timer complete`}
                onPress={handleCompleteNow}
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surfaceMuted,
                }}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
              >
                <Check size={17} color={colors.textPrimary} strokeWidth={2.75} />
              </Pressable>
            </>
          ) : (
            <View
              style={{
                borderRadius: radii.button,
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderBottomWidth: 3,
                borderColor: colors.primaryPressed,
              }}
              className="min-h-[44px] flex-row items-center gap-1 px-3"
            >
              <Check size={16} color={colors.primaryText} strokeWidth={3} />
              <Text tone="onPrimary" className="text-xs font-extrabold">
                Done
              </Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={{
          height: 6,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
        className="mt-2.5"
      >
        <View
          style={{
            width: `${progressPct}%`,
            height: "100%",
            borderRadius: radii.pill,
            backgroundColor: isDone ? colors.primary : accentColor,
          }}
        />
      </View>
    </View>
  );
}
