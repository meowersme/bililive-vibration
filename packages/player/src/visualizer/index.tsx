import { VibrationData } from 'bililive-vibration-parser';
import { useEffect, useState } from 'react';
import { SciChartSurface } from 'scichart';
import { SciChartReact, TResolvedReturnType } from 'scichart-react';

import { EE } from '../bus';
import { drawExample } from './draw';

SciChartSurface.loadWasmFromCDN();

let globalDuration = 0;

export function LineChart({ data }: { data: VibrationData[] }) {
  // return <div>{data.length}</div>;

  const [controls, setControls] = useState<TResolvedReturnType<typeof drawExample>['controls']>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    undefined as any,
  );

  useEffect(() => {
    if (controls) {
      controls.loadPoints(data);
    }

    const listener = (currentTime: number, duration: number) => {
      // console.log("VIDEO_TIME_UPDATE", currentTime, duration, controls);
      globalDuration = duration;
      controls?.updateIndicator(currentTime, duration);
    };

    EE.on('VIDEO_TIME_UPDATE', listener);
    return () => {
      EE.off('VIDEO_TIME_UPDATE', listener);
    };
  }, [data, controls]);

  return (
    <SciChartReact
      // className={localClasses.chartArea}
      initChart={drawExample}
      onInit={({ controls }: TResolvedReturnType<typeof drawExample>) => {
        setControls(controls);
        // const autoStartTimerId = setTimeout(
        //   () => controls.loadPoints(data),
        //   0
        // );

        // return () => {
        //   clearTimeout(autoStartTimerId);
        // };
        controls.updateIndicator(0, globalDuration);
      }}
    />
  );
}
