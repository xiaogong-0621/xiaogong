const api = require('../../utils/api')

Page({
  data: {
    username: '',
    password: '',
    statusBarHeight: getApp().globalData.statusBarHeight
  },

  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  login() {
    const { username, password } = this.data
    if (!username) {
      wx.showToast({
        title: '请输入用户名/手机号',
        icon: 'none'
      })
      return
    }
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      title: '登录中...'
    })
    api.request({
      url: '/auth/login',
      method: 'POST',
      data: {
        username: username,
        password: password
      }
    }).then(res => {
      wx.hideLoading()
      api.setToken(res.token)
      wx.navigateTo({
        url: '/pages/room-select/room-select'
      })
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      })
    })
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  }
})