function buildOrder(cartItems, note) {
  const items = cartItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    subtotal: Number((item.price * item.quantity).toFixed(2))
  }));

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const createdAt = new Date();

  return {
    id: `OD${createdAt.getTime()}`,
    items,
    note,
    totalCount,
    totalAmount: Number(totalAmount.toFixed(2)),
    status: '待接单',
    createdAtText: `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`,
    customerName: '堂食顾客',
    tableCode: `A${Math.floor(Math.random() * 18) + 1}`
  };
}

module.exports = {
  buildOrder
};
