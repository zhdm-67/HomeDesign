export const safeNum = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

export const calcItemTotal = (item) => {
    if (!item) return 0;
    return safeNum(item.price) * Math.max(1, safeNum(item.qty));
};

export const calcCartTotal = (cart) => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => calcItemTotal(item), 0);
}

export const calcCartCount = (cart) => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + Math.max(1, safeNum(item.qty)), 0);
};

export const restoreCart = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .filter(item => item && item.id) // убираем битые элементы
    .map(item => ({
      id: safeNum(item.id),
      name: item.name || 'Без названия',
      price: safeNum(item.price),
      qty: Math.max(1, safeNum(item.qty) || 1),
      image: item.image || '',
    }));
};

export const formatPrice = (price) => {
  const safe = safeNum(price);
  return new Intl.NumberFormat('ru-RU').format(safe) + ' BYN';
};