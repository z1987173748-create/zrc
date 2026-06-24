const CART_KEY = 'smart-order-cart';
const ROLE_KEY = 'smart-order-role';
const MENU_CACHE_KEY = 'smart-order-menu-cache';
const ORDER_CACHE_KEY = 'smart-order-order-cache';

function read(key, fallback) {
  try {
    const value = wx.getStorageSync(key);
    return value || fallback;
  } catch (error) {
    return fallback;
  }
}

function write(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    console.warn(`Failed to persist ${key}`, error);
  }
}

function getCart() {
  return read(CART_KEY, []);
}

function setCart(cart) {
  write(CART_KEY, cart);
}

function getRole() {
  return read(ROLE_KEY, 'customer');
}

function setRole(role) {
  write(ROLE_KEY, role);
}

function getMenuCache(fallback) {
  return read(MENU_CACHE_KEY, fallback || []);
}

function setMenuCache(menu) {
  write(MENU_CACHE_KEY, menu);
}

function getOrderCache() {
  return read(ORDER_CACHE_KEY, []);
}

function setOrderCache(orders) {
  write(ORDER_CACHE_KEY, orders);
}

function saveLocalImage(tempFilePath) {
  return new Promise((resolve) => {
    try {
      wx.getFileSystemManager().saveFile({
        tempFilePath,
        success: (result) => resolve(result.savedFilePath),
        fail: () => resolve(tempFilePath)
      });
    } catch (error) {
      resolve(tempFilePath);
    }
  });
}

module.exports = {
  getCart,
  setCart,
  getRole,
  setRole,
  getMenuCache,
  setMenuCache,
  getOrderCache,
  setOrderCache,
  saveLocalImage
};
