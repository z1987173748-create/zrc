const baseMenu = require('../data/menu');
const cloudConfig = require('../config/cloud');
const {
  getMenuCache,
  setMenuCache,
  getOrderCache,
  setOrderCache,
  saveLocalImage
} = require('../utils/store');
const {
  initCloud,
  isCloudAvailable,
  getDatabase
} = require('./cloud');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildMenuDefaults(menu) {
  return menu.map((item) => {
    const {
      priceText,
      statusText,
      stockText,
      salesText,
      quantity,
      isSoldOut,
      ...rest
    } = item;

    return {
      ...rest,
      enabled: rest.enabled !== false,
      imageType: rest.imageType || 'builtin',
      updatedAt: rest.updatedAt || 'builtin'
    };
  });
}

async function ensureDoc(docId, payload) {
  const db = getDatabase();
  const collection = db.collection(cloudConfig.collection);

  try {
    const result = await collection.doc(docId).get();
    return result.data || payload;
  } catch (error) {
    await collection.doc(docId).set({
      data: payload
    });
    return payload;
  }
}

async function init() {
  const cloudReady = initCloud();

  if (cloudReady) {
    await ensureDoc(cloudConfig.menuDocId, {
      items: buildMenuDefaults(baseMenu),
      updatedAt: Date.now()
    });
    await ensureDoc(cloudConfig.orderDocId, {
      items: [],
      updatedAt: Date.now()
    });
  } else {
    if (!getMenuCache([]).length) {
      setMenuCache(buildMenuDefaults(baseMenu));
    }
  }

  return cloudReady;
}

async function getMenu() {
  if (isCloudAvailable()) {
    const db = getDatabase();
    const result = await db.collection(cloudConfig.collection).doc(cloudConfig.menuDocId).get();
    const items = buildMenuDefaults(result.data.items || []);
    setMenuCache(items);
    return clone(items);
  }

  const localMenu = getMenuCache(buildMenuDefaults(baseMenu));
  return clone(buildMenuDefaults(localMenu));
}

async function saveMenu(menu) {
  const nextMenu = buildMenuDefaults(menu);
  setMenuCache(nextMenu);

  if (isCloudAvailable()) {
    const db = getDatabase();
    await db.collection(cloudConfig.collection).doc(cloudConfig.menuDocId).set({
      data: {
        items: nextMenu,
        updatedAt: Date.now()
      }
    });
  }
}

async function getOrders() {
  if (isCloudAvailable()) {
    const db = getDatabase();
    const result = await db.collection(cloudConfig.collection).doc(cloudConfig.orderDocId).get();
    const items = result.data.items || [];
    setOrderCache(items);
    return clone(items);
  }

  return clone(getOrderCache());
}

async function saveOrders(orders) {
  setOrderCache(orders);

  if (isCloudAvailable()) {
    const db = getDatabase();
    await db.collection(cloudConfig.collection).doc(cloudConfig.orderDocId).set({
      data: {
        items: orders,
        updatedAt: Date.now()
      }
    });
  }
}

async function uploadDishImage(tempFilePath, dishId) {
  if (isCloudAvailable()) {
    const extension = tempFilePath.split('.').pop() || 'png';
    const cloudPath = `${cloudConfig.uploadFolder}/${dishId}-${Date.now()}.${extension}`;
    const result = await wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath
    });
    return {
      image: result.fileID,
      imageType: 'cloud'
    };
  }

  const savedFilePath = await saveLocalImage(tempFilePath);
  return {
    image: savedFilePath,
    imageType: 'local'
  };
}

module.exports = {
  init,
  getMenu,
  saveMenu,
  getOrders,
  saveOrders,
  uploadDishImage
};
