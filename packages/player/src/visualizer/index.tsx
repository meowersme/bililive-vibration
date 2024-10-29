import { VibrationData } from 'bililive-vibration-parser';
import { useEffect, useState } from 'react';
import { SciChartSurface } from 'scichart';
import { SciChartReact, TResolvedReturnType } from 'scichart-react';

import { EE } from '../bus';
import { drawExample } from './draw';

SciChartSurface.configure({
  dataUrl: `/assets/scichart2d-3.5.687.data`,
  wasmUrl: `/assets/scichart2d-3.5.687.wasm`,
});

let globalDuration = 0;

type ControlsHandle = TResolvedReturnType<typeof drawExample>['controls'];

export function LineChart({ data }: { data: VibrationData[] }) {
  const [controls, setControls] = useState<ControlsHandle | null>(null);

  useEffect(() => {
    // 当数据更新时，重新加载图表上的数据点
    controls?.loadPoints(data);

    // 当视频播放进度更新时，同步更新图表上的红色指示线
    const listener = (currentTime: number, duration: number) => {
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
      initChart={drawExample}
      onInit={({ controls }: TResolvedReturnType<typeof drawExample>) => {
        setControls(controls);
        controls.updateIndicator(0, globalDuration);
      }}
    />
  );
}
