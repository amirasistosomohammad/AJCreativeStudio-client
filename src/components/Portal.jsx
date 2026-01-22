// components/Portal.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Prevent body scroll when portal is mounted
    document.body.style.overflow = 'hidden';
    // Add class to body for CSS targeting
    document.body.classList.add('modal-open');
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    children,
    document.body
  );
};

export default Portal;

