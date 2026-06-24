(function () {
  const MENU_KEY = 'smart-order-web-menu';
  const ORDER_KEY = 'smart-order-web-orders';
  const CART_KEY = 'smart-order-web-cart';

  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  async function getMenu() {
    const cache = read(MENU_KEY, null);
    if (cache && cache.length) {
      return cache;
    }

    const menu = Array.isArray(window.WebMenuData) ? window.WebMenuData : [];
    write(MENU_KEY, menu);
    return menu;
  }

  function saveMenu(menu) {
    write(MENU_KEY, menu);
  }

  function getOrders() {
    return read(ORDER_KEY, []);
  }

  function saveOrders(orders) {
    write(ORDER_KEY, orders);
  }

  function getCart() {
    return read(CART_KEY, []);
  }

  function saveCart(cart) {
    write(CART_KEY, cart);
  }

  function formatPrice(value) {
    return `¥${Number(value).toFixed(0)}`;
  }

  function buildOrder(cart, note) {
    const now = new Date();
    const items = cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      subtotal: Number((item.price * item.quantity).toFixed(2))
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: `OD${now.getTime()}`,
      items,
      note,
      status: '待接单',
      totalAmount: Number(totalAmount.toFixed(2)),
      totalCount,
      tableCode: `A${Math.floor(Math.random() * 18) + 1}`,
      createdAtText: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    };
  }

  window.WebOrderStore = {
    getMenu,
    saveMenu,
    getOrders,
    saveOrders,
    getCart,
    saveCart,
    formatPrice,
    buildOrder
  };
})();
