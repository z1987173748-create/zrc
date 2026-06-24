const cloudConfig = require('../config/cloud');

let initialized = false;
let available = false;

function initCloud() {
  if (initialized) {
    return available;
  }

  initialized = true;
  available = Boolean(wx.cloud && cloudConfig.envId);

  if (available) {
    wx.cloud.init({
      env: cloudConfig.envId,
      traceUser: cloudConfig.traceUser
    });
  }

  return available;
}

function isCloudAvailable() {
  return available;
}

function getDatabase() {
  return available ? wx.cloud.database() : null;
}

module.exports = {
  initCloud,
  isCloudAvailable,
  getDatabase
};
