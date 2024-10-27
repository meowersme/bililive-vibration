# bililive-vibration-parser

解析 bilibili 直播间视频流中包含的震动数据。

## 使用

以 JavaScript 库的形式使用：

```javascript
import { readFile } from 'fs/promises';
import { parseVibrationData } from 'bililive-vibration-parser';

const buffer = await readFile('vibration-segment-sample.mp4');
const data = await parseVibrationData(buffer);

console.log(data);
// [
//   {"timestamp":0.033,"vibrate":{"l":7001,"r":7204}},
//   {"timestamp":0.05,"vibrate":{"l":8666,"r":8353}},
//   {"timestamp":0.066,"vibrate":{"l":8666,"r":8353}},
//   /* ... */
//   {"timestamp":7.683,"vibrate":{"l":2357,"r":2199}}
//   {"timestamp":7.7,"vibrate":{"l":2357,"r":2199}},
//   {"timestamp":7.716,"vibrate":{"l":0,"r":0}}
// ]
```

命令行使用，为某个目录下的所有 `.mp4` 文件解析并生成震动数据 `.json`：

```bash
pnpm --filter='bililive-vibration-parser' run bin ~/Downloads/震动直播素材
```

## 原理

解析 H.264/H.265 视频码流中包含的 [SEI 数据](https://www.rtcdeveloper.cn/cn/community/blog/18970) `B_LIVE_VIBRATION`。

> SEI（Supplemental Enhancement Information），是定义在视频码流里面，提供在视频码流中添加信息的方法。在当前的流媒体中，可以用来添加一些视频无关的信息，例如歌词等，来做到同步显示。SEI 可以在编码时候进行添加，也可以在传输时候进行添加。

## 视频格式

只支持解析未经二次压制的 B 站直播视频流，二压或者有损剪辑软件会导致 SEI 数据丢失。

可以使用 [录播姬](https://rec.danmuji.org) 录制，使用 [LosslessCut](https://mifi.no/losslesscut) 或者 ffmpeg 无损剪辑。

你可以在 [这里](https://github.com/meowersme/bililive-vibration/tree/main/packages/player/public) 查看示例视频。
