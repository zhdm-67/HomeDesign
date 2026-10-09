import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DesignerPage from './DesignerPage';
import Header from '../components/Header';
import { projectsApi } from '../api/client';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    projectsApi
      .get(id)
      .then(({ project }) => setProject(project))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-loader">Загрузка проекта...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page-container">
        <Header />
        <div className="empty-state" style={{ margin: '80px auto', maxWidth: 600 }}>
          <div className="empty-icon">🔍</div>
          <h2>Проект не найден</h2>
          <p>{error || 'Возможно, он был удалён или ссылка неверна'}</p>
          <button className="primary-btn" onClick={() => navigate('/projects')}>
            Вернуться к проектам
          </button>
        </div>
      </div>
    );
  }

  return <DesignerPage initialProject={project} />;
}