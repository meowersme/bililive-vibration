import { useCallback, useEffect, useRef, useState } from 'react';

import { EE } from './bus';
import { VibrationController } from './controller';
import { LineChart } from './visualizer';

function App() {
  const [filename] = useState('vibration-segment-sample.mp4');
  const [vibrationData, setVibrationData] = useState([]);
  const [debugData, setDebugData] = useState('');

  const controllerRef = useRef<VibrationController | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [gamepads, setGamepads] = useState<string>('手柄未连接（请刷新页面并按手柄上任意按钮）');

  const load = useCallback(async () => {
    controllerRef.current?.destroy();

    controllerRef.current = new VibrationController(videoRef.current!);
    const jsonUrl = filename.replace('.mp4', '.json');
    const response = await fetch(jsonUrl);
    const data = await response.json();
    console.log('vibration data', jsonUrl, data);
    setVibrationData(data);

    const controller = controllerRef.current!;
    controller.clearVibrationData();
    setDebugData(`已解析震动数据长度: ${data.length}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((element: any) => {
      controller.addVibrationData(element);
    });
  }, [filename]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    EE.on('GAMEPAD_UPDATE', (gamepads) => {
      const formatGamepad = (gp: Gamepad) =>
        `ID: ${gp.id}, 支持震动: ${gp.vibrationActuator ? '是' : '否'}`;
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
        <button type="button" className="nes-btn is-success h-12 mb-[30px] ml-4 whitespace-nowrap">
          点击测试震动
        </button>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center w-full">
        <video
          playsInline
          ref={videoRef}
          controls
          src={filename}
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
          <select required id="success_select">
            <option value="" disabled selected hidden>
              选择视频...
            </option>
            <option value="0">To be</option>
            <option value="1">Not to be</option>
          </select>
        </div>
        <label className="nes-btn ml-8">
          <span>选择文件</span>
          <input type="file" className="w-0 h-0" />
        </label>
      </section>

      <Manual />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <>
      <h2 className="text-lg sm:text-2xl font-bold">
        <a href="#" className="mr-4">
          {'>>'}
        </a>
        BILIBILI 直播震动 录播播放器
        <a href="#" className="ml-4">
          {'<<'}
        </a>
      </h2>
      <p className="text-center mt-4 mb-4">
        支持播放带震动数据的B站直播录播视频，并通过连接的手柄同步震动反馈。
      </p>
    </>
  );
}

function Manual() {
  return (
    <div className="nes-container with-title mt-8 px-6 sm:px-16">
      <p className="title !-mt-9">常见问题</p>
      <p>
        <b>如何使用本站？</b>
      </p>
      <ul className="nes-list is-disc">
        <li>连上手柄，点击上方的选择框，可以直接播放一些我准备的直播片段。</li>
        <li>如果你有想要重温的直播片段，也可以自己切片播放，或者联系我投稿。</li>
        <li>震动数据直接从视频流中解析，理论上可以完全再现直播时的体验。</li>
      </ul>
      <br />
      <p>
        <b>如何自己切片并播放带震动的录播？</b>
      </p>
      {/* <p>Good morning. Thou hast had a good night's sleep, I hope.</p> */}
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
      </ul>

      <br />

      <p>
        <b>震动反馈的兼容性？</b>
      </p>
      <ul className="nes-list is-disc">
        <li>推荐使用 PC/Mac 上的 Chrome 浏览器，兼容性最好。</li>
        <li>也支持 Android 手机 Chrome 浏览器直接震动，但效果可能一般。</li>
        <li>推荐连接 Xbox 兼容手柄以获得最佳体验，不支持 PS5 手柄。</li>
        <li>手柄连接后按下任意按钮才能被识别。点击上方绿色按钮可以测试震动。</li>
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
