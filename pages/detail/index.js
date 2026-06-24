const app = getApp();

Page({
  data: {
    dishId: 0,
    dish: null,
    quantity: 1,
    buttonText: '加入购物车'
  },

  onLoad(options) {
    this.setData({
      dishId: Number(options.id)
    });
  },

  async onShow() {
    await app.ensureReady();
    const menu = await app.refreshMenu();
    const dish = menu.find((item) => item.id === this.data.dishId);

    this.setData({
      dish,
      buttonText: !dish || dish.enabled === false || dish.stock <= 0 ? '暂不可下单' : '加入购物车'
    });
  },

  increase() {
    this.setData({
      quantity: this.data.quantity + 1
    });
  },

  decrease() {
    this.setData({
      quantity: Math.max(1, this.data.quantity - 1)
    });
  },

  addToCart() {
    const { dish, quantity } = this.data;

    if (!dish || dish.enabled === false || dish.stock <= 0) {
      wx.showToast({
        title: '该菜品暂不可下单',
        icon: 'none'
      });
      return;
    }

    const cart = app.getCart().slice();
    const existing = cart.find((item) => item.id === dish.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        quantity
      });
    }

    app.saveCart(cart);
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  }
});
