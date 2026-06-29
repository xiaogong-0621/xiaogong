Component({
  data: {
    current: 0,
    tabs: [
      { icon: 'search', text: '探索', path: '/pages/home/home' },
      { icon: 'chart', text: '榜单', path: '/pages/music/music' },
      { icon: 'queue', text: '房间', path: '/pages/list/list' },
      { icon: 'profile', text: '我的', path: '/pages/profile/profile' },
      { icon: 'user', text: '个人主页', path: '/pages/user/user' }
    ]
  },
  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      if (index === this.data.current) return
      wx.switchTab({ url: path })
    }
  }
})
