const app = getApp();

function withCategoryState(categories, activeCategory) {
  return categories.map((item) => ({
    name: item,
    isActive: item === activeCategory
  }));
}

function buildMenuView(menu, cart) {
  const cartMap = {};
  cart.forEach((item) => {
    cartMap[item.id] = item.quantity;
  });

  return menu
    .filter((item) => item.enabled !== false)
    .map((item) => ({
      ...item,
      quantity: cartMap[item.id] || 0,
      priceText: `¥${Number(item.price).toFixed(0)}`,
      stockText: item.stock > 0 ? `库存 ${item.stock}` : '今日售罄',
      salesText: `月售 ${item.sales}`,
      isSoldOut: item.stock <= 0
    }));
}

Page({
  data: {
    keyword: '',
    activeCategory: '全部',
    categories: [],
    menu: [],
    filteredMenu: [],
    hasFilteredMenu: true,
    cartCount: 0,
    cloudLabel: '本地演示模式',
    availableCount: 0
  },

  async onShow() {
    await this.refreshPage();
  },

  async refreshPage() {
    await app.ensureReady();
    const menu = buildMenuView(await app.refreshMenu(), app.getCart());
    const filteredMenu = this.buildFilteredMenu(menu, this.data.keyword, this.data.activeCategory);
    const categoryNames = ['全部'].concat([...new Set(menu.map((item) => item.category))]);

    this.setData({
      menu,
      filteredMenu,
      categories: withCategoryState(categoryNames, this.data.activeCategory),
      hasFilteredMenu: filteredMenu.length > 0,
      cartCount: app.getCart().reduce((sum, item) => sum + item.quantity, 0),
      cloudLabel: app.getCloudLabel(),
      availableCount: menu.length
    });
  },

  buildFilteredMenu(menu, keyword, category) {
    return menu.filter((item) => {
      const matchKeyword = !keyword || item.name.includes(keyword) || item.description.includes(keyword);
      const matchCategory = category === '全部' || item.category === category;
      return matchKeyword && matchCategory;
    });
  },

  onKeywordInput(event) {
    const keyword = event.detail.value.trim();
    const filteredMenu = this.buildFilteredMenu(this.data.menu, keyword, this.data.activeCategory);
    this.setData({
      keyword,
      filteredMenu,
      hasFilteredMenu: filteredMenu.length > 0
    });
  },

  switchCategory(event) {
    const category = event.currentTarget.dataset.category;
    const filteredMenu = this.buildFilteredMenu(this.data.menu, this.data.keyword, category);
    this.setData({
      activeCategory: category,
      categories: this.data.categories.map((item) => ({
        ...item,
        isActive: item.name === category
      })),
      filteredMenu,
      hasFilteredMenu: filteredMenu.length > 0
    });
  },

  openDetail(event) {
    wx.navigateTo({
      url: `/pages/detail/index?id=${event.currentTarget.dataset.id}`
    });
  },

  addItem(event) {
    const id = event.currentTarget.dataset.id;
    const dish = this.data.menu.find((item) => item.id === id);

    if (!dish || dish.isSoldOut) {
      wx.showToast({
        title: '该菜品暂时不可下单',
        icon: 'none'
      });
      return;
    }

    const cart = app.getCart().slice();
    const existing = cart.find((item) => item.id === id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        quantity: 1
      });
    }

    app.saveCart(cart);
    this.refreshPage();
  },

  goCart() {
    wx.navigateTo({
      url: '/pages/cart/index'
    });
  },

  goOrders() {
    wx.navigateTo({
      url: '/pages/orders/index'
    });
  },

  goMerchant() {
    app.saveRole('merchant');
    wx.navigateTo({
      url: '/pages/merchant/index'
    });
  }
});
