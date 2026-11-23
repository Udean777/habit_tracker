import { useEffect, useRef, useState } from "react";
import { BackHandler, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { triggerHaptic } from "@/lib/haptics";
import { motion } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import {
  computeTooltipPlacement,
  FEATURE_TOUR_STEPS,
  type SpotlightRect,
} from "../tourSteps";
import { getTourTargetRef, useTourStore } from "../tourStore";

const SPOTLIGHT_PADDING = 6;
const SCRIM_COLOR = "rgba(19, 15, 30, 0.78)";
const MAX_MEASURE_ATTEMPTS = 14;
const MEASURE_RETRY_MS = 80;
const INITIAL_DELAY_SAME_TAB_MS = 60;
const INITIAL_DELAY_CROSS_TAB_MS = 260;

function isSameRect(a: SpotlightRect, b: SpotlightRect): boolean {
  return (
    Math.abs(a.x - b.x) < 1 &&
    Math.abs(a.y - b.y) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1
  );
}

function clampRect(
  r: SpotlightRect,
  maxW: number,
  maxH: number,
): SpotlightRect | null {
  const x1 = Math.max(0, Math.min(maxW, r.x));
  const y1 = Math.max(0, Math.min(maxH, r.y));
  const x2 = Math.max(x1, Math.min(maxW, r.x + r.width));
  const y2 = Math.max(y1, Math.min(maxH, r.y + r.height));
  const width = x2 - x1;
  const height = y2 - y1;
  if (width < 8 || height < 8) return null;
  return { x: x1, y: y1, width, height };
}

export function FeatureTourOverlay() {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const isOpen = useTourStore((s) => s.isOpen);
  const stepIndex = useTourStore((s) => s.stepIndex);
  const nextStep = useTourStore((s) => s.nextStep);
  const prevStep = useTourStore((s) => s.prevStep);
  const closeTour = useTourStore((s) => s.closeTour);

  const overlayRef = useRef<View | null>(null);
  const lastRouteRef = useRef<string | null>(null);
  const [overlaySize, setOverlaySize] = useState({ width: winW, height: winH });
  const [measuredRect, setMeasuredRect] = useState<SpotlightRect | null>(null);

  const spotX = useSharedValue(0);
  const spotY = useSharedValue(0);
  const spotW = useSharedValue(0);
  const spotH = useSharedValue(0);

  const currentStep = FEATURE_TOUR_STEPS[stepIndex] ?? FEATURE_TOUR_STEPS[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === FEATURE_TOUR_STEPS.length - 1;

  // Handle Android hardware Back button while tour is active
  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeTour();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, closeTour]);

  // Navigate to step route and measure target until layout + tab shift animation stabilize
  useEffect(() => {
    if (!isOpen || !currentStep) {
      spotW.set(0);
      spotH.set(0);
      lastRouteRef.current = null;
      return;
    }

    const step = currentStep;
    const isCrossTab = lastRouteRef.current !== step.route;
    lastRouteRef.current = step.route;

    let cancelled = false;
    let attempts = 0;
    let lastCandidate: SpotlightRect | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    router.navigate(step.route);

    function applySpotlight(clamped: SpotlightRect) {
      setMeasuredRect(clamped);
      const isFirstMeasurement = spotW.get() === 0 && spotH.get() === 0;
      if (isFirstMeasurement) {
        spotX.set(clamped.x);
        spotY.set(clamped.y);
        spotW.set(clamped.width);
        spotH.set(clamped.height);
      } else {
        spotX.set(withSpring(clamped.x, motion.springs.snappy));
        spotY.set(withSpring(clamped.y, motion.springs.snappy));
        spotW.set(withSpring(clamped.width, motion.springs.snappy));
        spotH.set(withSpring(clamped.height, motion.springs.snappy));
      }
    }

    function attemptMeasure() {
      if (cancelled) return;
      attempts += 1;

      const overlayNode = overlayRef.current;
      const targetNode = getTourTargetRef(step.id)?.current;

      if (!overlayNode || !targetNode) {
        if (attempts < MAX_MEASURE_ATTEMPTS) {
          timer = setTimeout(attemptMeasure, MEASURE_RETRY_MS);
        } else {
          setMeasuredRect(null);
        }
        return;
      }

      overlayNode.measureInWindow((ox, oy, ow, oh) => {
        if (cancelled) return;
        const containerW = ow > 0 ? ow : overlaySize.width;
        const containerH = oh > 0 ? oh : overlaySize.height;

        targetNode.measureInWindow((tx, ty, tw, th) => {
          if (cancelled) return;
          const trimmedH = Math.max(0, th - (step.trimBottom ?? 0));
          if (tw < 4 || trimmedH < 4) {
            if (attempts < MAX_MEASURE_ATTEMPTS) {
              timer = setTimeout(attemptMeasure, MEASURE_RETRY_MS);
            } else {
              setMeasuredRect(null);
            }
            return;
          }

          const raw: SpotlightRect = {
            x: tx - ox - SPOTLIGHT_PADDING,
            y: ty - oy - SPOTLIGHT_PADDING,
            width: tw + SPOTLIGHT_PADDING * 2,
            height: trimmedH + SPOTLIGHT_PADDING * 2,
          };

          const clamped = clampRect(raw, containerW, containerH);
          if (!clamped) {
            if (attempts < MAX_MEASURE_ATTEMPTS) {
              timer = setTimeout(attemptMeasure, MEASURE_RETRY_MS);
            } else {
              setMeasuredRect(null);
            }
            return;
          }

          applySpotlight(clamped);

          const stabilized =
            lastCandidate !== null && isSameRect(lastCandidate, clamped);
          lastCandidate = clamped;

          if (!stabilized && attempts < MAX_MEASURE_ATTEMPTS) {
            timer = setTimeout(attemptMeasure, MEASURE_RETRY_MS);
          }
        });
      });
    }

    timer = setTimeout(
      attemptMeasure,
      isCrossTab ? INITIAL_DELAY_CROSS_TAB_MS : INITIAL_DELAY_SAME_TAB_MS,
    );

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    isOpen,
    currentStep,
    overlaySize.width,
    overlaySize.height,
    spotX,
    spotY,
    spotW,
    spotH,
  ]);

  const topScrimStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Math.max(0, spotY.value),
    backgroundColor: SCRIM_COLOR,
  }));

  const bottomScrimStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: spotY.value + spotH.value,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SCRIM_COLOR,
  }));

  const leftScrimStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: spotY.value,
    left: 0,
    width: Math.max(0, spotX.value),
    height: Math.max(0, spotH.value),
    backgroundColor: SCRIM_COLOR,
  }));

  const rightScrimStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: spotY.value,
    left: spotX.value + spotW.value,
    right: 0,
    height: Math.max(0, spotH.value),
    backgroundColor: SCRIM_COLOR,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: spotX.value,
    top: spotY.value,
    width: Math.max(0, spotW.value),
    height: Math.max(0, spotH.value),
    borderRadius: currentStep?.spotlightRadius ?? 16,
    borderWidth: 2.5,
    borderColor: colors.accentBorder,
  }));

  if (!isOpen || !currentStep) return null;

  const placement = computeTooltipPlacement(
    measuredRect,
    overlaySize.height,
    insets.top,
    insets.bottom,
  );

  return (
    <View
      ref={overlayRef}
      collapsable={false}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) {
          setOverlaySize({ width, height });
        }
      }}
      style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}
    >
      {measuredRect ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-only">
          <Animated.View style={topScrimStyle} />
          <Animated.View style={bottomScrimStyle} />
          <Animated.View style={leftScrimStyle} />
          <Animated.View style={rightScrimStyle} />
          <Animated.View style={ringStyle} pointerEvents="none" />
        </View>
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM_COLOR }]}
          pointerEvents="box-only"
        />
      )}

      <Animated.View
        key={currentStep.id}
        entering={FadeIn.duration(160).easing(Easing.out(Easing.cubic))}
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: placement.top,
        }}
      >
        <Card
          elevated
          style={{ borderColor: colors.accentBorder }}
          className="p-4"
        >
          <View className="flex-row items-center justify-between">
            <Badge
              label={`Step ${stepIndex + 1} / ${FEATURE_TOUR_STEPS.length}`}
              variant="accent"
              pill
              tabularNums
            />
            <Button
              label="Skip"
              variant="secondary"
              onPress={() => {
                triggerHaptic("light");
                closeTour();
              }}
            />
          </View>

          <Text variant="heading" className="mt-3">
            {currentStep.title}
          </Text>
          <Text variant="caption" className="mt-1">
            {currentStep.description}
          </Text>

          <View className="mt-4 flex-row gap-2">
            {!isFirst ? (
              <Button
                label="Back"
                variant="secondary"
                className="w-24"
                onPress={() => {
                  triggerHaptic("light");
                  prevStep();
                }}
              />
            ) : null}
            <Button
              label={isLast ? "Finish Tour" : "Next"}
              className="flex-1"
              onPress={() => {
                triggerHaptic(isLast ? "success" : "light");
                nextStep();
              }}
            />
          </View>
        </Card>
      </Animated.View>
    </View>
  );
}
