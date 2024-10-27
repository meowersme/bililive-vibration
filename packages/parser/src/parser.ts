import MP4Box, { Log, MP4ArrayBuffer, MP4File, MP4Info, MP4Sample } from 'mp4box';

/**
 * B 站直播视频流 SEI 中包含的震动数据。
 */
export type VibrationData = {
  timestamp: number;
  vibrate: {
    l: number;
    r: number;
  };
};

/**
 * 解析 B 站直播视频流 SEI 中包含的震动数据。
 *
 * @param buffer 视频数据
 * @returns 解析到的震动数据
 */
export async function parseVibrationData(buffer: Buffer) {
  const temp: VibrationData[] = [];

  await parseSeiData(buffer, (data) => {
    temp.push(data);
    // console.log(JSON.stringify(data));
  });

  const sorted = temp.sort((a, b) => a.timestamp - b.timestamp);
  const filtered = [];

  for (let i = 0; i < sorted.length; i++) {
    const element = sorted[i];

    if (
      !element ||
      !element.vibrate ||
      typeof element.vibrate.l !== 'number' ||
      typeof element.vibrate.r !== 'number'
    ) {
      console.warn('解析到无效的震动数据', element);
      continue;
    }

    const isEmptyElement = element.vibrate.l === 0 && element.vibrate.r === 0;
    if (!filtered.length) {
      if (isEmptyElement) {
        continue;
      }
    }

    // 我们需要保留空元素来重置振动状态，但连续的空元素是可以压缩掉的
    // 如果只保留一个的话画图的时候会比较奇怪，所以我们保留开头和结尾两个

    const prevElement = sorted[i - 1];
    const isPrevElementEmpty =
      prevElement && prevElement.vibrate.l === 0 && prevElement.vibrate.r === 0;

    const nextElement = sorted[i + 1];
    const isNextElementEmpty =
      nextElement && nextElement.vibrate.l === 0 && nextElement.vibrate.r === 0;

    if (isPrevElementEmpty && isEmptyElement && (isNextElementEmpty || !nextElement)) {
      continue;
    }

    filtered.push(element);
  }

  return filtered;
}

/**
 * 解析 H.264 视频中的 SEI 数据。
 *
 * @param buffer 视频数据
 * @param onSeiMessage SEI 数据时的回调
 * @returns 解析后的 MP4Box 实例
 */
export async function parseSeiData(buffer: Buffer, onSeiMessage: (data: VibrationData) => void) {
  const arrayBuffer = new Uint8Array(buffer).buffer as MP4ArrayBuffer;
  arrayBuffer.fileStart = 0;

  const mp4BoxFile = MP4Box.createFile();

  const info = await new Promise<MP4Info>((resolve) => {
    mp4BoxFile.onReady = function (info) {
      resolve(info);
    };

    mp4BoxFile.appendBuffer(arrayBuffer);
    mp4BoxFile.flush();
  });

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

  return new Promise<MP4File>((resolve) => {
    mp4BoxFile.onSamples = function (id, user, samples) {
      // 处理每帧数据，解析出 SEI 消息
      for (const sample of samples) {
        const vibrationData = processSampleData(sample);
        if (vibrationData) {
          onSeiMessage(vibrationData);
        }
      }

      // 分块加载的数据全部处理完毕
      if (trak.nextSample === trak.samples.length) {
        resolve(mp4BoxFile);
      }
    };

    mp4BoxFile.start();
  });
}

/**
 * 设置调试模式。
 *
 * @param enabled 是否启用调试模式
 */
export function setDebugMode(enabled: boolean) {
  Log.setLogLevel(enabled ? Log.debug : Log.error);
}

function processSampleData(sample: MP4Sample) {
  const data = sample.data;
  const dataUint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  // 找到 SEI 数据的起始位置
  // See: https://www.rtcdeveloper.cn/cn/community/blog/18970
  let seiStartOffset = -1;
  for (let i = 0; i < dataUint8.length; i++) {
    // 0x06 - NAL unit type 6 (SEI)
    // 0x05 - SEI payload type 5 (user data unregistered)
    if (dataUint8[i] === 0x06 && dataUint8[i + 1] === 0x05) {
      seiStartOffset = i + 1;
      break;
    }
  }

  if (seiStartOffset === -1) {
    return;
  }

  let offset = seiStartOffset;

  const isEndOfSei = () => {
    // 0x80 - rbsp_trailing_bits
    return offset >= dataUint8.byteLength || dataUint8[offset] === 0x80;
  };

  while (!isEndOfSei()) {
    const payloadType = dataUint8[offset]; // 5
    const payloadSize = dataUint8[offset + 1];

    if (payloadType !== 5 || !payloadSize || payloadSize < 16) {
      break;
    }

    const payload = dataUint8.slice(offset + 2, offset + 2 + payloadSize);
    offset += 2 + payloadSize;

    // B_LIVE_VIBRATION
    const uuid = new TextDecoder().decode(payload.slice(0, 16));

    // B 站直播定义的 SEI 数据类型，这里我们只关心震动数据
    if (uuid === 'B_LIVE_VIBRATION') {
      // '{"l":11800,"r":12859}'
      const content = new TextDecoder().decode(payload.slice(16));
      // console.log("onSeiMessage", sample.cts / sample.timescale, uuid, content);
      return {
        timestamp: sample.cts / sample.timescale,
        vibrate: JSON.parse(content),
      };
    }
  }
}
