export function Header() {
  return (
    <>
      <h2 className="text-2xl font-bold text-center break-keep font-pixel">
        <a href="#" className="mr-4">
          {'>>'}
        </a>
        BILIBILI 直播震动 录播播放器
        <a href="#" className="ml-4 hidden sm:inline">
          {'<<'}
        </a>
      </h2>
      <p className="text-lg text-center mt-4 mb-4 font-pixel">
        支持播放带震动数据的B站直播录播视频，并通过连接的手柄或手机同步震动反馈。
      </p>
    </>
  );
}

export function Footer() {
  return (
    <p className="text-center mt-8 mb-8 text-lg font-pixel text-nowrap">
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
