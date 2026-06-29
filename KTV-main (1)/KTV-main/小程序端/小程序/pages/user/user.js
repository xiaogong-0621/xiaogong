const api = require('../../utils/api')
const h = require('../../utils/helpers')

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  // 转换为北京时间 (UTC+8)
  const bj = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + (8 * 3600000))
  const now = new Date()
  const nowBj = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000))
  const time = bj.getHours().toString().padStart(2, '0') + ':' + bj.getMinutes().toString().padStart(2, '0')
  const today = new Date(nowBj.getFullYear(), nowBj.getMonth(), nowBj.getDate())
  const itemDay = new Date(bj.getFullYear(), bj.getMonth(), bj.getDate())
  const diff = (today - itemDay) / 86400000
  if (diff === 0) return '今天 ' + time
  if (diff === 1) return '昨天 ' + time
  return (bj.getMonth() + 1) + '/' + bj.getDate() + ' ' + time
}

Page({
  data: {
    profile: {
      displayName: '',
      username: '',
      phone: '',
      email: '',
      avatarUrl: '',
      songCount: 0,
      favoriteCount: 0
    },
    recentSongs: [],
    showEditDialog: false,
    editDisplayName: '',
    editPhone: '',
    editEmail: '',
    editLoading: false,
    showPasswordDialog: false,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    passwordLoading: false,
    statusBarHeight: getApp().globalData.statusBarHeight
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 4 })
    }
    this.loadProfile()
    this.loadRecentSongs()
  },

  loadProfile() {
    api.request({ url: '/auth/profile' }).then(res => {
      if (!res) return
      const avatarUrl = res.avatarUrl ? api.toMediaUrl(res.avatarUrl) : ''
      this.setData({
        profile: {
          displayName: res.displayName || '',
          username: res.username || '',
          phone: res.phone || '',
          email: res.email || '',
          avatarUrl: avatarUrl,
          songCount: res.songCount || 0,
          favoriteCount: res.favoriteCount || 0
        }
      })
    }).catch(() => {})
  },

  loadRecentSongs() {
    api.request({ url: '/auth/recent-songs?count=5' }).then(res => {
      const songs = (res || []).map(item => {
        const cover = api.toMediaUrl(item.coverUrl || '')
        return {
          songId: item.songId,
          title: item.songTitle || item.title || '未知歌曲',
          artist: item.artist || '未知歌手',
          cover: cover,
          coverOk: !!cover,
          dateText: formatDate(item.orderedAt || item.createdAt)
        }
      })
      this.setData({ recentSongs: songs })
    }).catch(() => {})
  },

  onAvatarError() {
    this.setData({ 'profile.avatarUrl': '' })
  },

  onSongCoverError(e) {
    const idx = e.currentTarget.dataset.index
    if (idx >= 0) {
      this.setData({ ['recentSongs[' + idx + '].coverOk']: false })
    }
  },

  // 编辑资料
  openEditDialog() {
    this.setData({
      showEditDialog: true,
      editDisplayName: this.data.profile.displayName,
      editPhone: this.data.profile.phone || '',
      editEmail: this.data.profile.email || ''
    })
  },

  closeEditDialog() {
    this.setData({ showEditDialog: false })
  },

  onEditDisplayName(e) {
    this.setData({ editDisplayName: e.detail.value })
  },

  onEditPhone(e) {
    this.setData({ editPhone: e.detail.value })
  },

  onEditEmail(e) {
    this.setData({ editEmail: e.detail.value })
  },

  handleUpdateProfile() {
    const { editDisplayName, editPhone, editEmail } = this.data
    if (!editDisplayName.trim()) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    this.setData({ editLoading: true })
    api.request({
      url: '/auth/profile',
      method: 'PUT',
      data: {
        displayName: editDisplayName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim()
      }
    }).then(() => {
      this.setData({ editLoading: false, showEditDialog: false })
      wx.showToast({ title: '资料已更新', icon: 'success' })
      this.loadProfile()
    }).catch(() => {
      this.setData({ editLoading: false })
      wx.showToast({ title: '更新失败', icon: 'none' })
    })
  },

  // 修改密码
  openPasswordDialog() {
    this.setData({
      showPasswordDialog: true,
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  },

  closePasswordDialog() {
    this.setData({ showPasswordDialog: false })
  },

  onOldPassword(e) {
    this.setData({ oldPassword: e.detail.value })
  },

  onNewPassword(e) {
    this.setData({ newPassword: e.detail.value })
  },

  onConfirmPassword(e) {
    this.setData({ confirmPassword: e.detail.value })
  },

  handleChangePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data
    if (!oldPassword) {
      wx.showToast({ title: '请输入原密码', icon: 'none' })
      return
    }
    if (!newPassword) {
      wx.showToast({ title: '请输入新密码', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
      return
    }
    this.setData({ passwordLoading: true })
    api.request({
      url: '/auth/change-password',
      method: 'POST',
      data: { oldPassword, newPassword }
    }).then(() => {
      this.setData({ passwordLoading: false, showPasswordDialog: false })
      wx.showToast({ title: '密码已修改', icon: 'success' })
    }).catch(err => {
      this.setData({ passwordLoading: false })
      wx.showToast({ title: err.message || '原密码错误', icon: 'none' })
    })
  },

  // 设置项
  goToNotifications() {
    wx.showToast({ title: '暂未开放', icon: 'none' })
  },

  goToPrivacy() {
    wx.showToast({ title: '暂未开放', icon: 'none' })
  },

  goToAbout() {
    wx.showModal({
      title: '关于声域友',
      content: '声域友 — 线上社交 KTV 平台\n版本 1.0.0',
      showCancel: false
    })
  },

  stopPropagation() {}
})
