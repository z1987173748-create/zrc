const {
  getCart,
  getRole,
  setCart,
  setRole
} = require('./utils/store');
const dataService = require('./services/data-service');

App({
  globalData: {
    menu: [],
    cart: [],
    orders: [],
    role: 'customer',
    cloudReady: false,
    ready: false
  },

  onLaunch() {
    this.globalData.cart = getCart();
    this.globalData.role = getRole();
    this.readyPromise = this.bootstrap();
  },

  async bootstrap() {
    const cloudReady = await dataService.init();
    const [menu, orders] = await Promise.all([
      dataService.getMenu(),
      dataService.getOrders()
    ]);

    this.globalData.menu = menu;
    this.globalData.orders = orders;
    this.globalData.cloudReady = cloudReady;
    this.globalData.ready = true;
    return this.globalData;
  },

  async ensureReady() {
    if (!this.globalData.ready && this.readyPromise) {
      await this.readyPromise;
    }
    return this.globalData;
  },

  isCloudReady() {
    return this.globalData.cloudReady;
  },

  getCloudLabel() {
    return this.globalData.cloudReady ? '云开发已连接' : '本地演示模式';
  },

  async getMenu() {
    await this.ensureReady();
    return this.globalData.menu;
  },

  async refreshMenu() {
    const menu = await dataService.getMenu();
    this.globalData.menu = menu;
    return menu;
  },

  async saveMenu(menu) {
    this.globalData.menu = menu;
    await dataService.saveMenu(menu);
    return menu;
  },

  getCart() {
    return this.globalData.cart;
  },

  saveCart(cart) {
    this.globalData.cart = cart;
    setCart(cart);
  },

  async getOrders() {
    await this.ensureReady();
    return this.globalData.orders;
  },

  async refreshOrders() {
    const orders = await dataService.getOrders();
    this.globalData.orders = orders;
    return orders;
  },

  async saveOrders(orders) {
    this.globalData.orders = orders;
    await dataService.saveOrders(orders);
    return orders;
  },

  getRole() {
    return this.globalData.role;
  },

  saveRole(role) {
    this.globalData.role = role;
    setRole(role);
  },

  async uploadDishImage(tempFilePath, dishId) {
    return dataService.uploadDishImage(tempFilePath, dishId);
  }
});
