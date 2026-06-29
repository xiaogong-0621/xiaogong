const api = require('../../utils/api')
const h = require('../../utils/helpers')

function formatCount(count) {
  if (!count && count !== 0) return '0 次播放'
  if (count >= 10000) return (count / 10000).toFixed(1) + '万 次播放'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K 次播放'
  return count + ' 次播放'
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m + ':' + (s < 10 ? '0' + s : s)
}

Page({
  data: {
    searchText: '',
    searchFocused: false,
    activeTagIndex: 0,
    tags: ['全部', '流行', '摇滚', '民谣', '电子', 'R&B', '嘻哈', '古典'],
    songList: [],
    loading: false,
    showFeedback: false,
    feedbackType: 'request_song',
    feedbackSongName: '',
    feedbackArtist: '',
    feedbackDesc: '',
    feedbackSuccess: false,
    showRoomDialog: false,
    roomCodeInput: '',
    pendingOrderSongId: 0,
    joiningRoom: false,
    duangVisible: false,
    listSpring: false,
    statusBarHeight: getApp().globalData.statusBarHeight,
    API_BASE: api.MEDIA_BASE,
    unreadCount: 0
  },

  onLoad() {
    this.fetchSongs()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 0 })
    }
    this.syncOrderedState()
    this.fetchUnreadCount()
    this.syncFavoriteState()
  },

  syncOrderedState() {
    if (this.data.songList.length === 0) return
    const orderedIds = wx.getStorageSync('orderedSongIds') || []
    const songList = this.data.songList.map(item => ({
      ...item,
      ordered: orderedIds.includes(item.id)
    }))
    this.setData({ songList })
  },

  fetchUnreadCount() {
    api.getUnreadCount().then(res => {
      this.setData({ unreadCount: res.count || 0 })
    }).catch(() => {
      // 静默处理
    })
  },

  syncFavoriteState() {
    if (this.data.songList.length === 0) return
    const favoriteIds = wx.getStorageSync('favoriteSongIds') || []
    const songList = this.data.songList.map(item => ({
      ...item,
      liked: favoriteIds.includes(item.id)
    }))
    this.setData({ songList })
  },

  fetchSongs(genre) {
    this.setData({ loading: true })
    const params = { pageSize: 50 }
    if (genre) params.genre = genre
    api.request({
      url: '/songs',
      data: params
    }).then(res => {
      const favoriteIds = wx.getStorageSync('favoriteSongIds') || []
      const orderedIds = wx.getStorageSync('orderedSongIds') || []
      const songs = (res.items || []).map(item => ({
        id: item.id,
        name: item.title || '未知歌曲',
        artist: item.artist || '未知歌手',
        album: item.genre || '',
        cover: api.toMediaUrl(item.coverUrl || ''),
        coverOk: !!item.coverUrl,
        coverColor: h.getColorById(item.id),
        liked: favoriteIds.includes(item.id),
        ordered: orderedIds.includes(item.id),
        playCount: item.playCount || 0,
        playCountText: formatCount(item.playCount),
        duration: item.duration || 0,
        durationText: formatDuration(item.duration)
      }))
      this.setData({ songList: songs, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value })
  },

  onSearchFocus() {
    this.setData({ searchFocused: true })
  },

  onSearchBlur() {
    this.setData({ searchFocused: false })
  },

  onSearch() {
    const { searchText } = this.data
    if (!searchText.trim()) {
      this.fetchSongs()
      return
    }
    this.setData({ loading: true })
    api.request({
      url: '/songs',
      data: { search: searchText.trim(), pageSize: 50 }
    }).then(res => {
      const favoriteIds = wx.getStorageSync('favoriteSongIds') || []
      const orderedIds = wx.getStorageSync('orderedSongIds') || []
      const songs = (res.items || []).map(item => ({
        id: item.id,
        name: item.title || '未知歌曲',
        artist: item.artist || '未知歌手',
        album: item.genre || '',
        cover: api.toMediaUrl(item.coverUrl || ''),
        coverOk: !!item.coverUrl,
        coverColor: h.getColorById(item.id),
        liked: favoriteIds.includes(item.id),
        ordered: orderedIds.includes(item.id),
        playCount: item.playCount || 0,
        playCountText: formatCount(item.playCount),
        duration: item.duration || 0,
        durationText: formatDuration(item.duration)
      }))
      this.setData({ songList: songs, loading: false })
      if (songs.length === 0) {
        wx.showToast({ title: '未找到相关歌曲', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '搜索失败', icon: 'none' })
    })
  },

  toggleTag(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeTagIndex: index })
    const genres = ['', '流行', '摇滚', '民谣', '电子', 'R&B', '嘻哈', '古典']
    this.fetchSongs(genres[index])
  },

  clearSearch() {
    this.setData({ searchText: '' })
    this.fetchSongs()
  },

  toggleLike(e) {
    const id = e.currentTarget.dataset.id
    const song = this.data.songList.find(item => item.id === id)
    if (!song || song._animating) return

    if (song.liked) {
      this._setItemState('songList', id, { _unfilling: true, _animating: true })
      api.request({ url: '/favorites/' + id, method: 'DELETE' }).then(() => {
        wx.showToast({ title: '已取消收藏', icon: 'success' })
        setTimeout(() => {
          this._setItemState('songList', id, { liked: false, _unfilling: false, _animating: false })
          h.updateFavoriteStorage(id, false)
        }, 400)
      }).catch(() => {
        this._setItemState('songList', id, { _unfilling: false, _animating: false })
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    } else {
      this._setItemState('songList', id, { _filling: true, _animating: true })
      api.request({ url: '/favorites/' + id, method: 'POST' }).then(() => {
        wx.showToast({ title: '已添加收藏', icon: 'success' })
        setTimeout(() => {
          this._setItemState('songList', id, { liked: true, _filling: false, _animating: false })
          h.updateFavoriteStorage(id, true)
        }, 1000)
      }).catch(() => {
        this._setItemState('songList', id, { _filling: false, _animating: false })
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

  orderSong(e) {
    const id = e.currentTarget.dataset.id
    const song = this.data.songList.find(item => item.id === id)
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
          const songList = this.data.songList.map(item => {
            if (item.id === id) return { ...item, ordered: true }
            return item
          })
          this.setData({ songList })
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

  onCoverError(e) {
    const id = e.currentTarget.dataset.id
    const songList = this.data.songList.map(item => {
      if (item.id === id) {
        return { ...item, coverOk: false }
      }
      return item
    })
    this.setData({ songList })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    const song = this.data.songList.find(item => item.id === id)
    if (!song) {
      wx.showToast({ title: '数据错误', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/detail/detail?songData=' + encodeURIComponent(JSON.stringify(song))
    })
  },

  openMenu() {
    wx.navigateTo({ url: '/pages/rooms/rooms' })
  },

  openSearch() {
    wx.showToast({ title: '打开搜索', icon: 'none' })
  },

  openNotify() {
    wx.navigateTo({ url: '/pages/notifications/notifications' })
  },

  // 反馈相关
  openFeedback() {
    this.setData({
      showFeedback: true,
      feedbackSuccess: false,
      feedbackType: 'request_song',
      feedbackSongName: '',
      feedbackArtist: '',
      feedbackDesc: ''
    })
  },

  closeFeedback() {
    this.setData({ showFeedback: false })
  },

  onFeedbackTypeChange(e) {
    const types = ['request_song', 'report_error', 'other']
    this.setData({ feedbackType: types[e.detail.value] || 'request_song' })
  },

  onFeedbackInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  submitFeedback() {
    const { feedbackType, feedbackSongName, feedbackArtist, feedbackDesc } = this.data
    if (feedbackType === 'request_song' && !feedbackSongName.trim()) {
      wx.showToast({ title: '请输入歌曲名称', icon: 'none' })
      return
    }
    api.request({
      url: '/feedbacks',
      method: 'POST',
      data: {
        feedbackType: feedbackType,
        songName: feedbackSongName.trim(),
        artist: feedbackArtist.trim(),
        description: feedbackDesc.trim()
      }
    }).then(() => {
      this.setData({ feedbackSuccess: true })
      setTimeout(() => { this.setData({ showFeedback: false }) }, 1500)
    }).catch(() => {
      wx.showToast({ title: '提交失败', icon: 'none' })
    })
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
        const songList = this.data.songList.map(item => {
          if (item.id === id) return { ...item, ordered: true }
          return item
        })
        this.setData({ songList, pendingOrderSongId: 0 })
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