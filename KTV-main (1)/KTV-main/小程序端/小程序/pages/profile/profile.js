const api = require('../../utils/api')
const h = require('../../utils/helpers')

Page({
  data: {
    favoriteList: [],
    loading: false,
    _removingId: 0,
    showRoomDialog: false,
    roomCodeInput: '',
    pendingOrderSongId: 0,
    joiningRoom: false,
    duangVisible: false,
    listSpring: false,
    statusBarHeight: getApp().globalData.statusBarHeight
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 3 })
    }
    this.loadFavorites()
  },

  loadFavorites() {
    this.setData({ loading: true })
    api.request({ url: '/favorites' }).then(res => {
      const orderedIds = wx.getStorageSync('orderedSongIds') || []
      const favorites = (res || []).map(item => {
        const song = item.song || item
        const c = api.toMediaUrl(song.coverUrl || item.songCoverUrl || '')
        const sid = item.songId || song.id || item.id
        return {
          id: sid,
          name: song.title || item.songTitle || '未知歌曲',
          artist: song.artist || item.songArtist || '未知歌手',
          cover: c,
          coverOk: !!c,
          coverColor: h.getColorById(sid),
          ordered: orderedIds.includes(sid)
        }
      })
      this.setData({ favoriteList: favorites, loading: false })
      wx.setStorageSync('favoriteSongIds', favorites.map(f => f.id))
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    if (this.data._removingId) return
    const song = this.data.favoriteList.find(item => item.id === id)
    this.setData({ _removingId: id })

    api.request({ url: '/favorites/' + id, method: 'DELETE' }).then(() => {
      this.updateFavoriteStorage(id, false)
      wx.showToast({ title: '已取消收藏: ' + (song?.name || ''), icon: 'success' })
      setTimeout(() => {
        this.setData({
          favoriteList: this.data.favoriteList.filter(item => item.id !== id),
          _removingId: 0
        })
      }, 500)
    }).catch(() => {
      this.setData({ _removingId: 0 })
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  orderSong(e) {
    const id = e.currentTarget.dataset.id
    const song = this.data.favoriteList.find(item => item.id === id)
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
          const favoriteList = this.data.favoriteList.map(item => {
            if (item.id === id) return { ...item, ordered: true }
            return item
          })
          this.setData({ favoriteList })
          wx.showToast({ title: '已点歌: ' + song.name, icon: 'success' })
          this.updateOrderedStorage(song.id, true)
          this.notifyQueueUpdate()
        }).catch((err) => {
          wx.showToast({ title: err.message || '点歌失败', icon: 'none' })
        })
      })
    }
  },

  notifyQueueUpdate() {
    h.notifyQueueUpdate()
  },

  updateOrderedStorage(songId, add) {
    h.updateOrderedStorage(songId, add)
  },

  updateFavoriteStorage(songId, add) {
    h.updateFavoriteStorage(songId, add)
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    const song = this.data.favoriteList.find(item => item.id === id)
    if (!song) {
      wx.showToast({ title: '数据错误', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/detail/detail?songData=' + encodeURIComponent(JSON.stringify(song))
    })
  },

  onCoverError(e) {
    const id = e.currentTarget.dataset.id
    const idx = this.data.favoriteList.findIndex(item => item.id === id)
    if (idx >= 0) {
      this.setData({ ['favoriteList[' + idx + '].coverOk']: false })
    }
  },

  goBack() {
    wx.switchTab({ url: '/pages/home/home' })
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
        const favoriteList = this.data.favoriteList.map(item => {
          if (item.id === id) return { ...item, ordered: true }
          return item
        })
        this.setData({ favoriteList, pendingOrderSongId: 0 })
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