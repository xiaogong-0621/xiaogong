const api = require('./api')

let socketTask = null
let _wsReady = false
let _connecting = false
let currentRoomId = 0
let reconnectTimer = null
let listeners = {}
let _intentionalClose = false

function connect(roomId) {
  if (!roomId || roomId <= 0) return
  currentRoomId = roomId

  const token = api.getToken()
  if (!token) return

  // Don't disconnect if already connected to same room
  if (_wsReady && socketTask) return

  // Prevent duplicate connection attempts while connecting
  if (_connecting) return
  _connecting = true

  _intentionalClose = true
  if (socketTask) {
    try { socketTask.close({}) } catch (e) {}
  }
  _intentionalClose = false

  const wsUrl = api.MEDIA_BASE.replace(/^http/, 'ws') + '/ws/notify?access_token=' + encodeURIComponent(token)

  socketTask = wx.connectSocket({ url: wsUrl })
  _wsReady = false

  socketTask.onOpen(() => {
    _wsReady = true
    _connecting = false
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  })

  socketTask.onMessage((res) => {
    try {
      const msg = JSON.parse(res.data)
      const handlers = listeners[msg.type]
      if (handlers) {
        handlers.forEach(fn => fn(msg.data))
      }
    } catch (e) {}
  })

  socketTask.onClose(() => {
    socketTask = null
    _wsReady = false
    _connecting = false
    if (!_intentionalClose) scheduleReconnect()
  })

  socketTask.onError(() => {
    socketTask = null
    _wsReady = false
    _connecting = false
    if (!_intentionalClose) scheduleReconnect()
  })
}

function disconnect() {
  _intentionalClose = true
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (socketTask) {
    try { socketTask.close({}) } catch (e) {}
    socketTask = null
  }
  _wsReady = false
  currentRoomId = 0
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (currentRoomId > 0) {
      connect(currentRoomId)
    }
  }, 3000)
}

function on(eventType, callback) {
  if (!listeners[eventType]) listeners[eventType] = []
  listeners[eventType].push(callback)
}

function off(eventType, callback) {
  if (!listeners[eventType]) return
  if (callback) {
    listeners[eventType] = listeners[eventType].filter(fn => fn !== callback)
  } else {
    listeners[eventType] = []
  }
}

function isConnected() {
  return _wsReady
}

module.exports = { connect, disconnect, on, off, isConnected }
