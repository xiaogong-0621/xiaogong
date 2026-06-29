const api = require('../../utils/api')
const ws = require('../../utils/ws')
const h = require('../../utils/helpers')

const DEFAULT_LYRICS = [
  { time: 0, text: '前奏' },
  { time: 10, text: '这是一首美妙的歌曲' },
  { time: 15, text: '让我们一起聆听' },
  { time: 20, text: '感受音乐的魅力' },
  { time: 25, text: '享受这段时光' },
  { time: 30, text: '歌声在耳边响起' },
  { time: 35, text: '心情也变得愉悦' },
  { time: 40, text: '跟着节奏摇摆' },
  { time: 45, text: '释放所有烦恼' },
  { time: 50, text: '这就是音乐的力量' },
  { time: 55, text: '让我们沉浸其中' },
  { time: 60, text: '享受每一个音符' },
  { time: 65, text: '感受旋律的美好' },
  { time: 70, text: '直到歌曲结束' },
  { time: 75, text: '留下美好的回忆' }
]

Page({
  data: {
    song: {
      id: 0,
      name: '未知歌曲',
      artist: '未知歌手',
      album: '',
      cover: '',
      coverOk: false,
      coverColor: h.COLORS[0],
      duration: 240
    },
    lyrics: [],
    isPlaying: false,
    currentTime: 0,
    duration: 240,
    currentLyricIndex: 0,
    isLiked: false,
    lyricsScrollTop: 0,
    ordered: false,
    showRoomDialog: false,
    roomCodeInput: '',
    joiningRoom: false,
    statusBarHeight: getApp().globalData.statusBarHeight
  },

  onLoad(options) {
    this.audioContext = getApp().audioContext
    this._serverQueueId = -1
    this._isActive = true
    this.bindAudioEvents()

    if (options && options.songData) {
      try {
        const songData = JSON.parse(decodeURIComponent(options.songData))
        if (!songData.id || songData.id <= 0) {
          this.loadDefaultSong()
          return
        }
        songData.coverOk = !!songData.cover
        songData.coverColor = songData.coverColor || h.getColorById(songData.id)
        const orderedIds = wx.getStorageSync('orderedSongIds') || []
        this.setData({
          song: songData,
          duration: songData.duration || 240,
          ordered: orderedIds.includes(songData.id)
        })
        this.fetchSongDetail(songData.id)
        this.checkLikeStatus(songData.id)
      } catch (e) {
        this.loadDefaultSong()
      }
    } else {
      this.loadDefaultSong()
    }

    // WebSocket listener for real-time sync
    this._onPlaybackChanged = (data) => {
      this._syncPlaybackFromData(data.nowPlaying, data.isPaused)
    }
    ws.on('PlaybackChanged', this._onPlaybackChanged)

    // Fallback polling - adapt interval based on WS state
    this._createPollTimer()
  },

  onUnload() {
    this._isActive = false
    this.unbindAudioEvents()
    if (this._pollTimer) {
      clearInterval(this._pollTimer)
      this._pollTimer = null
    }
    ws.off('PlaybackChanged', this._onPlaybackChanged)
  },

  _createPollTimer() {
    if (this._pollTimer) clearInterval(this._pollTimer)
    this._wsConnected = ws.isConnected()
    this._pollTimer = setInterval(() => {
      this._syncFromServer()
      const nowConnected = ws.isConnected()
      if (nowConnected !== this._wsConnected) {
        this._createPollTimer()
      }
    }, this._wsConnected ? 10000 : 2000)
  },

  _syncPlaybackFromData(nowPlaying, isPaused) {
    const ac = this.audioContext
    if (!nowPlaying) return
    if (this._serverQueueId === nowPlaying.queueId) {
      if (isPaused && this.data.isPlaying) ac.pause()
      else if (!isPaused && !this.data.isPlaying) ac.play()
      return
    }
    this._serverQueueId = nowPlaying.queueId
    const mediaUrl = api.toMediaUrl(nowPlaying.mediaUrl || '')
    if (mediaUrl) {
      ac.src = mediaUrl
      if (!isPaused) ac.play()
    }
  },

  _syncFromServer() {
    api.request({ url: '/room/current' }).then(res => {
      this._syncPlaybackFromData(res.nowPlaying, res.isPaused)
    }).catch(() => {})
  },

  bindAudioEvents() {
    const ac = this.audioContext
    const self = this
    this._onTimeUpdate = () => {
      if (!self._isActive) return
      const currentTime = Math.floor(ac.currentTime)
      const duration = Math.floor(ac.duration) || self.data.duration
      self.setData({ currentTime, duration })
      self.updateLyricIndex(currentTime)
    }
    this._onPlay = () => { if (self._isActive) self.setData({ isPlaying: true }) }
    this._onPause = () => { if (self._isActive) self.setData({ isPlaying: false }) }
    this._onEnded = () => {
      if (!self._isActive) return
      self.setData({ isPlaying: false, currentTime: 0 })
      api.request({ url: '/room/playback/next', method: 'POST' }).catch(() => {})
    }
    this._onError = () => {
      if (!self._isActive) return
      self.setData({ isPlaying: false })
      wx.showToast({ title: '音频加载失败', icon: 'none' })
      api.request({ url: '/room/playback/next', method: 'POST' }).catch(() => {})
    }
    ac.onTimeUpdate(this._onTimeUpdate)
    ac.onPlay(this._onPlay)
    ac.onPause(this._onPause)
    ac.onEnded(this._onEnded)
    ac.onError(this._onError)
  },

  unbindAudioEvents() {
    const ac = this.audioContext
    if (ac) {
      ac.offTimeUpdate(this._onTimeUpdate)
      ac.offPlay(this._onPlay)
      ac.offPause(this._onPause)
      ac.offEnded(this._onEnded)
      ac.offError(this._onError)
    }
  },

  fetchSongDetail(songId) {
    api.request({ url: '/songs/' + songId + '/detail' }).then(res => {
      if (res && res.mediaUrl) {
        this.audioContext.src = api.toMediaUrl(res.mediaUrl)
      }
      if (res && res.lrcUrl) {
        this.fetchAndParseLrc(res.lrcUrl)
      } else {
        this.setData({ lyrics: DEFAULT_LYRICS })
      }
    }).catch(err => {
      if (err.message && err.message.indexOf('404') !== -1) {
        wx.showToast({ title: '歌曲不存在', icon: 'none' })
      }
      this.setData({ lyrics: DEFAULT_LYRICS })
    })
  },

  fetchAndParseLrc(lrcUrl) {
    const url = api.toMediaUrl(lrcUrl)
    wx.request({
      url: url,
      responseType: 'text',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const lyrics = this.parseLrc(res.data)
          if (lyrics.length > 0) {
            this.setData({ lyrics })
            return
          }
        }
        this.setData({ lyrics: DEFAULT_LYRICS })
      },
      fail: () => {
        this.setData({ lyrics: DEFAULT_LYRICS })
      }
    })
  },

  parseLrc(lrc) {
    const lines = []
    const re = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/
    const rawLines = lrc.split('\n')
    for (let i = 0; i < rawLines.length; i++) {
      const m = rawLines[i].trim().match(re)
      if (!m) continue
      const min = parseInt(m[1])
      const sec = parseInt(m[2])
      const ms = m[3].length === 3 ? parseInt(m[3]) : parseInt(m[3]) * 10
      lines.push({ time: min * 60 + sec + ms / 1000, text: m[4] })
    }
    lines.sort(function(a, b) { return a.time - b.time })
    return lines
  },

  loadDefaultSong() {
    this.setData({
      song: {
        id: 1,
        name: '光年之外',
        artist: 'G.E.M.邓紫棋',
        album: '光年之外',
        cover: '',
        coverOk: false,
        coverColor: h.COLORS[1],
        duration: 240
      },
      lyrics: DEFAULT_LYRICS
    })
  },

  checkLikeStatus(songId) {
    api.request({ url: '/favorites' }).then(res => {
      const isLiked = (res || []).some(item => (item.songId || item.id) === songId)
      this.setData({ isLiked })
    }).catch(() => {})
  },

  toggleLike() {
    const { song, isLiked } = this.data
    if (isLiked) {
      api.request({ url: '/favorites/' + song.id, method: 'DELETE' }).then(() => {
        this.setData({ isLiked: false })
        h.updateFavoriteStorage(song.id, false)
        wx.showToast({ title: '已取消收藏', icon: 'success' })
      }).catch(() => {
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    } else {
      api.request({ url: '/favorites/' + song.id, method: 'POST' }).then(() => {
        this.setData({ isLiked: true })
        h.updateFavoriteStorage(song.id, true)
        wx.showToast({ title: '已添加收藏', icon: 'success' })
      }).catch(() => {
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    }
  },

  orderSong() {
    const { song, ordered } = this.data
    if (ordered) {
      api.request({ url: '/room/queue' }).then(queue => {
        const queueItem = (queue || []).find(item => item.songId === song.id)
        if (queueItem && queueItem.id) {
          api.request({ url: '/room/queue/' + queueItem.id, method: 'DELETE' }).then(() => {
            this.setData({ ordered: false })
            h.updateOrderedStorage(song.id, false)
            h.notifyQueueUpdate()
            wx.showToast({ title: '已取消点歌', icon: 'success' })
          }).catch(() => {
            wx.showToast({ title: '取消失败', icon: 'none' })
          })
        } else {
          this.setData({ ordered: false })
          wx.showToast({ title: '已取消点歌', icon: 'success' })
        }
      }).catch(() => {
        wx.showToast({ title: '获取队列失败', icon: 'none' })
      })
    } else {
      api.getCurrentRoomId().then(roomId => {
        if (!roomId) {
          this.setData({ showRoomDialog: true, roomCodeInput: '' })
          return
        }
        api.request({
          url: '/room/queue',
          method: 'POST',
          data: { songId: song.id, roomId: roomId }
        }).then(() => {
          this.setData({ ordered: true })
          h.updateOrderedStorage(song.id, true)
          h.notifyQueueUpdate()
          wx.showToast({ title: '已点歌: ' + song.name, icon: 'success' })
        }).catch((err) => {
          wx.showToast({ title: err.message || '点歌失败', icon: 'none' })
        })
      })
    }
  },

  // 房间弹窗相关
  closeRoomDialog() {
    this.setData({ showRoomDialog: false })
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
      // Order after joining
      const { song } = this.data
      api.getCurrentRoomId().then(roomId => {
        if (!roomId) return
        api.request({
          url: '/room/queue',
          method: 'POST',
          data: { songId: song.id, roomId: roomId }
        }).then(() => {
          this.setData({ ordered: true })
          h.updateOrderedStorage(song.id, true)
          h.notifyQueueUpdate()
          wx.showToast({ title: '已点歌: ' + song.name, icon: 'success' })
        }).catch((err) => {
          wx.showToast({ title: err.message || '点歌失败', icon: 'none' })
        })
      })
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
      this.setData({ showRoomDialog: false })
      wx.showModal({
        title: '申请已提交',
        content: '等待管理员审批，请稍后',
        showCancel: false
      })
    }).catch(err => {
      wx.showToast({ title: err.message || '申请失败', icon: 'none' })
    })
  },

  stopPropagation() {},

  updateLyricIndex(currentTime) {
    const { lyrics } = this.data
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        if (this.data.currentLyricIndex !== i) {
          this.setData({ currentLyricIndex: i })
          this.scrollToLyric(i)
        }
        break
      }
    }
  },

  scrollToLyric(index) {
    // Use cumulative offset approach: each lyric item ~60rpx + gap
    const scrollTop = Math.max(0, index * 70 - 140)
    this.setData({ lyricsScrollTop: scrollTop })
  },

  togglePlay() {
    const willPause = this.data.isPlaying
    const url = willPause ? '/room/playback/pause' : '/room/playback/resume'
    api.request({ url, method: 'POST' }).catch(() => {})
  },

  prevSong() {
    // Seek to beginning of current song
    if (this.audioContext && this.audioContext.currentTime > 3) {
      this.audioContext.seek(0)
      this.setData({ currentTime: 0 })
    } else {
      wx.showToast({ title: '已在歌曲开头', icon: 'none' })
    }
  },

  nextSong() {
    api.request({
      url: '/room/playback/next',
      method: 'POST'
    }).catch(() => {
      wx.showToast({ title: '切歌失败', icon: 'none' })
    })
  },

  onCoverError() {
    this.setData({ 'song.coverOk': false })
  },

  seekTo(e) {
    const touchX = e.touches ? e.touches[0].clientX : e.detail.x
    wx.createSelectorQuery().select('.progress-track').boundingClientRect((rect) => {
      if (rect) {
        const percent = (touchX - rect.left) / rect.width
        const duration = Math.floor(this.audioContext.duration) || this.data.duration
        const newTime = Math.max(0, Math.min(duration, Math.floor(percent * duration)))
        this.audioContext.seek(newTime)
      }
    }).exec()
  },

  goBack() {
    wx.navigateBack()
  }
})
