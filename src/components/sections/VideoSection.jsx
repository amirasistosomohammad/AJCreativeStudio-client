import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const VideoSection = ({ config, section }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const title = config.title || section?.title || 'Learn with Confidence';
  const description = config.description || section?.description || 'Each digital product comes with an in-depth video walkthrough to ensure you get started smoothly.';
  const videoUrl = config.videoUrl || '';
  const thumbnailImage = config.thumbnailImage || '';
  const buttonText = config.buttonText || 'Browse Our Video Tutorials';
  const buttonLink = config.buttonLink || '#';
  const backgroundColor = config.backgroundColor || '#F3F3F3';

  return (
    <section
      ref={sectionRef}
      className="video-tutorials-section"
      style={{
        padding: '4rem clamp(1rem, 8vw, 200px)',
        backgroundColor: backgroundColor,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600,
            color: '#000',
            textAlign: 'center',
            marginBottom: '1.5rem',
            marginTop: 0,
          }}
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
            color: '#333',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: '1.6',
            marginBottom: '3rem',
            marginTop: 0,
          }}
        >
          {description}
        </motion.p>

        {(thumbnailImage || videoUrl) && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            style={{
              width: '100%',
              maxWidth: '800px',
              marginBottom: '3rem',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}
          >
            {videoUrl ? (
              <iframe
                width="100%"
                height="450"
                src={videoUrl}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ display: 'block' }}
              />
            ) : (
              <img
                src={thumbnailImage}
                alt="Video tutorial"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            )}
          </motion.div>
        )}

        {buttonText && (
          <motion.div
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              marginTop: '1rem',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-50px' }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          >
            <motion.button
              whileHover={{ y: -2, backgroundColor: '#222222' }}
              whileTap={{ y: 0 }}
              type="button"
              onClick={() => {
                if (buttonLink && buttonLink !== '#') {
                  window.open(buttonLink, '_blank');
                }
              }}
              style={{
                padding: '0.9rem 1.5rem',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.98rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {buttonText}
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default VideoSection;

