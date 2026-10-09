import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { stylesApi, projectsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { calcCartTotal, calcCartCount, formatPrice } from '../utils/calc';

const CheckIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> );
const CloseIcon = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const SaveIcon  = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> );

export default function DesignerPage({ initialProject = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [styles, setStyles] = useState({});          // { scandinavian: {...}, loft: {...} }
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [stylesError, setStylesError] = useState('');

  const [currentStep, setCurrentStep] = useState(2);
  const [cart, setCart] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // --- Загрузка стилей с сервера ---
  useEffect(() => {
    setLoadingStyles(true);
    stylesApi
      .list()
      .then(({ styles: list }) => {
        const map = {};
        for (const s of list) map[s.slug] = s;
        setStyles(map);

        const initialSlug = initialProject?.styleSlug || list[0]?.slug;
        setSelectedStyle(initialSlug);
      })
      .catch((err) => setStylesError(err.message))
      .finally(() => setLoadingStyles(false));
  }, []);

  // --- Восстановление корзины, если открыли существующий проект ---
  useEffect(() => {
    if (initialProject?.items?.length) {
      setCart(initialProject.items.map(i => ({
        id: i.catalogItemId || i.id,
        name: i.name,
        price: Number(i.price) || 0,
        qty: Math.max(1, Number(i.qty) || 1),
        image: i.image,
      })));
    } else if (selectedStyle && styles[selectedStyle]) {
      // При первой загрузке — берём дефолтный набор из каталога
      const firstThree = styles[selectedStyle].catalog.slice(0, 3);
      setCart(firstThree.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        image: item.image,
      })));
    }
  }, [selectedStyle, styles, initialProject]);

  const currentStyleData = selectedStyle ? styles[selectedStyle] : null;
  const totalPrice = calcCartTotal(cart);
  const totalItems = calcCartCount(cart);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const addItemToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1, image: product.image }];
    });
  };

  const handleSaveProject = async () => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: '/' } } });
      return;
    }
    if (!currentStyleData) {
      setSaveError('Стиль не выбран');
      return;
    }
    if (cart.length === 0) {
      setSaveError('Добавьте хотя бы один предмет в проект');
      return;
    }

    setSaving(true);
    setSaveError('');

    const dateStr = new Date().toLocaleDateString('ru-RU');
    const projectName = initialProject?.name
      || `Проект "${currentStyleData.name}" от ${dateStr}`;

    // Формируем payload без использования сокращённых имён
    const payload = {
      name: projectName,
      roomType: 'Гостиная',
      styleId: currentStyleData.id,
      previewImage: currentStyleData.previewImage,
      items: cart.map((item) => ({
        catalogItemId: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image,
      })),
    };

    try {
      if (initialProject?.id) {
        await projectsApi.update(initialProject.id, payload);
      } else {
        await projectsApi.create(payload);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingStyles) return <div className="page-loader">Загрузка стилей...</div>;
  if (stylesError) return <div className="page-loader">Ошибка: {stylesError}</div>;
  if (!currentStyleData) return null;

  return (
    <div className="app-container">
      <Header showSteps={true} currentStep={currentStep} onStepClick={setCurrentStep} />

      <div className="main-content">
        <main className="preview-area">
          <div className="image-wrapper">
            <img src={currentStyleData.previewImage} alt={currentStyleData.name} />
          </div>
        </main>

        <aside className="sidebar">
          <div className="form-group">
            <label>Тип помещения</label>
            <div className="select-wrapper">
              <select defaultValue="Гостиная">
                <option>Гостиная</option>
                <option>Спальня</option>
                <option>Кухня</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>

          <div className="form-group">
            <label>Выберите стиль</label>
            <div className="style-grid">
              {Object.values(styles).map(style => (
                <div
                  key={style.slug}
                  className={`style-card ${selectedStyle === style.slug ? 'selected' : ''}`}
                  onClick={() => setSelectedStyle(style.slug)}
                >
                  <img src={style.thumbnail} alt={style.name} />
                  <div className="style-name">{style.name}</div>
                  {selectedStyle === style.slug && (
                    <div className="check-badge"><CheckIcon /></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="info-banner">
            <span className="info-icon">ⓘ</span>
            <p>{currentStyleData.infoText}</p>
          </div>

          <div className="catalog-section">
            <label>Каталог предметов</label>
            <div className="catalog-list">
              {currentStyleData.catalog.map(item => (
                <div key={item.id} className="catalog-item">
                  <img src={item.image} alt={item.name} className="catalog-img" />
                  <div className="catalog-info">
                    <h4>{item.name}</h4>
                    <p>{formatPrice(item.price)}</p>
                  </div>
                  <button onClick={() => addItemToCart(item)} className="add-btn">+</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer className="footer-bar">
        <div className="cart-section">
          <h3>Выбрано в проект</h3>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-img" />
                <div className="cart-info">
                  <h4>{item.name}</h4>
                  <p>{formatPrice(item.price)}</p>
                </div>
                <div className="qty-controls">
                  <button onClick={() => updateQty(item.id, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <button className="remove-btn" onClick={() => removeItem(item.id)}>
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-section">
          <div className="totals">
            <p className="item-count">
              {totalItems} {totalItems === 1 ? 'предмет' : totalItems < 5 ? 'предмета' : 'предметов'}
            </p>
            <p className="total-label">Итого</p>
            <p className="total-price">{formatPrice(totalPrice)}</p>
          </div>
          <button className="save-btn" onClick={handleSaveProject} disabled={saving}>
            <SaveIcon />
            <span className="save-btn-text">
              {saving ? 'Сохранение...' : initialProject ? 'Обновить проект' : 'Сохранить проект'}
            </span>
          </button>
        </div>
      </footer>

      {saveError && (
        <div className="toast toast-error">⚠ {saveError}</div>
      )}
      {showToast && (
        <div className="toast">
          ✓ Проект сохранён! <a href="/projects">Посмотреть мои проекты</a>
        </div>
      )}
    </div>
  );
}