import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { projectsApi } from '../api/client';
import { formatPrice, safeNum } from '../utils/calc';

const TrashIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = () => {
    setLoading(true);
    setError('');
    projectsApi
      .list()
      .then(({ projects }) => setProjects(projects))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const formatDate = (isoString) => {
    if (!isoString) return 'Дата неизвестна';
    return new Date(isoString).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await projectsApi.remove(projectToDelete.id);
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <Header />

      <main className="page-content">
        <div className="page-title-block">
          <div>
            <h1 className="page-title">Мои проекты</h1>
            <p className="page-subtitle">
              {projects.length > 0
                ? `У вас ${projects.length} ${projects.length === 1 ? 'проект' : projects.length < 5 ? 'проекта' : 'проектов'}`
                : 'Сохранённые дизайны интерьера'}
            </p>
          </div>
          <button className="primary-btn" onClick={() => navigate('/')}>
            + Создать новый проект
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Загрузка проектов...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <h2>Не удалось загрузить проекты</h2>
            <p>{error}</p>
            <button className="primary-btn" onClick={loadProjects}>Повторить</button>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h2>Пока нет сохранённых проектов</h2>
            <p>Создайте свой первый дизайн интерьера с помощью нашего конструктора</p>
            <button className="primary-btn" onClick={() => navigate('/')}>
              Начать создание
            </button>
          </div>
        ) : (
          <div className="projects-scroll-area">
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-image">
                    <img src={project.previewImage} alt={project.name} />
                    <div className="project-style-badge">
                      {project.style || 'Без стиля'}
                    </div>
                    <button
                      className="project-delete-icon"
                      onClick={() => setProjectToDelete(project)}
                      title="Удалить проект"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="project-info">
                    <h3>{project.name}</h3>
                    <p className="project-date">Создан: {formatDate(project.createdAt)}</p>
                    <div className="project-footer">
                      <span className="project-items">
                        {project.itemsCount} {project.itemsCount === 1 ? 'предмет' : project.itemsCount < 5 ? 'предмета' : 'предметов'}
                      </span>
                      <span className="project-price">{formatPrice(project.totalPrice)}</span>
                    </div>
                  </div>
                  <div className="project-actions">
                    <button
                      className="project-action-btn"
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      Открыть
                    </button>
                    <button
                      className="project-delete-btn"
                      onClick={() => setProjectToDelete(project)}
                      title="Удалить проект"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {projectToDelete && (
        <div className="modal-overlay" onClick={() => !deleting && setProjectToDelete(null)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-warning">⚠</div>
            <h3 className="modal-title">Удалить проект?</h3>
            <p className="modal-text">
              Проект <strong>«{projectToDelete.name}»</strong> будет удалён безвозвратно.
              Это действие нельзя отменить.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setProjectToDelete(null)}
                disabled={deleting}
              >
                Отмена
              </button>
              <button
                className="modal-btn modal-btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}