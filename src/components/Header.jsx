import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ... SVG-иконки HomeIcon, HelpIcon, UserIcon — без изменений
const HomeIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline><path d="M12 6v3"></path></svg> );
const HelpIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> );
const UserIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> );

export default function Header({ showSteps = false, currentStep = 1, onStepClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const renderStep = (number, label) => {
    const isActive = currentStep === number;
    const isDone = currentStep > number;
    return (
      <div
        className={`step ${isActive ? 'active' : 'inactive'} ${isDone ? 'done' : ''}`}
        onClick={() => onStepClick && onStepClick(number)}
        style={{ cursor: onStepClick ? 'pointer' : 'default' }}
      >
        <span className="step-number">{isDone ? '✓' : number}</span>
        <span className="step-label">{label}</span>
      </div>
    );
  };

  return (
    <header className="header">
      <Link to="/" className="logo-section">
        <div className="logo-icon"><HomeIcon /></div>
        <div className="logo-text">
          <h1>Дом по стилю</h1>
          <p>создайте интерьер мечты</p>
        </div>
      </Link>

      <nav className="main-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>
          Дизайнер
        </NavLink>
        {user && (
          <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>
            Мои проекты
          </NavLink>
        )}
      </nav>

      {showSteps && (
        <div className="steps-container">
          {renderStep(1, '1. Помещение')}
          <div className="step-line"></div>
          {renderStep(2, '2. Стиль')}
          <div className="step-line"></div>
          {renderStep(3, '3. Предметы')}
        </div>
      )}

      <div className="header-actions">
        <button className="icon-btn help-btn"><HelpIcon /></button>

        {user ? (
          <div className="user-menu-wrapper">
            <button
              className="icon-btn user-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              title={user.name}
            >
              <UserIcon />
            </button>
            {menuOpen && (
              <>
                <div className="user-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="user-menu">
                  <div className="user-menu-header">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button
                    className="user-menu-item"
                    onClick={() => { setMenuOpen(false); navigate('/projects'); }}
                  >
                    Мои проекты
                  </button>
                  <button
                    className="user-menu-item user-menu-logout"
                    onClick={() => { setMenuOpen(false); logout(); navigate('/'); }}
                  >
                    Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            className="icon-btn user-btn"
            onClick={() => navigate('/auth')}
            title="Войти"
          >
            <UserIcon />
          </button>
        )}
      </div>
    </header>
  );
}