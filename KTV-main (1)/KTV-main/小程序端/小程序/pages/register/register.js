const api = require('../../utils/api')

Page({
  data: {
    registerType: 'username', // username / phone / email
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    statusBarHeight: getApp().globalData.statusBarHeight
  },

  onTypeChange(e) {
    this.setData({ registerType: e.currentTarget.dataset.type })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  register() {
    const { registerType, username, phone, email, password, confirmPassword, displayName } = this.data

    if (!displayName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    // 根据注册方式校验必填项
    if (registerType === 'username' && !username) {
      wx.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (registerType === 'phone' && !phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (registerType === 'email' && !email) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }

    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    const data = { password, displayName }
    if (registerType === 'username') data.username = username
    if (registerType === 'phone') data.phone = phone
    if (registerType === 'email') data.email = email

    wx.showLoading({ title: '注册中...' })
    api.request({
      url: '/auth/register',
      method: 'POST',
      data
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '注册失败', icon: 'none' })
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
