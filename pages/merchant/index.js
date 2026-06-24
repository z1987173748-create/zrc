const app = getApp();

const NEXT_STATUS = {
  '待接单': '制作中',
  '制作中': '待取餐',
  '待取餐': '已完成'
};

function buildMenuFilterOptions(activeValue) {
  return [
    { value: 'all', label: '全部', active: activeValue === 'all' },
    { value: 'enabled', label: '上架中', active: activeValue === 'enabled' },
    { value: 'disabled', label: '已下架', active: activeValue === 'disabled' }
  ];
}

function buildOrdersView(orders) {
  return orders.map((order) => ({
    ...order,
    noteText: order.note || '无备注',
    summaryDish: order.items.length > 1
      ? `${order.items[0].name} 等`
      : (order.items[0] ? order.items[0].name : '未命名菜品'),
    canAdvance: order.status !== '已完成',
    actionText: order.status === '待接单'
      ? '确认接单'
      : order.status === '制作中'
        ? '标记待取餐'
        : order.status === '待取餐'
          ? '完成订单'
          : ''
  }));
}

function buildMenuView(menu) {
  return menu.map((item) => ({
    ...item,
    priceText: `¥${Number(item.price).toFixed(0)}`,
    statusText: item.enabled ? '上架中' : '已下架'
  }));
}

