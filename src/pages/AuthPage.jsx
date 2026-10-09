import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/projects';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (mode === 'register' && !formData.name.trim()) newErrors.name = 'Введите имя';
    if (!formData.email.includes('@')) newErrors.email = 'Введите корректный email';
    if (formData.password.length < 6) newErrors.password = 'Минимум 6 символов';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');

    try {
      if (mode === 'login') {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link to="/" className="auth-logo">🏠 Дом по стилю</Link>
        <div className="auth-illustration">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800"
            alt="Интерьер"
          />
          <div className="auth-illustration-text">
            <h2>Создавайте интерьеры мечты</h2>
            <p>Сохраняйте проекты, возвращайтесь к ним в любой момент и делитесь с близкими</p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setErrors({}); setServerError(''); }}
            >
              Вход
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setErrors({}); setServerError(''); }}
            >
              Регистрация
            </button>
          </div>

          <h1 className="auth-title">
            {mode === 'login' ? 'С возвращением!' : 'Создать аккаунт'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Войдите, чтобы получить доступ к своим проектам'
              : 'Зарегистрируйтесь, чтобы сохранять свои дизайны'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="auth-field">
                <label>Имя</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Как вас зовут?"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  disabled={submitting}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
            )}

            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="example@mail.ru"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                disabled={submitting}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="auth-field">
              <label>Пароль</label>
              <input
                type="password"
                name="password"
                placeholder="Минимум 6 символов"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                disabled={submitting}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            {serverError && (
              <div className="server-error">{serverError}</div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting
                ? 'Подождите...'
                : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="auth-footer-text">
            {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button
              className="auth-link"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              type="button"
            >
              {mode === 'login' ? 'Зарегистрируйтесь' : 'Войдите'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}