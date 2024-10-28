import { parseVibrationDataStream, VibrationData } from 'bililive-vibration-parser';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EE, userInteractionDetected } from './bus';
import { VibrationController } from './controller';
import { LineChart } from './visualizer';
import manifest from './assets/manifest.json';

function App() {
  // See: https://muffinman.io/blog/hack-for-ios-safari-to-display-html-video-thumbnail/
  const [filename, setFilename] = useState('vibration-segment-sample.mp4#t=0.2');
  const [vibrationData, setVibrationData] = useState<VibrationData[]>([]);

  const controllerRef = useRef<VibrationController | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const progressRef = useRef<HTMLProgressElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);

  const [showProgress, setShowProgress] = useState(false);
  const [gamepads, setGamepads] = useState<string>('手柄未连接（请刷新页面并按手柄上任意按钮）');
  const [debugData, setDebugData] = useState('');
  const [vibrationTesting, setVibrationTesting] = useState(false);

  const onSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'default') {
      return;
    }

    setFilename(value);
  }, []);

  const updateProgressBar = useCallback((percent: number, text: string) => {
    if (progressRef.current && progressTextRef.current) {
      progressRef.current.value = percent;
      progressTextRef.current.innerText = text;
    }
  }, []);

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
        const percent = Math.floor((e.current / e.total) * 100);
        updateProgressBar(percent, `已解析震动数据 ${percent}% (${e.current}/${e.total})`);
      });

      file
        .stream()
        .pipeThrough(progress)
        .pipeTo(stream)
        .then(() => {
          setVibrationData(data);
          setDebugData(`已解析震动数据长度: ${data.length}`);
          updateProgressBar(100, `已解析震动数据 100%`);
        });
    },
    [updateProgressBar],
  );

  const onFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        setDebugData('选择文件为空');
        return;
      }

      try {
        setShowProgress(true);
        setFilename(URL.createObjectURL(file));
        await processFile(file);
      } catch (error) {
        console.error(error);
        setDebugData('震动数据解析失败: ' + (error as Error).message);
      }
    },
    [processFile],
  );

  const load = useCallback(async () => {
    controllerRef.current?.destroy();
    controllerRef.current = new VibrationController(videoRef.current!);

    if (filename.startsWith('blob:')) {
      return;
    }

    const jsonUrl = filename.replace('.mp4', '.json');
    const response = await fetch(jsonUrl);
    const data: VibrationData[] = await response.json();
    setVibrationData(data);

    const controller = controllerRef.current!;
    controller.clearVibrationData();

    setDebugData(`已解析震动数据长度: ${data.length}`);
    data.forEach((element) => {
      controller.addVibrationData(element);
    });
  }, [filename]);

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
    load().catch((error) => {
      console.error(error);
      setDebugData('震动数据加载失败: ' + error.message);
    });
  }, [load]);

  useEffect(() => {
    EE.on('GAMEPAD_UPDATE', (gamepads) => {
      const formatGamepad = (gp: Gamepad) =>
        `ID: ${gp.id.slice(0, 20)}.., 支持震动: ${gp.vibrationActuator ? '是' : '否'}`;
      setGamepads(`手柄已连接：\n${gamepads.map((gp) => formatGamepad(gp)).join('\n')}`);
    });
  }, []);

  return (
    <main className="flex items-center flex-col pt-8 mx-auto w-full sm:w-4/5 px-2">
      <Header />

      <div className="flex items-end flex-col sm:flex-row">
        <div className="nes-balloon from-right">
          <span>{gamepads}</span>
          <br />
          <span>{debugData}</span>
        </div>
        <button
          type="button"
          className={`nes-btn is-success h-12 mb-[30px] ml-4 whitespace-nowrap ${vibrationTesting ? 'animate-shake' : ''}`}
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

      <section className="flex justify-center w-full mt-8">
        <div className="nes-select w-1/2">
          <select defaultValue="default" onChange={onSelectChange}>
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
        <label className="nes-btn is-primary ml-8">
          <span>选择文件</span>
          <input type="file" className="w-0 h-0 left-0 top-0" onChange={onFileUpload} />
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
        <span ref={progressTextRef} className="z-10">
          解析器已就绪...
        </span>
      </div>

      <Manual />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <>
      <h2 className="text-2xl font-bold text-center break-keep">
        <a href="#" className="mr-4">
          {'>>'}
        </a>
        BILIBILI 直播震动 录播播放器
        <a href="#" className="ml-4 hidden sm:inline">
          {'<<'}
        </a>
      </h2>
      <p className="text-center mt-4 mb-4">
        支持播放带震动数据的B站直播录播视频，并通过连接的手柄或手机同步震动反馈。
      </p>
    </>
  );
}

