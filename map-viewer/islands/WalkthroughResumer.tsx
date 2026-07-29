import { useEffect } from "preact/hooks";
import { useWalkthroughDriverContext } from "@/islands/contexts/walkthrough-driver/index.ts";
import { useStoresContext } from "@/islands/contexts/stores/index.ts";

export type WalkthroughResumerProps = {
  resumeSteps: number[];
};

export default function WalkthroughResumer({
  resumeSteps,
}: WalkthroughResumerProps) {
  const { mapIsLoaded } = useStoresContext().injectAppMapStore();

  const { getLastWalkThroughStep, injectWalkThroughDriver } =
    useWalkthroughDriverContext();

  useEffect(() => {
    if (!mapIsLoaded.value) return;
    const lastStep = getLastWalkThroughStep();
    if (lastStep !== null && resumeSteps.includes(lastStep)) {
      const driverObj = injectWalkThroughDriver();
      driverObj.drive(lastStep);
    }
  }, [resumeSteps, mapIsLoaded.value]);

  return null;
}
