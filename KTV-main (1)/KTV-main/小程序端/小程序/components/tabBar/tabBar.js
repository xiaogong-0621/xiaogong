Component({
  properties: {
    current: {
      type: Number,
      default: 0
    }
  },

  data: {
    tabs: [
      {
        icon: '/image/社区.png',
        text: '探索',
        path: '/pages/home/home'
      },
      {
        icon: '/image/排行.png',
        text: '榜单',
        path: '/pages/music/music'
      },
      {
        icon: '/image/播放列表.png',
        text: '队列',
        path: '/pages/list/list'
      },
      {
        icon: '/image/我的.png',
        text: '我的',
        path: '/pages/profile/profile'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      if (index === this.properties.current) return
      wx.switchTab({
        url: path
      })
    }
  }
})