import React, { useState, useEffect } from 'react';
import SectionRenderer from '../components/SectionRenderer';

const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Home = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSections();
  }, []);

  const fetchActiveSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/landing-page-sections/active`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sections) {
          setSections(data.sections);
        }
      }
    } catch (error) {
      console.error('Error fetching landing page sections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {sections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No sections available at the moment.</p>
        </div>
      ) : (
        sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))
      )}
    </div>
  );
};

export default Home;