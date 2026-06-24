const app = getApp();

Page({
  data: {
    roleLabel: '顾客',
    cloudLabel: '本地演示模式'
  },

  async onShow() {
    await app.ensureReady();
    const role = app.getRole();
    this.setData({
      roleLabel: role === 'merchant' ? '商家' : '顾客',
      cloudLabel: app.getCloudLabel()
    });
  },

  enterCustomer() {
    app.saveRole('customer');
    wx.navigateTo({
      url: '/pages/home/index'
    });
  },

  enterMerchant() {
    app.saveRole('merchant');
    wx.navigateTo({
      url: '/pages/merchant/index'
    });
  }
});
