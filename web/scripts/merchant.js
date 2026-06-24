(function () {
  const store = window.WebOrderStore;
  const state = {
    menu: [],
    orders: [],
    keyword: ''
  };

  function renderMetrics() {
    const pending = state.orders.filter((item) => item.status === '待接单').length;
    const processing = state.orders.filter((item) => item.status === '制作中' || item.status === '待取餐').length;
    const enabled = state.menu.filter((item) => item.enabled !== false).length;
    const revenue = state.orders.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

    document.getElementById('metric-pending').textContent = String(pending);
    document.getElementById('metric-processing').textContent = String(processing);
    document.getElementById('metric-enabled').textContent = String(enabled);
    document.getElementById('metric-revenue').textContent = `¥${revenue.toFixed(2)}`;
  }

  function renderOrders() {
    const container = document.getElementById('merchant-order-list');
    if (!state.orders.length) {
      container.className = 'order-list empty-copy';
      container.textContent = '还没有顾客订单。';
      return;
    }

    container.className = 'order-list';
    container.innerHTML = state.orders.map((order) => {
      const buttonText = {
        '待接单': '确认接单',
        '制作中': '标记待取餐',
        '待取餐': '完成订单'
      }[order.status];

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
          <p class="order-meta">菜品：${order.items.map((item) => `${item.name} x${item.quantity}`).join('，')}</p>
          <p class="order-meta">备注：${order.note || '无备注'}</p>
          ${buttonText ? `<div class="panel-actions"><button class="primary-button" data-advance-id="${order.id}" type="button">${buttonText}</button></div>` : ''}
        </article>
      `;
    }).join('');
  }

  function renderMenu() {
    const container = document.getElementById('merchant-dish-list');
    const list = state.menu.filter((item) => !state.keyword || item.name.includes(state.keyword) || item.description.includes(state.keyword));

    container.innerHTML = list.map((item) => `
      <article class="merchant-dish-item">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <div class="merchant-dish-top">
            <div>
              <h3 class="merchant-dish-name">${item.name}</h3>
              <p class="merchant-dish-meta">${item.category} · 月售 ${item.sales} · 当前库存 ${item.stock}</p>
            </div>
            <span class="status-badge ${item.enabled !== false ? 'status-enabled' : 'status-disabled'}">${item.enabled !== false ? '上架中' : '已下架'}</span>
          </div>
          <div class="field-grid">
            <label>
              <span class="field-label">价格</span>
              <input class="field-input" data-field="price" data-id="${item.id}" type="number" min="0" value="${item.price}" />
            </label>
            <label>
              <span class="field-label">库存</span>
              <input class="field-input" data-field="stock" data-id="${item.id}" type="number" min="0" value="${item.stock}" />
            </label>
            <label class="field-input full">
              <span class="field-label">菜品说明</span>
              <textarea class="field-input" data-field="description" data-id="${item.id}" rows="3">${item.description}</textarea>
            </label>
            <label class="field-input full">
              <span class="field-label">图片链接</span>
              <input class="field-input" data-field="image" data-id="${item.id}" type="url" value="${item.image}" />
            </label>
          </div>
          <div class="merchant-dish-actions">
            <label class="inline-switch">
              <input data-field="enabled" data-id="${item.id}" type="checkbox" ${item.enabled !== false ? 'checked' : ''} />
              <span>允许下单</span>
            </label>
            <button class="primary-button" data-save-id="${item.id}" type="button">保存菜品</button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function advanceOrder(id) {
    const nextStatus = {
      '待接单': '制作中',
      '制作中': '待取餐',
      '待取餐': '已完成'
    };
    state.orders = state.orders.map((order) => (
      order.id === id && nextStatus[order.status]
        ? { ...order, status: nextStatus[order.status] }
        : order
    ));
    store.saveOrders(state.orders);
    renderMetrics();
    renderOrders();
  }

  function saveDish(id) {
    const card = document.querySelector(`[data-save-id="${id}"]`).closest('.merchant-dish-item');
    const price = Number(card.querySelector('[data-field="price"]').value);
    const stock = Number(card.querySelector('[data-field="stock"]').value);
    const description = card.querySelector('[data-field="description"]').value.trim();
    const image = card.querySelector('[data-field="image"]').value.trim();
    const enabled = card.querySelector('[data-field="enabled"]').checked;

    state.menu = state.menu.map((item) => (
      item.id === id
        ? {
            ...item,
            price,
            stock,
            description,
            image: image || item.image,
            enabled
          }
        : item
    ));

    store.saveMenu(state.menu);
    renderMetrics();
    renderMenu();
    window.alert('菜品已保存。');
  }

  async function init() {
    state.menu = await store.getMenu();
    state.orders = store.getOrders();
    renderMetrics();
    renderOrders();
    renderMenu();

    document.getElementById('merchant-search-input').addEventListener('input', (event) => {
      state.keyword = event.target.value.trim();
      renderMenu();
    });

    document.getElementById('merchant-order-list').addEventListener('click', (event) => {
      const target = event.target.closest('[data-advance-id]');
      if (target) {
        advanceOrder(target.dataset.advanceId);
      }
    });

    document.getElementById('merchant-dish-list').addEventListener('click', (event) => {
      const target = event.target.closest('[data-save-id]');
      if (target) {
        saveDish(Number(target.dataset.saveId));
      }
    });
  }

  init();
})();
