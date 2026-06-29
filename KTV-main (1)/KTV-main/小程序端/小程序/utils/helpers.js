const api = require('./api')

const COLORS = ['#1e6fb5', '#e8854a', '#6b5b95', '#88b04b', '#d64161', '#2c3e50', '#f39c12']

function getColorById(id) {
  return COLORS[(id || 0) % COLORS.length]
}

function updateOrderedStorage(songId, add) {
  let ids = wx.getStorageSync('orderedSongIds') || []
  if (add) {
    if (!ids.includes(songId)) ids.push(songId)
  } else {
    ids = ids.filter(id => id !== songId)
  }
  wx.setStorageSync('orderedSongIds', ids)
}

function updateFavoriteStorage(songId, add) {
  let ids = wx.getStorageSync('favoriteSongIds') || []
  if (add) {
    if (!ids.includes(songId)) ids.push(songId)
  } else {
    ids = ids.filter(id => id !== songId)
  }
  wx.setStorageSync('favoriteSongIds', ids)
}

function notifyQueueUpdate() {
  try {
    const pages = getCurrentPages()
    const listPage = pages.find(page => page.route === 'pages/list/list')
    if (listPage && typeof listPage.loadQueue === 'function') {
      listPage.loadQueue()
    }
  } catch (e) {}
}

module.exports = {
  COLORS,
  getColorById,
  updateOrderedStorage,
  updateFavoriteStorage,
  notifyQueueUpdate
}
