const api = require('./utils/api')

App({
  onLaunch() {
    const token = api.getToken()
    if (token) {
      this.globalData.isLoggedIn = true
    }

    // 状态栏高度（rpx），解决 env(safe-area-inset-top) 不生效的问题
    const sys = wx.getSystemInfoSync()
    this.globalData.statusBarHeight = Math.round(sys.statusBarHeight * 750 / sys.screenWidth)

    // 全局音频上下文，切页面不中断播放
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.obeyMuteSwitch = false
  },

  globalData: {
    isLoggedIn: false,
    statusBarHeight: 40
  }
})