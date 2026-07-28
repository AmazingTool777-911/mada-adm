import { useEffect } from "preact/hooks";
// import { useSignal } from "@preact/signals";
import { useWalkthroughDriverContext } from "@/islands/contexts/walkthrough-driver/index.ts";

export type WalkthroughResumerProps = {
  resumeSteps: number[];
};

export default function WalkthroughResumer({
  resumeSteps,
}: WalkthroughResumerProps) {
  // const isRendered = useSignal(false);

  const { getLastWalkThroughStep, injectWalkThroughDriver } =
    useWalkthroughDriverContext();

  useEffect(() => {
    // if (!isRendered.value) {
    //   isRendered.value = true;
    //   return;
    // }
    const lastStep = getLastWalkThroughStep();
    if (lastStep !== null && resumeSteps.includes(lastStep)) {
      const driverObj = injectWalkThroughDriver();
      driverObj.drive(lastStep);
    }
  }, [resumeSteps]);

  return null;
}
