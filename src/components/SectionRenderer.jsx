import React from 'react';
import HeroSection from './sections/HeroSection';
import ProductGridSection from './sections/ProductGridSection';
import FAQSection from './sections/FAQSection';
import TestimonialsSection from './sections/TestimonialsSection';
import EmailSubscribeSection from './sections/EmailSubscribeSection';

const SectionRenderer = ({ section }) => {
  if (!section || !section.is_active) {
    return null;
  }

  const { section_type, config } = section;

  switch (section_type) {
    case 'hero':
      return <HeroSection config={config || {}} section={section} />;
    
    case 'product_grid':
      return <ProductGridSection section={section} />;
    
    case 'faq':
      return <FAQSection config={config || {}} section={section} />;
    
    case 'testimonials':
      return <TestimonialsSection config={config || {}} section={section} />;
    
    case 'email_subscribe':
      return <EmailSubscribeSection config={config || {}} section={section} />;
    
    default:
      console.warn(`Unknown section type: ${section_type}`);
      return null;
  }
};

export default SectionRenderer;

