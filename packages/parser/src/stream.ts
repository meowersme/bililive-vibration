import MP4Box, { MP4ArrayBuffer } from 'mp4box';
import { processSampleData, ProgressEvent, VibrationData } from './parser';

/**
 * 流式解析 B 站直播视频流 SEI 中包含的震动数据。
 *
 * @param onSeiMessage 解析到 SEI 消息时的回调
 * @param onComplete 解析完成时的回调
 * @returns 可写入数据的流
 */
export function parseVibrationDataStream(
  onSeiMessage: (data: VibrationData, progress: ProgressEvent) => void,
  onComplete?: () => void,
) {
  const mp4BoxFile = MP4Box.createFile();

  let fileStart = 0;

  const writable = new WritableStream<Buffer>({
    write(data) {
      const buffer = new Uint8Array(data).buffer as MP4ArrayBuffer;
      buffer.fileStart = fileStart;
      fileStart += buffer.byteLength;
      mp4BoxFile.appendBuffer(buffer);
    },
    close() {
      mp4BoxFile.flush();
    },
  });

  mp4BoxFile.onReady = function (info) {
    const videoTrack = info.videoTracks[0];
    if (!videoTrack) {
      throw new Error('无法解析视频信息');
    }

    mp4BoxFile.setExtractionOptions(videoTrack.id, null, {
      nbSamples: 100,
    });

    const trak = mp4BoxFile.extractedTracks[0]?.trak;
    if (!trak) {
      throw new Error('无法解析视频轨道信息');
    }

    mp4BoxFile.onSamples = function (id, user, samples) {
      // 处理每帧数据，解析出 SEI 消息
      for (const sample of samples) {
        const vibrationData = processSampleData(sample);
        if (vibrationData) {
          onSeiMessage(vibrationData, {
            timestamp: sample.cts / sample.timescale,
            duration: sample.duration / sample.timescale,
            current: sample.chunk_index,
            total: trak.samples.length,
          });
        }
      }

      // 分块加载的数据全部处理完毕
      if (trak.nextSample === trak.samples.length) {
        onComplete?.();
      }
    };

    mp4BoxFile.start();
  };

  return writable;
}
