// Credit: https://github.com/gpac/mp4box.js/issues/233#issuecomment-812219793

declare module 'mp4box' {
  export interface MP4MediaTrack {
    id: number;
    created: Date;
    modified: Date;
    movie_duration: number;
    movie_timescale: number;
    layer: number;
    alternate_group: number;
    volume: number;
    track_width: number;
    track_height: number;
    timescale: number;
    duration: number;
    bitrate: number;
    codec: string;
    language: string;
    nb_samples: number;
  }

  export interface MP4VideoData {
    width: number;
    height: number;
  }

  export interface MP4VideoTrack extends MP4MediaTrack {
    video: MP4VideoData;
  }

  export interface MP4AudioData {
    sample_rate: number;
    channel_count: number;
    sample_size: number;
  }

  export interface MP4AudioTrack extends MP4MediaTrack {
    audio: MP4AudioData;
  }

  export type MP4Track = MP4VideoTrack | MP4AudioTrack;

  export interface MP4Info {
    duration: number;
    timescale: number;
    fragment_duration: number;
    isFragmented: boolean;
    isProgressive: boolean;
    hasIOD: boolean;
    brands: string[];
    created: Date;
    modified: Date;
    tracks: MP4Track[];
    audioTracks: MP4AudioTrack[];
    videoTracks: MP4VideoTrack[];
  }

  export interface MP4Sample {
    alreadyRead: number;
    chunk_index: number;
    chunk_run_index: number;
    cts: number;
    data: Uint8Array;
    degradation_priority: number;
    depends_on: number;
    description: unknown;
    description_index: number;
    dts: number;
    duration: number;
    has_redundancy: number;
    is_depended_on: number;
    is_leading: number;
    is_sync: boolean;
    number: number;
    offset: number;
    size: number;
    timescale: number;
    track_id: number;
  }

  export type MP4ArrayBuffer = ArrayBuffer & { fileStart: number };

  export class DataStream {
    static BIG_ENDIAN: boolean;
    static LITTLE_ENDIAN: boolean;
    buffer: ArrayBuffer;
    constructor(arrayBuffer?: ArrayBuffer, byteOffset: number, endianness: boolean): void;
    // TODO: Complete interface
  }

  export interface Trak {
    mdia?: {
      minf?: {
        stbl?: {
          stsd?: {
            entries: {
              avcC?: {
                write: (stream: DataStream) => void;
              };
              hvcC?: {
                write: (stream: DataStream) => void;
              };
            }[];
          };
        };
      };
    };
    nextSample: number;
    samples: MP4Sample[];
  }

  export namespace Log {
    const debug: (module: string, msg: string) => void;
    const info: (module: string, msg: string) => void;
    const warn: (module: string, msg: string) => void;
    const error: (module: string, msg: string) => void;
    const setLogLevel: (level: Log.debug | Log.info | Log.warn | Log.error) => void;
  }

  export interface MP4File {
    onMoovStart?: () => void;
    onReady?: (info: MP4Info) => void;
    onError?: (e: string) => void;
    onSamples?: (id: number, user: unknown, samples: MP4Sample[]) => unknown;

    extractedTracks: { trak: Trak }[];

    getInfo(): MP4Info;
    appendBuffer(data: MP4ArrayBuffer): number;
    start(): void;
    stop(): void;
    flush(): void;
    releaseUsedSamples(trackId: number, sampleNumber: number): void;
    setExtractionOptions(
      trackId: number,
      user?: unknown,
      options?: { nbSamples?: number; rapAlignment?: number },
    ): void;
    getTrackById(trackId: number): Trak;
  }

  export function createFile(): MP4File;

  export {};
}
