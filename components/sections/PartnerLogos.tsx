import { ExternalLink } from 'lucide-react';
import Image from 'next/image';

const partners = [
  {
    name: 'Work.ink',
    url: 'https://work.ink',
    image: '/images/partners/workink.webp',
  },
  {
    name: 'Lockr.so',
    url: 'https://lockr.so',
    image: '/images/partners/lockr.webp',
  },
  {
    name: 'PayPal',
    url: 'https://www.paypal.com',
    image: '/images/partners/paypal.png',
  },
  {
    name: 'Junkie',
    url: 'https://junkie-development.de/',
    image: '/images/partners/junkie.webp',
  },
  {
    name: 'Prometheus',
    url: 'https://github.com/levno-710/Prometheus',
    icon: '🔥', // Fallback if no image
  },
];

export default function PartnerLogos() {
  return (
    <section className="pt-8 pb-0 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-nowrap justify-center items-center gap-0 md:gap-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex-shrink-0 flex items-center justify-center grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300 -mx-3 md:-mx-6"
              title={partner.name}
            >
              {partner.image ? (
                <div className="relative h-10 w-32 md:h-12 md:w-44">
                  <img
                    src={partner.image}
                    alt={partner.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-2xl font-bold text-white transition-colors">
                  <span>{partner.icon}</span>
                  <span>{partner.name}</span>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
