import { parseVibrationDataStream, VibrationData } from 'bililive-vibration-parser';
import { useCallback } from 'react';

export function useParseVibration(updateProgressBar: (percent: number, text: string) => void) {
  const processFile = useCallback(
    async (file: File) => {
      let loaded = 0;
      const fileLength = file.size;

      const progress = new TransformStream({
        transform(chunk, controller) {
          loaded += chunk.length;
          controller.enqueue(chunk);

          const percent = Math.floor((loaded / fileLength) * 100);
          updateProgressBar(percent, `文件读取中 ${percent}%`);
        },
      });

      const data: VibrationData[] = [];

      const stream = parseVibrationDataStream((d, e) => {
        data.push(d);

        // 其实这里的长任务会阻塞 UI 更新导致进度条不变……不过算了
        const percent = Math.floor((e.current / e.total) * 100);
        updateProgressBar(percent, `已解析震动数据 ${percent}% (${e.current}/${e.total})`);
      });

      return file
        .stream()
        .pipeThrough(progress)
        .pipeTo(stream)
        .then(() => {
          updateProgressBar(100, `已解析震动数据 100%`);
          return data;
        });
    },
    [updateProgressBar],
  );

  return processFile;
}
