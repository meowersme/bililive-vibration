import { VibrationData } from 'bililive-vibration-parser';
import { useCallback, useEffect, useRef, useState } from 'react';

import manifest from './assets/manifest.json';
import { EE } from './bus';
import { Footer, Header } from './components/Header';
import { useParseVibration } from './components/hooks';
import { Manual } from './components/Manual';
import { VibrationController } from './controller';
import { LineChart } from './visualizer';

const DEFAULT_VIDEO_URL = '/assets/vibration-segment-sample.mp4#t=0.2';

function App() {
  const [filename, setFilename] = useState(DEFAULT_VIDEO_URL);
  const [vibrationData, setVibrationData] = useState<VibrationData[]>([]);

  const controllerRef = useRef<VibrationController | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const progressRef = useRef<HTMLProgressElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);

  const [showProgress, setShowProgress] = useState(false);
  const [gamepads, setGamepads] = useState<string>('手柄未连接（请刷新页面并按手柄上任意按钮）');
  const [debugData, setDebugData] = useState('');
  const [vibrationTesting, setVibrationTesting] = useState(false);

  /**
   * 更新 UI 进度条。
   */
  const updateProgressBar = useCallback((percent: number, text: string) => {
    if (progressRef.current && progressTextRef.current) {
      progressRef.current.value = percent;
      progressTextRef.current.innerText = text;
    }
  }, []);

  const processFile = useParseVibration(updateProgressBar);

  /**
   * 从文件中解析震动数据。
   */
  const loadFromFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !file.type.startsWith('video/mp4')) {
        alert('请选择 MP4 格式的视频文件');
        return;
      }

      try {
        setShowProgress(true);
        setFilename(URL.createObjectURL(file));
        const data = await processFile(file);

        setVibrationData(data);
        setDebugData(`已解析震动数据长度: ${data.length}`);
        controllerRef.current?.initVibrationStore(data);
      } catch (error) {
        console.error(error);
        setDebugData('震动数据解析失败: ' + (error as Error).message);
      }
    },
    [processFile],
  );

  /**
   * 从 URL 加载震动数据。
   */
  const loadFromUrl = useCallback(async (url: string) => {
    try {
      // Safari 上需要在 URL 后面加上 #t=0.1 才能显示视频缩略图
      // See: https://muffinman.io/blog/hack-for-ios-safari-to-display-html-video-thumbnail/
      setFilename(url.includes('#t') ? url : `${url}#t=0.1`);

      // 默认加载同名的 JSON 文件
      const jsonUrl = url.replace('.mp4', '.json');
      const response = await fetch(jsonUrl);
      const data = await response.json();

      setVibrationData(data);
      setDebugData(`已解析震动数据长度: ${data.length}`);
      controllerRef.current?.initVibrationStore(data);
    } catch (error) {
      console.error(error);
      setDebugData('震动数据加载失败: ' + (error as Error).message);
    }
  }, []);

  /**
   * 测试设备震动反馈。
   */
  const onTestVibration = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) {
      setDebugData('震动控制器初始化失败');
      return;
    }

    setVibrationTesting(true);
    controller.setVibratorState(65535, 65535);

    setTimeout(() => {
      setVibrationTesting(false);
      setDebugData('如果手机/手柄没有震动，请查看页面底部说明');
      controller.setVibratorState(0, 0);
    }, 1000);
  }, []);

  useEffect(() => {
    EE.on('GAMEPAD_UPDATE', (gamepads) => {
      if (!gamepads.length) {
        setGamepads('手柄未连接（请刷新页面并按手柄上任意按钮）');
        return;
      }

      const formatGamepad = (gp: Gamepad) =>
        `${gp.id.slice(0, 20)}.., 支持震动: ${gp.vibrationActuator ? '是' : '否'}`;
      setGamepads(`手柄已连接: \n${gamepads.map((gp) => formatGamepad(gp)).join('\n')}`);
    });
  }, []);

  useEffect(() => {
    controllerRef.current?.destroy();
    controllerRef.current = new VibrationController(videoRef.current!);
    loadFromUrl(DEFAULT_VIDEO_URL);
  }, [loadFromUrl]);

  return (
    <main className="flex items-center flex-col pt-8 mx-auto w-full sm:w-4/5 px-2">
      <Header />

      <div className="flex items-end flex-col sm:flex-row font-pixel">
        <div className="nes-balloon from-right">
          <span>{gamepads}</span>
          <br />
          <span>{debugData}</span>
        </div>
        <button
          type="button"
          className={`nes-btn text-lg is-success h-12 mb-[30px] ml-4 whitespace-nowrap ${vibrationTesting ? 'animate-shake' : ''}`}
          onClick={onTestVibration}
        >
          点击测试震动
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center w-full">
        <video
          playsInline
          ref={videoRef}
          controls
          src={filename}
          preload="metadata"
          className="w-full sm:w-[48%]"
          onCanPlay={() => {
            if (videoRef.current) {
              EE.emit('VIDEO_TIME_UPDATE', videoRef.current.currentTime, videoRef.current.duration);
            }
          }}
        />
        <div className="w-full sm:w-[48%] aspect-video mt-4 sm:mt-0">
          <LineChart data={vibrationData} />
        </div>
      </div>

      <section className="flex justify-center w-full mt-8 text-sm sm:text-lg font-pixel">
        <div className="nes-select sm:w-1/2 grow sm:grow-0">
          <select
            defaultValue="default"
            onChange={(e) => {
              if (e.target.value !== 'default') {
                loadFromUrl(e.target.value);
              }
            }}
          >
            <option value="default" disabled hidden>
              选择视频...
            </option>
            {manifest.map((item) => (
              <option key={item.url} value={item.url}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <label
          className="nes-btn is-primary ml-4 sm:ml-8 text-nowrap"
          onDrop={(e) => {
            e.preventDefault();
            loadFromFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <span>选择文件/拖拽</span>
          <input
            type="file"
            className="w-0 h-0 left-0 top-0"
            onChange={(e) => loadFromFile(e.target.files?.[0])}
          />
        </label>
      </section>

      <div
        className={`relative flex justify-center items-center w-4/5 h-12 mt-8 ${showProgress ? '' : 'hidden'}`}
      >
        <progress
          ref={progressRef}
          className="nes-progress is-primary m-0 absolute top-0 left-0"
          value="20"
          max="100"
        />
        <span ref={progressTextRef} className="z-10 font-pixel">
          解析器已就绪...
        </span>
      </div>

      <Manual />
      <Footer />
    </main>
  );
}

export default App;