// pnpm run pyftsubset 字体子集字符预设
// 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,?!-:;()[]{}"'&%$@#*+/
function Manual() {
  const [, setRerender] = useState(0);

  useEffect(() => {
    EE.on('USER_INTERACTION', () => {
      setRerender((v) => v + 1);
    });
  }, []);

  return (
    <div className="nes-container with-title mt-8 px-6 sm:px-16 text-sm sm:text-base">
      <p className="title !-mt-9">常见问题</p>
      <p>
        <b>如何使用本站？</b>
      </p>
      <ul className="nes-list is-disc">
        <li>连上手柄，点击上方的「选择视频」，可以直接播放一些准备好的直播片段。</li>
        <li>如果你有想要重温的直播片段，也可以自己切片播放，或者联系我投稿。</li>
        <li>震动数据直接从视频流中解析，理论上可以完全再现直播时的体验。</li>
        <li>如果没有震动设备，也可以在视频旁边查看对应的震动可视化波形图。</li>
      </ul>
      <br />
      <p>
        <b>如何自己切片并播放带震动的录播？</b>
      </p>
      <ul className="nes-list is-disc">
        <li>
          准备一个未经处理过的直播录像（比如
          <a href="https://rec.danmuji.org/" target="_blank">
            录播姬
          </a>
          ），不可以是B站二压过的。
        </li>
        <li>
          下载
          <a href="https://mifi.no/losslesscut/" target="_blank">
            {' LosslessCut '}
          </a>
          无损剪辑软件，不支持其他有损剪辑软件。
        </li>
        <li>将想要播放的片段切出来（最好不要太长，不然在线解析比较费时）。</li>
        <li>点击上方的「选择文件」按钮进行解析并播放。</li>
        <li>解析大于 1GB 的视频文件时浏览器卡住是正常的，等待即可。</li>
      </ul>

      <br />

      <p>
        <b>震动反馈的兼容性？</b>
      </p>
      <ul className="nes-list is-disc">
        <li>推荐使用 PC/Mac 上的新版 Chrome 浏览器，兼容性最好。</li>
        <li>也支持 Android 手机 Chrome 浏览器直接震动，但效果一般（没有强弱区分）。</li>
        <li>
          因为苹果未开放网页震动权限，<b>不支持 iOS 浏览器震动。</b>
        </li>
        <li>推荐连接 Xbox 兼容手柄以获得最佳体验，不支持 PS5 手柄。</li>
        <li>手柄连接后按下任意按键才能被识别，点击上方绿色按钮可以测试震动。</li>
      </ul>

      <br />

      <p>
        <b>为什么点击测试震动后设备没有反应？</b>
      </p>
      <ul className="nes-list is-disc">
        <li>不支持 iOS 浏览器。Android 请使用 Chrome 浏览器。</li>
        <li>请检查手机设置中震动反馈是否已开启，并关闭勿扰模式/省电模式/静音模式等。</li>
        <li>
          当前浏览器是否支持 navigator.vibrate():{' '}
          {typeof navigator.vibrate === 'function' ? '是' : '否'}，用户交互:{' '}
          {userInteractionDetected() ? '是' : '否'}
        </li>
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <p className="text-center mt-8 mb-8">
      <a href="https://weibo.com/u/7917238293" target="_blank">
        @秋風星落
      </a>
      {' | '}
      <a href="https://github.com/meowersme/bililive-vibration" target="_blank">
        GitHub
      </a>
    </p>
  );
}

export default App;
