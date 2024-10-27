import { VibrationData } from 'bililive-vibration-parser';
import {
  EAutoRange,
  EAxisAlignment,
  ELabelPlacement,
  FastLineRenderableSeries,
  MouseWheelZoomModifier,
  NumberRange,
  NumericAxis,
  SciChartSurface,
  VerticalLineAnnotation,
  XyDataSeries,
  ZoomExtentsModifier,
  ZoomPanModifier,
} from 'scichart';

import { appTheme } from './theme';

export const drawExample = async (rootElement: string | HTMLDivElement) => {
  const { wasmContext, sciChartSurface } = await SciChartSurface.create(rootElement, {
    theme: appTheme.SciChartJsTheme,
  });

  const xAxis = new NumericAxis(wasmContext, {
    // axisTitle: "X Axis",
    visibleRange: new NumberRange(0, 30),
    autoRange: EAutoRange.Never,
  });

  sciChartSurface.xAxes.add(xAxis);

  const yAxis = new NumericAxis(wasmContext, {
    axisAlignment: EAxisAlignment.Left,
    visibleRange: new NumberRange(0, 65535),
    // autoRange: EAutoRange.Never,
    // visibleRange: new NumberRange(-5000, 5000),
    // autoRange: EAutoRange.Always,
    // axisTitle: "Y Axis",
  });

  sciChartSurface.yAxes.add(yAxis);

  // Vertically line stretched across the viewport
  const indicator = new VerticalLineAnnotation({
    labelPlacement: ELabelPlacement.Axis,
    showLabel: true,
    stroke: 'Red',
    strokeThickness: 2,
    x1: 50,
    axisLabelFill: 'Red',
  });

  sciChartSurface.annotations.add(indicator);

  const dataSeries = new XyDataSeries(wasmContext);
  const dataSeries2 = new XyDataSeries(wasmContext);

  sciChartSurface.renderableSeries.add(
    new FastLineRenderableSeries(wasmContext, {
      dataSeries: dataSeries2,
      stroke: appTheme.VividPink,
      strokeThickness: 2,
    }),
  );

  sciChartSurface.renderableSeries.add(
    new FastLineRenderableSeries(wasmContext, {
      dataSeries,
      stroke: appTheme.VividSkyBlue,
      strokeThickness: 2,
    }),
  );

  sciChartSurface.chartModifiers.add(
    new ZoomExtentsModifier(),
    new ZoomPanModifier(),
    new MouseWheelZoomModifier(),
  );

  // Buttons for chart
  const loadPoints = (data: VibrationData[]) => {
    // Clear state
    dataSeries.clear();
    dataSeries2.clear();

    let maxY = 0;

    const xValues: number[] = [];
    const yValues: number[] = [];
    const yValues2: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      if (!entry) {
        continue;
      }

      xValues.push(entry.timestamp);
      yValues.push(entry.vibrate.l);
      yValues2.push(entry.vibrate.r);

      if (entry.vibrate.l > maxY) {
        maxY = entry.vibrate.l;
      }

      if (entry.vibrate.r > maxY) {
        maxY = entry.vibrate.r;
      }
    }

    dataSeries.appendRange(xValues, yValues);
    dataSeries2.appendRange(xValues, yValues2);
    yAxis.visibleRange = new NumberRange(0, maxY);
  };

  let xAxisVisibleRangeMax = 0;
  const updateIndicator = (x: number, maxX: number) => {
    // console.log('Update Indicator', x);
    indicator.x1 = x;

    if (xAxisVisibleRangeMax !== maxX) {
      console.log('Update Visible Range', maxX);
      xAxisVisibleRangeMax = maxX;
      xAxis.visibleRange = new NumberRange(0, maxX);
    }
  };

  return { sciChartSurface, controls: { loadPoints, updateIndicator } };
};
