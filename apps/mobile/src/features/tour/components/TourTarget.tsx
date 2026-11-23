import { useEffect, useRef, type ReactNode } from "react";
import { View } from "react-native";
import type { TourStepId } from "../tourSteps";
import { registerTourTarget, unregisterTourTarget } from "../tourStore";

type TourTargetProps = {
  readonly id: TourStepId;
  readonly children: ReactNode;
  readonly className?: string;
};

export function TourTarget({ id, children, className }: TourTargetProps) {
  const ref = useRef<View | null>(null);

  useEffect(() => {
    registerTourTarget(id, ref);
    return () => unregisterTourTarget(id);
  }, [id]);

  return (
    <View ref={ref} collapsable={false} className={className}>
      {children}
    </View>
  );
}
