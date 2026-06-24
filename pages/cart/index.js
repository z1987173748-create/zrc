const app = getApp();
const { buildOrder } = require('../../utils/order');

Page({
  data: {
    cart: [],
    note: '',
    totalAmount: '0.00',
    totalCount: 0,
    hasCart: false
  },

  async onShow() {
    await app.ensureReady();
    await this.refreshCart();
  },

  async refreshCart() {
    const latestMenu = await app.refreshMenu();
    const menuMap = {};
    latestMenu.forEach((item) => {
      menuMap[item.id] = item;
    });

    const cart = app.getCart()
      .map((item) => {
        const latestDish = menuMap[item.id];
        if (!latestDish) {
          return null;
        }
        return {
          ...item,
          name: latestDish.name,
          price: latestDish.price,
          image: latestDish.image,
          enabled: latestDish.enabled !== false,
          stock: latestDish.stock,
          subtotal: (latestDish.price * item.quantity).toFixed(2)
        };
      })
      .filter(Boolean);

    app.saveCart(cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity
    })));

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    this.setData({
      cart,
      totalAmount: totalAmount.toFixed(2),
      totalCount,
      hasCart: cart.length > 0
    });
  },

  updateQuantity(event) {
    const { id, delta } = event.currentTarget.dataset;
    const cart = app.getCart().slice();
    const item = cart.find((entry) => entry.id === id);

    if (!item) {
      return;
    }

    item.quantity += delta;
    app.saveCart(cart.filter((entry) => entry.quantity > 0));
    this.refreshCart();
  },

  onNoteInput(event) {
    this.setData({
      note: event.detail.value
    });
  },

  async submitOrder() {
    if (!this.data.cart.length) {
      wx.showToast({
        title: '购物车还是空的',
        icon: 'none'
      });
      return;
    }

    const latestMenu = await app.refreshMenu();
    const menuMap = {};
    latestMenu.forEach((dish) => {
      menuMap[dish.id] = dish;
    });

    const invalidDish = this.data.cart.find((item) => {
      const latestDish = menuMap[item.id];
      return !latestDish || latestDish.enabled === false || latestDish.stock < item.quantity;
    });

    if (invalidDish) {
      wx.showToast({
        title: `${invalidDish.name} 库存或状态已变化`,
        icon: 'none'
      });
      await this.refreshCart();
      return;
    }

    const nextMenu = latestMenu.map((dish) => {
      const cartItem = this.data.cart.find((item) => item.id === dish.id);
      if (!cartItem) {
        return dish;
      }
      return {
        ...dish,
        stock: Math.max(0, dish.stock - cartItem.quantity)
      };
    });

    const order = buildOrder(this.data.cart, this.data.note);
    const orders = [order].concat(await app.getOrders());

    await Promise.all([
      app.saveMenu(nextMenu),
      app.saveOrders(orders)
    ]);

    app.saveCart([]);
    this.setData({
      note: ''
    });
    await this.refreshCart();
    wx.showToast({
      title: '订单已提交',
      icon: 'success'
    });
  }
});
