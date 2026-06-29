const api = require('../../utils/api')
const ws = require('../../utils/ws')
const h = require('../../utils/helpers')

const recorderManager = wx.getRecorderManager()

Page({
  data: {
    loading: false,
    isPlaying: false,
    currentTime: 0,
    totalTime: 0,
    playingSong: {
      id: 0,
      name: '等待点歌...',
      artist: '',
      cover: '',
      coverOk: false,
      coverColor: h.COLORS[0],
      orderedBy: ''
    },
    orderList: [],
    roomNumber: '...',
    onlineUsers: 0,
    songsQueued: 0,
    currentRoomId: 0,
    roomCodeInput: '',
    joiningRoom: false,
    joinError: '',
    draggingIndex: -1,
    draggedId: -1,
    startY: 0,
    initialIndex: -1,
    itemHeight: 104,
    chatMessages: [],
    chatInput: '',
    chatScrollTop: 9999,
    showChat: true,
    toastVisible: false,
    toastMsg: '',
    _serverQueueId: -1,
    queueScrollIntoId: '',
    _favoriteSongIds: [],
    statusBarHeight: getApp().globalData.statusBarHeight,
    // 语音消息
    isRecording: false,
    recordingTime: 0,
    voiceMessages: [],
    playingVoiceId: -1,
    _recordingTimer: null,
    _recordingStartTime: 0
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 2 })
    }
    this._setupWebSocket()
    this.loadRoomInfo()
    const needsRefresh = wx.getStorageSync('queueNeedsRefresh')
    if (needsRefresh) {
      wx.removeStorageSync('queueNeedsRefresh')
      this.loadQueue()
    }
    this.startPolling()
    this.loadVoiceMessages()
  },

  onHide() {
    this.stopPolling()
    ws.disconnect()
  },

  onLoad() {
    this.audioContext = getApp().audioContext
    this._isActive = true
    this.bindAudioEvents()
  },

  onUnload() {
    this._isActive = false
    this.unbindAudioEvents()
    this.stopPolling()
    ws.disconnect()
  },

  bindAudioEvents() {
    const ac = this.audioContext
    const self = this
    this._onTimeUpdate = () => {
      if (!self._isActive) return
      const currentTime = Math.floor(ac.currentTime)
      const totalTime = Math.floor(ac.duration) || 0
      self.setData({ currentTime, totalTime })
    }
    this._onPlay = () => { if (self._isActive) self.setData({ isPlaying: true }) }
    this._onPause = () => { if (self._isActive) self.setData({ isPlaying: false }) }
    this._onEnded = () => {
      if (!self._isActive) return
      api.request({ url: '/room/playback/next', method: 'POST' }).catch(() => {})
    }
    this._onError = () => {
      if (!self._isActive) return
      self.setData({ isPlaying: false })
      self._showToast('音频加载失败，跳到下一首')
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

  _showToast(msg) {
    if (this._toastTimer) clearTimeout(this._toastTimer)
    this.setData({ toastVisible: true, toastMsg: msg })
    this._toastTimer = setTimeout(() => {
      this.setData({ toastVisible: false })
    }, 2500)
  },

  loadRoomInfo() {
    return api.request({ url: '/room/current' }).then(res => {
      const roomId = res.roomId || 0
      this.setData({
        roomNumber: res.roomCode || 'N/A',
        onlineUsers: res.onlineUsers || 0,
        songsQueued: res.songsQueued || 0,
        currentRoomId: roomId,
        joinError: ''
      })
      if (roomId) {
        api.clearRoomCache()
        api.getCurrentRoomId()
        if (!ws.isConnected()) {
          ws.connect(roomId)
        }
        this.loadFavorites()
      }
      return api.request({ url: '/room/playback' })
    }).then(pb => {
      if (pb && pb.hasTrack) {
        this._syncPlayback({
          queueId: pb.currentQueueItemId,
          songId: pb.songId,
          songTitle: pb.title,
          artist: pb.artist,
          coverUrl: pb.coverUrl,
          mediaUrl: pb.mediaUrl,
          orderedByName: pb.orderedByName
        }, !pb.isPlaying)
      } else {
        this._syncPlayback(null, false)
      }
    }).catch(() => {})
  },

  _syncPlayback(nowPlaying, isPaused) {
    const ac = this.audioContext
    if (!nowPlaying) {
      if (this.data._serverQueueId !== -1) {
        this.setData({ _serverQueueId: -1 })
        ac.stop()
        this.setData({
          isPlaying: false, currentTime: 0, totalTime: 0,
          playingSong: { id: 0, name: '等待点歌...', artist: '', cover: '', coverOk: false, coverColor: h.COLORS[0], orderedBy: '' }
        })
      }
      return
    }

    if (this.data._serverQueueId === nowPlaying.queueId) {
      if (isPaused && this.data.isPlaying) {
        ac.pause()
      } else if (!isPaused && !this.data.isPlaying) {
        ac.play()
      }
      return
    }

    this.setData({ _serverQueueId: nowPlaying.queueId })
    const mediaUrl = api.toMediaUrl(nowPlaying.mediaUrl || '')
    const cover = api.toMediaUrl(nowPlaying.coverUrl || '')

    // 滚动到当前播放歌曲
    this.setData({ queueScrollIntoId: 'queue-item-' + nowPlaying.queueId })

    this.setData({
      playingSong: {
        id: nowPlaying.songId,
        name: nowPlaying.songTitle || nowPlaying.title || '未知歌曲',
        artist: nowPlaying.artist || '未知歌手',
        cover: cover,
        coverOk: !!nowPlaying.coverUrl,
        coverColor: h.getColorById(nowPlaying.songId),
        orderedBy: nowPlaying.orderedByName || nowPlaying.orderedBy || ''
      }
    })

    if (mediaUrl) {
      ac.src = mediaUrl
      if (!isPaused) {
        ac.play()
      }
    }
  },

  loadFavorites() {
    api.request({ url: '/favorites' }).then(res => {
      const ids = (res || []).map(f => f.songId)
      this.setData({ _favoriteSongIds: ids })
      this._syncFavStateToQueue()
    }).catch(() => {})
  },

  _syncFavStateToQueue() {
    const favIds = this.data._favoriteSongIds || []
    const list = this.data.orderList.map(item => ({
      ...item,
      liked: favIds.includes(item.songId)
    }))
    this.setData({ orderList: list })
  },

  toggleQueueFav(e) {
    const id = e.currentTarget.dataset.id
    const songId = e.currentTarget.dataset.songid
    const item = this.data.orderList.find(it => it.id === id)
    if (!item) return

    const wasLiked = item.liked
    if (wasLiked) {
      this._updateQueueItem(id, { liked: false })
      api.request({ url: '/favorites/' + songId, method: 'DELETE' }).then(() => {
        const ids = this.data._favoriteSongIds.filter(sid => sid !== songId)
        this.setData({ _favoriteSongIds: ids })
        wx.showToast({ title: '已取消收藏', icon: 'success' })
      }).catch(() => {
        this._updateQueueItem(id, { liked: true })
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    } else {
      this._updateQueueItem(id, { liked: true })
      api.request({ url: '/favorites/' + songId, method: 'POST' }).then(() => {
        const ids = [...this.data._favoriteSongIds, songId]
        this.setData({ _favoriteSongIds: ids })
        wx.showToast({ title: '已添加收藏', icon: 'success' })
      }).catch(() => {
        this._updateQueueItem(id, { liked: false })
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    }
  },

  _updateQueueItem(id, updates) {
    const idx = this.data.orderList.findIndex(it => it.id === id)
    if (idx < 0) return
    const obj = {}
    Object.keys(updates).forEach(k => {
      obj['orderList[' + idx + '].' + k] = updates[k]
    })
    this.setData(obj)
  },

  onRoomCodeInput(e) {
    this.setData({ roomCodeInput: e.detail.value })
  },

  joinRoom() {
    const code = this.data.roomCodeInput.trim().toUpperCase()
    if (!code) {
      this.setData({ joinError: '请输入房间码' })
      return
    }
    this.setData({ joiningRoom: true, joinError: '' })
    api.clearRoomCache()
    api.request({
      url: '/rooms/join',
      method: 'POST',
      data: { roomCode: code }
    }).then(() => {
      this.setData({ joiningRoom: false, roomCodeInput: '' })
      wx.showToast({ title: '已加入房间', icon: 'success' })
      this.loadRoomInfo()
      this.loadQueue()
    }).catch(err => {
      this.setData({ joiningRoom: false, joinError: err.message || '加入失败' })
    })
  },

  leaveRoom() {
    const roomId = this.data.currentRoomId
    if (!roomId) return
    wx.showModal({
      title: '退出房间',
      content: '退出后将清除你点播的歌曲，确定退出？',
      confirmText: '退出',
      confirmColor: '#e8854a',
      success: (res) => {
        if (!res.confirm) return
        api.request({
          url: '/rooms/' + roomId + '/leave',
          method: 'POST'
        }).then(() => {
          api.clearRoomCache()
          this.audioContext.stop()
          ws.disconnect()
          this.setData({
            currentRoomId: 0,
            roomNumber: '...',
            onlineUsers: 0,
            songsQueued: 0,
            orderList: [],
            chatMessages: [],
            isPlaying: false,
            currentTime: 0,
            totalTime: 0,
            joinError: '',
            _serverQueueId: -1,
            playingSong: { id: 0, name: '等待点歌...', artist: '', cover: '', coverOk: false, coverColor: h.COLORS[0], orderedBy: '' }
          })
          wx.setStorageSync('orderedSongIds', [])
          wx.showToast({ title: '已退出房间', icon: 'success' })
        }).catch(err => {
          wx.showToast({ title: err.message || '退出失败', icon: 'none' })
        })
      }
    })
  },

  loadQueue() {
    this.setData({ loading: true })
    api.request({ url: '/room/queue' }).then(res => {
      const queue = res || []
      if (queue.length > 0) {
        const favIds = this.data._favoriteSongIds || []
        const orderList = queue.map((item, index) => {
          const c = api.toMediaUrl(item.coverUrl || item.songCoverUrl || '')
          const sid = item.songId || item.id
          return {
            id: item.id,
            songId: sid,
            rank: index + 1,
            name: item.songTitle || item.title || '未知歌曲',
            artist: item.artist || item.songArtist || '未知歌手',
            cover: c,
            coverOk: !!(item.coverUrl || item.songCoverUrl),
            coverColor: h.getColorById(sid),
            user: item.orderedBy || item.requestedBy || item.userName || '',
            liked: favIds.includes(sid)
          }
        })
        this.setData({ orderList })
        wx.setStorageSync('orderedSongIds', orderList.map(i => i.songId))
      } else {
        this.setData({ orderList: [] })
        wx.setStorageSync('orderedSongIds', [])
      }
      this.setData({ loading: false })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  togglePlay() {
    const willPause = this.data.isPlaying
    const url = willPause ? '/room/playback/pause' : '/room/playback/resume'
    api.request({ url, method: 'POST' }).catch(() => {})
  },

  onProgressTap(e) {
    if (!this.data.totalTime) return
    const query = wx.createSelectorQuery()
    query.select('.progress-track').boundingClientRect(rect => {
      if (!rect) return
      const ratio = Math.max(0, Math.min(1, (e.detail.x - rect.left) / rect.width))
      const seekTo = Math.floor(ratio * this.data.totalTime)
      this.audioContext.seek(seekTo)
      this.setData({ currentTime: seekTo })
    }).exec()
  },

  prevSong() {
    wx.showToast({ title: '已是第一首', icon: 'none' })
  },

  nextSong() {
    api.request({
      url: '/room/playback/next',
      method: 'POST'
    }).catch(() => {
      wx.showToast({ title: '切歌失败', icon: 'none' })
    })
  },

  deleteItem(e) {
    const id = e.currentTarget.dataset.id
    const song = this.data.orderList.find(item => item.id === id)
    wx.showModal({
      title: '删除歌曲',
      content: '确定从队列中移除 "' + (song ? song.name : '') + '" 吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (!res.confirm) return
        api.request({
          url: '/room/queue/' + id,
          method: 'DELETE'
        }).then(() => {
          this.loadQueue()
          wx.showToast({ title: '已删除', icon: 'success' })
        }).catch(() => {
          wx.showToast({ title: '删除失败', icon: 'none' })
        })
      }
    })
  },

  goToDetail(e) {
    const type = e.currentTarget.dataset.type
    const songId = parseInt(e.currentTarget.dataset.songid)
    let song = null

    if (type === 'playing') {
      song = this.data.playingSong
    } else if (type === 'order') {
      song = this.data.orderList.find(item => item.songId === songId)
    }

    if (!song) {
      wx.showToast({ title: '歌曲数据不可用', icon: 'none' })
      return
    }

    // 队列项的 id 是队列ID，songId 才是真正的歌曲ID
    const realSongId = song.songId || song.id
    if (!realSongId || realSongId <= 0) {
      wx.showToast({ title: '歌曲数据不可用', icon: 'none' })
      return
    }

    const detailData = Object.assign({}, song, { id: realSongId })
    wx.navigateTo({
      url: '/pages/detail/detail?songData=' + encodeURIComponent(JSON.stringify(detailData))
    })
  },

  onPlayingCoverError() {
    this.setData({ 'playingSong.coverOk': false })
  },

  onCoverError(e) {
    const id = e.currentTarget.dataset.id
    const idx = this.data.orderList.findIndex(item => item.id === id)
    if (idx >= 0) {
      this.setData({ ['orderList[' + idx + '].coverOk']: false })
    }
  },

  openMenu() {
    wx.navigateTo({ url: '/pages/rooms/rooms' })
  },

  openSearch() {
    wx.showToast({ title: '打开搜索', icon: 'none' })
  },

  playQueueSong(e) {
    const queueId = e.currentTarget.dataset.queueid
    if (!queueId) return
    api.request({
      url: '/room/playback/play',
      method: 'POST',
      data: { queueItemId: queueId }
    }).catch(() => {
      wx.showToast({ title: '切歌失败', icon: 'none' })
    })
  },

  // 拖拽排序
  onTouchStart(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    if (index === 0) return
    const item = this.data.orderList[index]
    if (!item) return
    this.setData({
      draggingIndex: index,
      draggedId: item.id,
      startY: e.touches[0].clientY,
      initialIndex: index
    })
    wx.createSelectorQuery().select('.queue-item').boundingClientRect(rect => {
      if (rect) {
        this.setData({ itemHeight: rect.height + 16 })
      }
    }).exec()
  },

  onTouchMove(e) {
    if (this.data.draggingIndex === -1 || this.data.draggedId === -1) return
    const { draggedId, startY, initialIndex, itemHeight, orderList } = this.data
    const currentY = e.touches[0].clientY
    const h = itemHeight || 120
    const currentPos = orderList.findIndex(it => it.id === draggedId)
    if (currentPos < 0) return
    const steps = Math.round((currentY - startY) / h)
    const target = Math.max(0, Math.min(initialIndex + steps, orderList.length - 1))
    if (target === currentPos) return
    const list = [...orderList]
    const [moved] = list.splice(currentPos, 1)
    list.splice(target, 0, moved)
    this.setData({
      orderList: list.map((it, i) => ({ ...it, rank: i + 1 })),
      draggingIndex: target
    })
  },

  onTouchEnd() {
    if (this.data.draggingIndex === -1) return
    const { orderList, draggedId } = this.data
    const finalIndex = orderList.findIndex(it => it.id === draggedId)
    if (finalIndex >= 0 && finalIndex !== this.data.initialIndex) {
      const queueIds = orderList.map(item => item.id)
      api.request({
        url: '/room/queue/reorder-batch',
        method: 'POST',
        data: { queueIds }
      }).then(() => {
        wx.showToast({ title: '排序已更新', icon: 'success' })
      }).catch(() => {
        this.loadQueue()
        wx.showToast({ title: '排序失败', icon: 'none' })
      })
    }
    this.setData({
      draggingIndex: -1,
      draggedId: -1,
      startY: 0,
      initialIndex: -1
    })
  },

  // 聊天相关
  _setupWebSocket() {
    ws.off('PlaybackChanged')
    ws.off('QueueUpdated')

    ws.on('PlaybackChanged', (data) => {
      this._syncPlayback(data.nowPlaying, data.isPaused)
    })

    ws.on('QueueUpdated', () => {
      this.loadQueue()
    })
  },

  startPolling() {
    this.loadRoomInfo().then(() => {
      this.loadChatMessages()
      this.loadVoiceMessages()
    }).catch(() => {})
    this._createPollTimer(ws.isConnected() ? 10000 : 2000)
  },

  _createPollTimer(interval) {
    if (this.pollTimer) clearInterval(this.pollTimer)
    this._wsConnected = ws.isConnected()
    this.pollTimer = setInterval(() => {
      this.loadRoomInfo().then(() => {
        this.loadChatMessages()
        this.loadVoiceMessages()
      }).catch(() => {})
      this.loadQueue()
      const nowConnected = ws.isConnected()
      if (nowConnected !== this._wsConnected) {
        this._createPollTimer(nowConnected ? 10000 : 2000)
      }
    }, interval)
  },

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  },

  loadChatMessages() {
    const { currentRoomId } = this.data
    if (!currentRoomId) return
    api.request({ url: '/chat/messages?roomId=' + currentRoomId }).then(res => {
      const messages = (res || []).map(msg => ({
        id: msg.id,
        nickname: msg.nickname || msg.sender || '',
        message: msg.message || msg.content || '',
        time: msg.timestamp || msg.time || '',
        isSystem: msg.isSystem || msg.type === 'system' || false
      }))
      this.setData({
        chatMessages: messages,
        chatScrollTop: messages.length * 200
      })
    }).catch(() => {})
  },

  sendChat() {
    const { chatInput, currentRoomId } = this.data
    if (!chatInput.trim()) return
    if (!currentRoomId) {
      wx.showToast({ title: '请先加入房间', icon: 'none' })
      return
    }
    api.request({
      url: '/chat/send',
      method: 'POST',
      data: { roomId: currentRoomId, message: chatInput.trim() }
    }).then(() => {
      this.setData({ chatInput: '' })
      this.loadChatMessages()
    }).catch(err => {
      wx.showToast({ title: err.message || '发送失败', icon: 'none' })
    })
  },

  onChatInput(e) {
    this.setData({ chatInput: e.detail.value })
  },

  toggleChat() {
    this.setData({ showChat: !this.data.showChat })
  },

  // ========== 语音消息 ==========
  startRecording() {
    if (this.data.isRecording) return
    if (!this.data.currentRoomId) {
      wx.showToast({ title: '请先加入房间', icon: 'none' })
      return
    }

    this.setData({ isRecording: true, recordingTime: 0 })
    this.data._recordingStartTime = Date.now()

    // 录音计时器
    this.data._recordingTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.data._recordingStartTime) / 1000)
      this.setData({ recordingTime: elapsed })
      if (elapsed >= 60) {
        this.stopRecording()
      }
    }, 1000)

    recorderManager.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    })

    recorderManager.onStop((res) => {
      if (this.data._recordingTimer) {
        clearInterval(this.data._recordingTimer)
        this.data._recordingTimer = null
      }

      if (!this.data.isRecording) return

      const duration = Math.floor((Date.now() - this.data._recordingStartTime) / 1000)
      this.setData({ isRecording: false, recordingTime: 0 })

      if (duration < 1) {
        wx.showToast({ title: '录音时间太短', icon: 'none' })
        return
      }

      // 上传语音
      this.uploadVoice(res.tempFilePath, duration)
    })

    recorderManager.onError((err) => {
      if (this.data._recordingTimer) {
        clearInterval(this.data._recordingTimer)
        this.data._recordingTimer = null
      }
      this.setData({ isRecording: false, recordingTime: 0 })
      wx.showToast({ title: '录音失败', icon: 'none' })
    })
  },

  stopRecording() {
    if (!this.data.isRecording) return
    recorderManager.stop()
  },

  cancelRecording() {
    if (!this.data.isRecording) return
    if (this.data._recordingTimer) {
      clearInterval(this.data._recordingTimer)
      this.data._recordingTimer = null
    }
    this.setData({ isRecording: false, recordingTime: 0 })
    recorderManager.stop()
    wx.showToast({ title: '已取消录音', icon: 'none' })
  },

  uploadVoice(filePath, duration) {
    wx.showLoading({ title: '发送中...' })
    api.uploadVoice(filePath, this.data.currentRoomId, duration).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '语音已发送', icon: 'success' })
      this.loadVoiceMessages()
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '发送失败', icon: 'none' })
    })
  },

  loadVoiceMessages() {
    if (!this.data.currentRoomId) return
    api.getVoiceMessages(this.data.currentRoomId).then(res => {
      const messages = (res || []).map(msg => ({
        id: msg.id,
        nickname: msg.nickname || '',
        fileUrl: msg.fileUrl || '',
        duration: msg.duration || 0,
        createdAt: msg.createdAt || '',
        isPlaying: false
      }))
      this.setData({ voiceMessages: messages })
    }).catch(() => {})
  },

  playVoice(e) {
    const id = e.currentTarget.dataset.id
    const voice = this.data.voiceMessages.find(v => v.id === id)
    if (!voice) return

    // 如果正在播放同一条，停止
    if (this.data.playingVoiceId === id) {
      if (this._voiceAudio) {
        this._voiceAudio.stop()
        this._voiceAudio = null
      }
      this.setData({ playingVoiceId: -1 })
      return
    }

    // 停止之前的播放
    if (this._voiceAudio) {
      this._voiceAudio.stop()
      this._voiceAudio = null
    }

    this.setData({ playingVoiceId: id })

    const audio = wx.createInnerAudioContext()
    this._voiceAudio = audio
    audio.src = api.toMediaUrl(voice.fileUrl)
    audio.onEnded(() => {
      this.setData({ playingVoiceId: -1 })
      this._voiceAudio = null
    })
    audio.onError(() => {
      this.setData({ playingVoiceId: -1 })
      this._voiceAudio = null
      wx.showToast({ title: '播放失败', icon: 'none' })
    })
    audio.play()
  }
})
