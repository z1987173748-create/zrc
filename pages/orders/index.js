const app = getApp();

function buildOrderView(orders) {
  return orders.map((order) => ({
    ...order,
    noteText: order.note || '无备注'
  }));
}

Page({
  data: {
    orders: [],
    hasOrders: false,
    cloudLabel: '本地演示模式'
  },

  async onShow() {
    await app.ensureReady();
    const orders = buildOrderView(await app.refreshOrders());
    this.setData({
      orders,
      hasOrders: orders.length > 0,
      cloudLabel: app.getCloudLabel()
    });
  }
});
