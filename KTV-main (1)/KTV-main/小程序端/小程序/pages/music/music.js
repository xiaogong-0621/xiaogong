const api = require('../../utils/api')
const h = require('../../utils/helpers')

Page({
  data: {
    activeTabIndex: 0,
    tabs: ['日榜', '周榜'],
    chartList: [],
    loading: false,
    showRoomDialog: false,
    roomCodeInput: '',
    pendingOrderSongId: 0,
    joiningRoom: false,
    duangVisible: false,
    listSpring: false,
    statusBarHeight: getApp().globalData.statusBarHeight,
    navHeight: 0,
    menuButtonTop: 0
  },

  onLoad() {
    this.initSafeArea()
    this.fetchDailyChart()
  },

  initSafeArea() {
    const systemInfo = wx.getSystemInfoSync()
    const menuButton = wx.getMenuButtonBoundingClientRect()

    // 计算导航栏高度：胶囊按钮底部距顶部的距离 + 间距
    const navHeight = menuButton.bottom + menuButton.top - systemInfo.statusBarHeight

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      navHeight: navHeight,
      menuButtonTop: menuButton.top
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 1 })
    }
    this.syncOrderedState()
  },

  syncOrderedState() {
    if (this.data.chartList.length === 0) return
    const orderedIds = wx.getStorageSync('orderedSongIds') || []
    const favoriteIds = wx.getStorageSync('favoriteSongIds') || []
    const chartList = this.data.chartList.map(item => ({
      ...item,
      ordered: orderedIds.includes(item.id),
      liked: favoriteIds.includes(item.id)
    }))
    this.setData({ chartList })
  },

  fetchDailyChart() {
    this.setData({ loading: true })
    const favoriteIds = wx.getStorageSync('favoriteSongIds') || []
    const orderedIds = wx.getStorageSync('orderedSongIds') || []
    api.request({ url: '/charts/daily' }).then(res => {
      const chartList = (res || []).map((item, index) => ({
        id: item.id,
        rank: index + 1,
        name: item.title || '未知歌曲',
        artist: item.artist || '未知歌手',
        album: item.genre || '',
        cover: api.toMediaUrl(item.coverUrl || ''),
        coverOk: !!item.coverUrl,
        coverColor: h.getColorById(item.id),
        duration: item.duration || 240,
        playCount: this.formatPlayCount(item.playCount || 0),
        liked: favoriteIds.includes(item.id),
        ordered: orderedIds.includes(item.id)
      }))
      this.setData({ chartList, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  fetchWeeklyChart() {
    this.setData({ loading: true })
    const favoriteIds = wx.getStorageSync('favoriteSongIds') || []
    const orderedIds = wx.getStorageSync('orderedSongIds') || []
    api.request({ url: '/charts/weekly' }).then(res => {
      const chartList = (res || []).map((item, index) => ({
        id: item.id,
        rank: index + 1,
        name: item.title || '未知歌曲',
        artist: item.artist || '未知歌手',
        album: item.genre || '',
        cover: api.toMediaUrl(item.coverUrl || ''),
        coverOk: !!item.coverUrl,
        coverColor: h.getColorById(item.id),
        duration: item.duration || 240,
        playCount: this.formatPlayCount(item.playCount || 0),
        liked: favoriteIds.includes(item.id),
        ordered: orderedIds.includes(item.id)
      }))
      this.setData({ chartList, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  formatPlayCount(count) {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + '万'
    } else if (count >= 1000) {
      return (count / 1000).toFixed(0) + 'K'
    }
    return count.toString()
  },

  toggleTab(e) {
    const index = e.currentTarget.dataset.index
    if (index === this.data.activeTabIndex) return
    this.setData({ activeTabIndex: index })
    if (index === 0) {
      this.fetchDailyChart()
    } else {
      this.fetchWeeklyChart()
    }
  },

  onCoverError(e) {
    const id = e.currentTarget.dataset.id
    const chartList = this.data.chartList.map(item => {
      if (item.id === id) {
        return { ...item, coverOk: false }
      }
      return item
    })
    this.setData({ chartList })
  },

  orderSong(e) {
    const id = e.currentTarget.dataset.id
    const song = this.data.chartList.find(item => item.id === id)
    if (!song) return
    
    const isOrdered = song.ordered || false
    
    if (isOrdered) {
      this._showDuang()
    } else {
      api.getCurrentRoomId().then(roomId => {
        if (!roomId) {
          this.setData({ showRoomDialog: true, roomCodeInput: '', pendingOrderSongId: id })
          return
        }
        api.request({
          url: '/room/queue',
          method: 'POST',
          data: { songId: song.id, roomId: roomId }
        }).then(() => {
          const chartList = this.data.chartList.map(item => {
            if (item.id === id) return { ...item, ordered: true }
            return item
          })
          this.setData({ chartList })
          wx.showToast({ title: '已点歌: ' + song.name, icon: 'success' })
          this.updateOrderedStorage(song.id, true)
          this.notifyQueueUpdate()
        }).catch((err) => {
          wx.showToast({ title: err.message || '点歌失败', icon: 'none' })
        })
      })
    }
  },

  toggleLike(e) {
    const id = e.currentTarget.dataset.id
    const song = this.data.chartList.find(item => item.id === id)
    if (!song || song._animating) return

    if (song.liked) {
      this._setItemState('chartList', id, { _unfilling: true, _animating: true })
      api.request({ url: '/favorites/' + id, method: 'DELETE' }).then(() => {
        wx.showToast({ title: '已取消收藏', icon: 'success' })
        setTimeout(() => {
          this._setItemState('chartList', id, { liked: false, _unfilling: false, _animating: false })
          h.updateFavoriteStorage(id, false)
        }, 400)
      }).catch(() => {
        this._setItemState('chartList', id, { _unfilling: false, _animating: false })
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    } else {
      this._setItemState('chartList', id, { _filling: true, _animating: true })
      api.request({ url: '/favorites/' + id, method: 'POST' }).then(() => {
        wx.showToast({ title: '已添加收藏', icon: 'success' })
        setTimeout(() => {
          this._setItemState('chartList', id, { liked: true, _filling: false, _animating: false })
          h.updateFavoriteStorage(id, true)
        }, 1000)
      }).catch(() => {
        this._setItemState('chartList', id, { _filling: false, _animating: false })
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    }
  },

  _setItemState(listKey, id, updates) {
    const list = this.data[listKey]
    const idx = list.findIndex(item => item.id === id)
    if (idx < 0) return
    const obj = {}
    Object.keys(updates).forEach(k => {
      obj[listKey + '[' + idx + '].' + k] = updates[k]
    })
    this.setData(obj)
  },

  updateFavoriteStorage(songId, add) {
    h.updateFavoriteStorage(songId, add)
  },

  notifyQueueUpdate() {
    h.notifyQueueUpdate()
  },

  updateOrderedStorage(songId, add) {
    h.updateOrderedStorage(songId, add)
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    const song = this.data.chartList.find(item => item.id === id)
    if (!song) {
      wx.showToast({ title: '数据错误', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/detail/detail?songData=' + encodeURIComponent(JSON.stringify(song))
    })
  },

  goToList() {
    wx.switchTab({ url: '/pages/list/list' })
  },

  openMenu() {
    wx.navigateTo({ url: '/pages/rooms/rooms' })
  },

  openSearch() {
    wx.showToast({ title: '打开搜索', icon: 'none' })
  },

  // 房间弹窗相关
  closeRoomDialog() {
    this.setData({ showRoomDialog: false, pendingOrderSongId: 0 })
  },

  onRoomDialogInput(e) {
    this.setData({ roomCodeInput: e.detail.value })
  },

  joinRoomFromDialog() {
    const code = this.data.roomCodeInput.trim().toUpperCase()
    if (!code) {
      wx.showToast({ title: '请输入房间码', icon: 'none' })
      return
    }
    this.setData({ joiningRoom: true })
    api.clearRoomCache()
    api.request({
      url: '/rooms/join',
      method: 'POST',
      data: { roomCode: code }
    }).then(() => {
      this.setData({ joiningRoom: false, showRoomDialog: false })
      wx.showToast({ title: '已加入房间', icon: 'success' })
      this.doPendingOrder()
    }).catch(err => {
      this.setData({ joiningRoom: false })
      wx.showToast({ title: err.message || '加入失败', icon: 'none' })
    })
  },

  requestRoomFromDialog() {
    api.request({
      url: '/roomrequests',
      method: 'POST'
    }).then(() => {
      this.setData({ showRoomDialog: false, pendingOrderSongId: 0 })
      wx.showModal({
        title: '申请已提交',
        content: '等待管理员审批，请稍后',
        showCancel: false
      })
    }).catch(err => {
      wx.showToast({ title: err.message || '申请失败', icon: 'none' })
    })
  },

  doPendingOrder() {
    const id = this.data.pendingOrderSongId
    if (!id) return
    api.getCurrentRoomId().then(roomId => {
      if (!roomId) return
      api.request({
        url: '/room/queue',
        method: 'POST',
        data: { songId: id, roomId: roomId }
      }).then(() => {
        const chartList = this.data.chartList.map(item => {
          if (item.id === id) return { ...item, ordered: true }
          return item
        })
        this.setData({ chartList, pendingOrderSongId: 0 })
        wx.showToast({ title: '已点歌', icon: 'success' })
        this.updateOrderedStorage(id, true)
        this.notifyQueueUpdate()
      }).catch((err) => {
        wx.showToast({ title: err.message || '点歌失败', icon: 'none' })
      })
    })
  },

  stopPropagation() {},

  _showDuang() {
    if (this._duangTimer) return
    this.setData({ duangVisible: true, listSpring: true })
    this._duangTimer = setTimeout(() => {
      this.setData({ duangVisible: false, listSpring: false })
      this._duangTimer = null
    }, 1100)
  }
})