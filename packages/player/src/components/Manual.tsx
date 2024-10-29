import { useEffect, useState } from 'react';
import { EE, userInteractionDetected } from '../bus';

export function Manual() {
  const [, setRerender] = useState(0);

  useEffect(() => {
    EE.on('USER_INTERACTION', () => {
      setRerender((v) => v + 1);
    });
  }, []);

  return (
    <div className="nes-container with-title w-full sm:w-auto mt-8 px-6 sm:px-16 text-sm sm:text-base font-sans [&>p>b]:font-pixel">
      <p className="title !-mt-9 font-pixel">常见问题</p>
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
        <b>视频加载太卡怎么办？</b>
      </p>
      <ul className="nes-list is-disc">
        <li>服务器小水管，请见谅……开个科学会好很多。</li>
        <li>
          或者也可以直接从
          <a href="https://pan.baidu.com/s/16K4MkPS69qD5Vo7Wy0lhRQ?pwd=1885" target="_blank">
            百度网盘
          </a>
          下载切片然后本地播放（注意下载原画）。
        </li>
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
        <li>
          如果是手柄：请尝试切换无线/有线连接/重新插拔，
          <a href="https://hardwaretester.com/gamepad/" target="_blank">
            点这里测试手柄。
          </a>
        </li>
        <li>如果是手机：iOS 浏览器不支持震动，无解；Android 请使用 Chrome 浏览器。</li>
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
