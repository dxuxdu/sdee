import { getRecentTestimonials } from '@/lib/testimonials';
import TestimonialsMarquee from './TestimonialsMarquee';

export default async function Testimonials() {
  // Fetch data on session start/request
  const testimonials = await getRecentTestimonials();
  
  if (!testimonials || testimonials.length === 0) {
      return null;
  }

  return <TestimonialsMarquee initialTestimonials={testimonials} />;
}
