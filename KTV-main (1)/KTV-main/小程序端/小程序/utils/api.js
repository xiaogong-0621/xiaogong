const BASE_URL = 'http://localhost:5276/api'
const MEDIA_BASE = 'http://localhost:5276'

function toMediaUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return MEDIA_BASE + path
}

function getToken() {
  return wx.getStorageSync('token') || ''
}

function setToken(token) {
  wx.setStorageSync('token', token)
}

function clearToken() {
  wx.removeStorageSync('token')
}

function request(options) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          clearToken()
          wx.redirectTo({ url: '/pages/index/index' })
          reject(new Error('登录已过期'))
        } else {
          reject(new Error((res.data && res.data.message) || '请求失败(' + res.statusCode + ')'))
        }
      },
      fail(err) {
        reject(new Error('网络请求失败，请检查后端是否已启动'))
      }
    })
  })
}

let cachedRoomId = null

function getCurrentRoomId() {
  if (cachedRoomId) return Promise.resolve(cachedRoomId)
  return request({ url: '/room/current' }).then(res => {
    cachedRoomId = res.roomId || 0
    return cachedRoomId
  })
}

function clearRoomCache() {
  cachedRoomId = null
}

module.exports = {
  BASE_URL,
  MEDIA_BASE,
  toMediaUrl,
  getToken,
  setToken,
  clearToken,
  request,
  getCurrentRoomId,
  clearRoomCache,

  // 通知相关API（复用Web端接口）
  getNotifications(limit = 50) {
    return request({ url: '/notifications?limit=' + limit })
  },

  getUnreadCount() {
    return request({ url: '/notifications/unread-count' })
  },

  markNotificationAsRead(id) {
    return request({ url: '/notifications/' + id + '/read', method: 'POST' })
  },

  markAllNotificationsAsRead() {
    return request({ url: '/notifications/read-all', method: 'POST' })
  },

  // 语音消息
  uploadVoice(filePath, roomId, duration) {
    return new Promise((resolve, reject) => {
      const token = getToken()
      wx.uploadFile({
        url: BASE_URL + '/voice/upload',
        filePath: filePath,
        name: 'file',
        formData: {
          roomId: roomId.toString(),
          duration: duration.toString()
        },
        header: {
          'Authorization': token ? 'Bearer ' + token : ''
        },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data = JSON.parse(res.data)
            resolve(data)
          } else if (res.statusCode === 401) {
            clearToken()
            wx.redirectTo({ url: '/pages/index/index' })
            reject(new Error('登录已过期'))
          } else {
            const data = JSON.parse(res.data)
            reject(new Error(data.message || '上传失败'))
          }
        },
        fail(err) {
          reject(new Error('网络请求失败'))
        }
      })
    })
  },

  getVoiceMessages(roomId) {
    return request({ url: '/voice/messages?roomId=' + roomId })
  }
}