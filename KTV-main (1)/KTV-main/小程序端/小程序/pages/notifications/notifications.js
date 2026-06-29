const api = require('../../utils/api')

Page({
  data: {
    notifications: [],
    loading: false,
    statusBarHeight: getApp().globalData.statusBarHeight,
    navHeight: 0,
    unreadCount: 0,
    hasUnread: false
  },

  onLoad() {
    this.initSafeArea()
    this.loadNotifications()
  },

  onShow() {
    this.loadNotifications()
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

  loadNotifications() {
    this.setData({ loading: true })
    api.getNotifications(50).then(res => {
      const notifications = (res || []).map(item => ({
        ...item,
        timeText: this.formatTime(item.createdAt),
        iconType: this.getIconType(item.type),
        iconColor: this.getIconColor(item.type),
        typeText: this.getTypeText(item.type)
      }))

      // 计算未读数量
      let unreadCount = 0
      for (let i = 0; i < notifications.length; i++) {
        if (!notifications[i].isRead) {
          unreadCount++
        }
      }

      this.setData({
        notifications,
        loading: false,
        unreadCount: unreadCount,
        hasUnread: unreadCount > 0
      })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  formatTime(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return minutes + '分钟前'
    if (hours < 24) return hours + '小时前'
    if (days < 7) return days + '天前'
    return d.toLocaleDateString('zh-CN')
  },

  getIconType(type) {
    const icons = {
      'system_notice': 'notifications',
      'room_approved': 'check_circle',
      'room_rejected': 'cancel'
    }
    return icons[type] || 'info'
  },

  getIconColor(type) {
    const colors = {
      'system_notice': '#0EA5E9',
      'room_approved': '#10b981',
      'room_rejected': '#ef4444'
    }
    return colors[type] || '#86868b'
  },

  getTypeText(type) {
    const texts = {
      'system_notice': '系统通知',
      'room_approved': '申请通过',
      'room_rejected': '申请拒绝'
    }
    return texts[type] || ''
  },

  onNotificationTap(e) {
    const id = e.currentTarget.dataset.id
    const notification = this.data.notifications.find(n => n.id === id)
    if (!notification) return

    // 标记为已读
    if (!notification.isRead) {
      api.markNotificationAsRead(id).then(() => {
        const notifications = this.data.notifications.map(n => {
          if (n.id === id) return { ...n, isRead: true }
          return n
        })

        // 重新计算未读数量
        let unreadCount = 0
        for (let i = 0; i < notifications.length; i++) {
          if (!notifications[i].isRead) {
            unreadCount++
          }
        }

        this.setData({
          notifications,
          unreadCount: unreadCount,
          hasUnread: unreadCount > 0
        })
      })
    }

    // 如果是房间申请通过，显示加入房间按钮
    if (notification.type === 'room_approved') {
      // 不自动跳转，让用户点击加入房间按钮
    }
  },

  joinRoom(e) {
    const content = e.currentTarget.dataset.content
    const roomCode = this.extractRoomCode(content)
    if (!roomCode) {
      wx.showToast({ title: '无法获取房间码', icon: 'none' })
      return
    }

    wx.showModal({
      title: '加入房间',
      content: '是否加入房间 ' + roomCode + '？',
      success: (res) => {
        if (res.confirm) {
          api.request({
            url: '/rooms/join',
            method: 'POST',
            data: { roomCode: roomCode }
          }).then(() => {
            wx.showToast({ title: '已加入房间', icon: 'success' })
            setTimeout(() => {
              wx.switchTab({ url: '/pages/list/list' })
            }, 1500)
          }).catch(err => {
            wx.showToast({ title: err.message || '加入失败', icon: 'none' })
          })
        }
      }
    })
  },

  extractRoomCode(content) {
    if (!content) return null
    const match = content.match(/房间码[为：:]\s*([A-Z0-9]{6})/)
    return match ? match[1] : null
  },

  onMarkAllRead() {
    wx.showModal({
      title: '提示',
      content: '确定将所有消息标记为已读？',
      success: (res) => {
        if (res.confirm) {
          api.markAllNotificationsAsRead().then(() => {
            const notifications = this.data.notifications.map(n => ({ ...n, isRead: true }))
            this.setData({
              notifications,
              unreadCount: 0,
              hasUnread: false
            })
            wx.showToast({ title: '已全部标记为已读', icon: 'success' })
          }).catch(() => {
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
