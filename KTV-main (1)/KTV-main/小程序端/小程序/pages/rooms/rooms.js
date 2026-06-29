const api = require('../../utils/api')

// 房间名称预设
const roomNames = ['音乐交流房', '一起听歌', 'K歌房', '麦霸集中营', '歌声嘹亮', '欢乐KTV', '音乐空间', '歌声飞扬']
const roomEmojis = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']

Page({
  data: {
    rooms: [],
    total: 0,
    loading: false,
    search: '',
    joinCode: '',
    requesting: false,
    statusBarHeight: getApp().globalData.statusBarHeight,
    navHeight: 0
  },

  onLoad() {
    this.initSafeArea()
    this.loadRooms()
    this._timer = setInterval(() => this.loadRooms(), 5000)
  },

  initSafeArea() {
    const systemInfo = wx.getSystemInfoSync()
    const menuButton = wx.getMenuButtonBoundingClientRect()
    const navHeight = menuButton.bottom + menuButton.top - systemInfo.statusBarHeight

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      navHeight: navHeight
    })
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

  onPullDownRefresh() {
    this.loadRooms().then(() => wx.stopPullDownRefresh())
  },

  loadRooms() {
    return api.request({
      url: '/rooms',
      data: this.data.search ? { search: this.data.search.trim(), pageSize: 20 } : { pageSize: 20 }
    }).then(res => {
      const items = (res.items || []).map((room, index) => ({
        ...room,
        timeText: this._formatDate(room.createdAt),
        roomName: room.roomName || roomNames[index % roomNames.length],
        emoji: room.emoji || roomEmojis[index % roomEmojis.length]
      }))
      this.setData({ rooms: items, total: res.total || items.length, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  onSearchInput(e) {
    this.setData({ search: e.detail.value })
  },

  onSearch() {
    this.loadRooms()
  },

  clearSearch() {
    this.setData({ search: '' })
    this.loadRooms()
  },

  joinRoom(e) {
    const code = e.currentTarget.dataset.code
    this._doJoin(code)
  },

  onJoinCodeInput(e) {
    this.setData({ joinCode: e.detail.value })
  },

  confirmJoin() {
    const code = this.data.joinCode.trim().toUpperCase()
    if (!code) {
      wx.showToast({ title: '请输入房间码', icon: 'none' })
      return
    }
    this.setData({ joinCode: '' })
    this._doJoin(code)
  },

  _doJoin(code) {
    api.clearRoomCache()
    api.request({
      url: '/rooms/join',
      method: 'POST',
      data: { roomCode: code }
    }).then(res => {
      wx.showToast({ title: '已加入房间', icon: 'success' })
      wx.switchTab({ url: '/pages/list/list' })
    }).catch(err => {
      wx.showToast({ title: err.message || '加入失败', icon: 'none' })
    })
  },

  requestRoom() {
    if (this.data.requesting) return
    this.setData({ requesting: true })
    api.request({
      url: '/roomrequests',
      method: 'POST'
    }).then(() => {
      this.setData({ requesting: false })
      wx.showModal({
        title: '申请已提交',
        content: '等待管理员审批，请稍后',
        showCancel: false
      })
    }).catch(err => {
      this.setData({ requesting: false })
      wx.showToast({ title: err.message || '申请失败', icon: 'none' })
    })
  },

  goBack() {
    wx.navigateBack().catch(() => {
      wx.switchTab({ url: '/pages/home/home' })
    })
  },

  _formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return month + '/' + day + ' ' + h + ':' + m
  }
})
