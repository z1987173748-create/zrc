(function () {
  const store = window.WebOrderStore;
  const state = {
    menu: [],
    category: '全部',
    keyword: '',
    cart: []
  };

  function cartCount() {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function filteredMenu() {
    return state.menu
      .filter((item) => item.enabled !== false)
      .filter((item) => state.category === '全部' || item.category === state.category)
      .filter((item) => !state.keyword || item.name.includes(state.keyword) || item.description.includes(state.keyword));
  }

  function renderCategories() {
    const categories = ['全部'].concat([...new Set(state.menu.filter((item) => item.enabled !== false).map((item) => item.category))]);
    const html = categories
      .map((name) => `<button class="chip ${name === state.category ? 'active' : ''}" data-category="${name}" type="button">${name}</button>`)
      .join('');
    document.getElementById('category-list').innerHTML = html;
  }

  function renderMenu() {
    const dishes = filteredMenu();
    const container = document.getElementById('dish-list');

    if (!dishes.length) {
      container.innerHTML = '<article class="card cart-panel empty-copy">没有匹配的菜品，试试换个关键词。</article>';
      return;
    }

    container.innerHTML = dishes.map((item) => {
      const soldOut = item.stock <= 0;
      return `
        <article class="card dish-card">
          <img src="${item.image}" alt="${item.name}" />
          <div class="dish-card-body">
            <div class="dish-card-top">
              <h3 class="dish-name">${item.name}</h3>
              <span class="price-text">${store.formatPrice(item.price)}</span>
            </div>
            <p class="dish-meta">${item.category} · 月售 ${item.sales} · 库存 ${item.stock}</p>
            <p class="dish-meta">${item.description}</p>
            <div class="tag-list">${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
            <div class="dish-card-actions">
              <span class="status-badge ${soldOut ? 'status-soldout' : 'status-enabled'}">${soldOut ? '已售罄' : '可下单'}</span>
              <button class="primary-button" data-add-id="${item.id}" type="button" ${soldOut ? 'disabled' : ''}>${soldOut ? '暂不可下单' : '加入购物车'}</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderCart() {
    const container = document.getElementById('cart-list');
    const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.getElementById('cart-count').textContent = String(cartCount());
    document.getElementById('cart-total').textContent = `¥${total.toFixed(2)}`;

    if (!state.cart.length) {
      container.className = 'cart-list empty-copy';
      container.textContent = '还没有加入菜品。';
      return;
    }

    container.className = 'cart-list';
    container.innerHTML = state.cart.map((item) => `
      <article class="cart-item">
        <div class="cart-row">
          <div>
            <h3 class="cart-name">${item.name}</h3>
            <p class="cart-meta">${store.formatPrice(item.price)} · 小计 ¥${(item.price * item.quantity).toFixed(2)}</p>
          </div>
          <div class="qty-controls">
            <button class="qty-button" data-qty-id="${item.id}" data-delta="-1" type="button">-</button>
            <strong>${item.quantity}</strong>
            <button class="qty-button" data-qty-id="${item.id}" data-delta="1" type="button">+</button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function renderOrders() {
    const orders = store.getOrders();
    const container = document.getElementById('customer-order-list');
    if (!orders.length) {
      container.className = 'order-list empty-copy';
      container.textContent = '还没有订单。';
      return;
    }

    container.className = 'order-list';
    container.innerHTML = orders.map((order) => {
      const statusClass = {
        '待接单': 'status-order-pending',
        '制作中': 'status-order-processing',
        '待取餐': 'status-order-pickup',
        '已完成': 'status-order-done'
      }[order.status] || 'status-order-done';

      return `
        <article class="order-item">
          <div class="cart-row">
            <div>
              <h3 class="cart-name">${order.id}</h3>
              <p class="order-meta">${order.createdAtText} · ${order.tableCode}</p>
            </div>
            <span class="status-badge ${statusClass}">${order.status}</span>
          </div>
          <p class="order-meta">${order.totalCount} 份 · ¥${order.totalAmount}</p>
          <p class="order-meta">备注：${order.note || '无备注'}</p>
          <p class="order-meta">${order.items.map((item) => `${item.name} x${item.quantity}`).join('，')}</p>
        </article>
      `;
    }).join('');
  }

  function syncCartWithMenu() {
    const menuMap = new Map(state.menu.map((item) => [item.id, item]));
    state.cart = state.cart
      .map((item) => {
        const latest = menuMap.get(item.id);
        if (!latest || latest.enabled === false) {
          return null;
        }
        return {
          ...item,
          name: latest.name,
          price: latest.price,
          image: latest.image
        };
      })
      .filter(Boolean);
    store.saveCart(state.cart);
  }

  function addToCart(id) {
    const dish = state.menu.find((item) => item.id === id && item.enabled !== false && item.stock > 0);
    if (!dish) {
      window.alert('该菜品当前不可下单。');
      return;
    }
    const existing = state.cart.find((item) => item.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        quantity: 1
      });
    }
    store.saveCart(state.cart);
    renderCart();
  }

  function changeQty(id, delta) {
    const target = state.cart.find((item) => item.id === id);
    if (!target) {
      return;
    }
    target.quantity += delta;
    state.cart = state.cart.filter((item) => item.quantity > 0);
    store.saveCart(state.cart);
    renderCart();
  }

  function submitOrder() {
    if (!state.cart.length) {
      window.alert('购物车还是空的。');
      return;
    }

    const menuMap = new Map(state.menu.map((item) => [item.id, item]));
    const invalid = state.cart.find((item) => {
      const latest = menuMap.get(item.id);
      return !latest || latest.enabled === false || latest.stock < item.quantity;
    });

    if (invalid) {
      window.alert(`${invalid.name} 的库存或上架状态已经变化，请刷新后重试。`);
      syncCartWithMenu();
      renderCart();
      return;
    }

    const note = document.getElementById('order-note').value.trim();
    const order = store.buildOrder(state.cart, note);
    const orders = [order].concat(store.getOrders());
    const nextMenu = state.menu.map((dish) => {
      const cartItem = state.cart.find((item) => item.id === dish.id);
      if (!cartItem) {
        return dish;
      }
      return {
        ...dish,
        stock: Math.max(0, dish.stock - cartItem.quantity)
      };
    });

    state.menu = nextMenu;
    state.cart = [];
    store.saveMenu(nextMenu);
    store.saveOrders(orders);
    store.saveCart([]);
    document.getElementById('order-note').value = '';

    renderCategories();
    renderMenu();
    renderCart();
    renderOrders();
    document.getElementById('customer-mode-label').textContent = '链接模式已开启，可直接分享网页。';
    window.alert('订单已提交。');
  }

  async function init() {
    state.menu = await store.getMenu();
    state.cart = store.getCart();
    syncCartWithMenu();
    document.getElementById('customer-mode-label').textContent = '链接模式已开启，可直接分享网页。';

    renderCategories();
    renderMenu();
    renderCart();
    renderOrders();

    document.getElementById('search-input').addEventListener('input', (event) => {
      state.keyword = event.target.value.trim();
      renderMenu();
    });

    document.getElementById('category-list').addEventListener('click', (event) => {
      const target = event.target.closest('[data-category]');
      if (!target) {
        return;
      }
      state.category = target.dataset.category;
      renderCategories();
      renderMenu();
    });

    document.getElementById('dish-list').addEventListener('click', (event) => {
      const target = event.target.closest('[data-add-id]');
      if (target) {
        addToCart(Number(target.dataset.addId));
      }
    });

    document.getElementById('cart-list').addEventListener('click', (event) => {
      const target = event.target.closest('[data-qty-id]');
      if (target) {
        changeQty(Number(target.dataset.qtyId), Number(target.dataset.delta));
      }
    });

    document.getElementById('clear-cart-button').addEventListener('click', () => {
      state.cart = [];
      store.saveCart([]);
      renderCart();
    });

    document.getElementById('submit-order-button').addEventListener('click', submitOrder);
  }

  init();
})();