Page({
  data: {
    activeTab: 'board',
    cloudLabel: '本地演示模式',
    orders: [],
    menu: [],
    filteredMenu: [],
    menuKeyword: '',
    menuFilter: 'all',
    menuFilters: buildMenuFilterOptions('all'),
    metrics: {
      pending: 0,
      processing: 0,
      revenue: '0.00',
      avgTicket: '0.00'
    },
    menuStats: {
      enabled: 0,
      disabled: 0
    },
    hotDishes: [],
    hasHotDishes: false,
    hasOrders: false,
    editorVisible: false,
    editorForm: {
      id: 0,
      name: '',
      price: '',
      stock: '',
      description: '',
      enabled: true,
      image: '',
      imageType: 'builtin'
    }
  },

  async onShow() {
    app.saveRole('merchant');
    await this.refreshDashboard();
  },

  async refreshDashboard() {
    await app.ensureReady();
    const [menu, orders] = await Promise.all([
      app.refreshMenu(),
      app.refreshOrders()
    ]);

    const menuView = buildMenuView(menu);
    const ordersView = buildOrdersView(orders);
    const pending = ordersView.filter((item) => item.status === '待接单').length;
    const processing = ordersView.filter((item) => item.status === '制作中' || item.status === '待取餐').length;
    const revenue = ordersView.reduce((sum, item) => sum + item.totalAmount, 0);
    const avgTicket = ordersView.length ? revenue / ordersView.length : 0;

    const dishCounter = {};
    ordersView.forEach((order) => {
      order.items.forEach((item) => {
        dishCounter[item.name] = (dishCounter[item.name] || 0) + item.quantity;
      });
    });

    const hotDishes = Object.keys(dishCounter)
      .map((name) => ({ name, count: dishCounter[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.setData({
      cloudLabel: app.getCloudLabel(),
      orders: ordersView,
      menu: menuView,
      filteredMenu: this.buildFilteredMenu(menuView, this.data.menuKeyword, this.data.menuFilter),
      metrics: {
        pending,
        processing,
        revenue: revenue.toFixed(2),
        avgTicket: avgTicket.toFixed(2)
      },
      menuStats: {
        enabled: menuView.filter((item) => item.enabled).length,
        disabled: menuView.filter((item) => !item.enabled).length
      },
      hotDishes,
      hasHotDishes: hotDishes.length > 0,
      hasOrders: ordersView.length > 0,
      menuFilters: buildMenuFilterOptions(this.data.menuFilter)
    });
  },

  buildFilteredMenu(menu, keyword, filterValue) {
    return menu.filter((item) => {
      const matchKeyword = !keyword || item.name.includes(keyword) || item.description.includes(keyword);
      const matchFilter = filterValue === 'all'
        || (filterValue === 'enabled' && item.enabled)
        || (filterValue === 'disabled' && !item.enabled);
      return matchKeyword && matchFilter;
    });
  },

  switchTab(event) {
    this.setData({
      activeTab: event.currentTarget.dataset.tab
    });
  },

  onMenuKeywordInput(event) {
    const menuKeyword = event.detail.value.trim();
    this.setData({
      menuKeyword,
      filteredMenu: this.buildFilteredMenu(this.data.menu, menuKeyword, this.data.menuFilter)
    });
  },

  switchMenuFilter(event) {
    const menuFilter = event.currentTarget.dataset.value;
    this.setData({
      menuFilter,
      menuFilters: buildMenuFilterOptions(menuFilter),
      filteredMenu: this.buildFilteredMenu(this.data.menu, this.data.menuKeyword, menuFilter)
    });
  },

  async toggleDishStatus(event) {
    const id = event.currentTarget.dataset.id;
    const enabled = event.detail.value;
    const nextMenu = this.data.menu.map((item) => (
      item.id === id
        ? { ...item, enabled, statusText: enabled ? '上架中' : '已下架', updatedAt: Date.now() }
        : item
    ));

    await app.saveMenu(nextMenu);
    await this.refreshDashboard();
  },

  openEditor(event) {
    const id = event.currentTarget.dataset.id;
    const dish = this.data.menu.find((item) => item.id === id);

    if (!dish) {
      return;
    }

    this.setData({
      editorVisible: true,
      editorForm: {
        id: dish.id,
        name: dish.name,
        price: String(dish.price),
        stock: String(dish.stock),
        description: dish.description,
        enabled: dish.enabled,
        image: dish.image,
        imageType: dish.imageType || 'builtin'
      }
    });
  },

  closeEditor() {
    this.setData({
      editorVisible: false
    });
  },

  onEditorFieldInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`editorForm.${field}`]: event.detail.value
    });
  },

  onEditorEnabledChange(event) {
    this.setData({
      'editorForm.enabled': event.detail.value
    });
  },

  async chooseImage() {
    try {
      const result = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sizeType: ['compressed'],
          success: resolve,
          fail: reject
        });
      });
      const tempFilePath = result.tempFiles[0].tempFilePath;
      const uploaded = await app.uploadDishImage(tempFilePath, this.data.editorForm.id);
      this.setData({
        'editorForm.image': uploaded.image,
        'editorForm.imageType': uploaded.imageType
      });
      wx.showToast({
        title: '图片已更新',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: '未选择图片',
        icon: 'none'
      });
    }
  },

  async saveDishEdit() {
    const form = this.data.editorForm;
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (Number.isNaN(price) || Number.isNaN(stock) || price < 0 || stock < 0) {
      wx.showToast({
        title: '请填写有效价格和库存',
        icon: 'none'
      });
      return;
    }

    const nextMenu = this.data.menu.map((item) => (
      item.id === form.id
        ? {
            ...item,
            price,
            stock,
            description: form.description,
            enabled: form.enabled,
            image: form.image,
            imageType: form.imageType,
            statusText: form.enabled ? '上架中' : '已下架',
            updatedAt: Date.now()
          }
        : item
    ));

    await app.saveMenu(nextMenu);
    this.setData({
      editorVisible: false
    });
    await this.refreshDashboard();
    wx.showToast({
      title: '菜品已保存',
      icon: 'success'
    });
  },

  async advanceStatus(event) {
    const id = event.currentTarget.dataset.id;
    const orders = (await app.getOrders()).map((order) => {
      if (order.id === id && NEXT_STATUS[order.status]) {
        return {
          ...order,
          status: NEXT_STATUS[order.status]
        };
      }
      return order;
    });

    await app.saveOrders(orders);
    await this.refreshDashboard();
  },

  goCustomer() {
    app.saveRole('customer');
    wx.navigateTo({
      url: '/pages/home/index'
    });
  },

  noop() {}
});
