const api = require('../../utils/api')

Page({
  data: {
    roomCode: '',
    showInput: false,
    requesting: false,
    joining: false
  },

  onCodeInput(e) {
    this.setData({ roomCode: e.detail.value })
  },

  showCodeInput() {
    this.setData({ showInput: true })
  },

  joinRoom() {
    const code = this.data.roomCode.trim().toUpperCase()
    if (!code) {
      wx.showToast({ title: '请输入房间码', icon: 'none' })
      return
    }
    this.setData({ joining: true })
    api.request({
      url: '/rooms/join',
      method: 'POST',
      data: { roomCode: code }
    }).then(res => {
      this.setData({ joining: false })
      wx.showToast({ title: '已加入房间', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/list/list' })
      }, 1000)
    }).catch(err => {
      this.setData({ joining: false })
      wx.showToast({ title: err.message || '加入失败', icon: 'none' })
    })
  },

  requestRoom() {
    this.setData({ requesting: true })
    api.request({
      url: '/roomrequests',
      method: 'POST'
    }).then(() => {
      this.setData({ requesting: false })
      wx.showModal({
        title: '申请已提交',
        content: '等待管理员审批，请稍后',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/home/home' })
        }
      })
    }).catch(err => {
      this.setData({ requesting: false })
      wx.showToast({ title: err.message || '申请失败', icon: 'none' })
    })
  },

  skip() {
    wx.reLaunch({ url: '/pages/home/home' })
  }
})
