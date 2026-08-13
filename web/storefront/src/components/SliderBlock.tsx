import { Swiper, SwiperSlide } from 'swiper/react';
import {
  Autoplay, Navigation, Pagination,
  EffectFade, EffectCards, EffectCoverflow, EffectCube, EffectFlip, Grid,
} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-coverflow';
import 'swiper/css/effect-cube';
import 'swiper/css/effect-flip';
import 'swiper/css/grid';
import '../styles/islands.css';
import { useStorefront } from '../lib/storefront';
import { openProduct } from '../lib/store';
import type { SliderSection, SlideLink, SliderType } from '../lib/data';

function swiperConfig(type: SliderType, count: number) {
  const loop = count > 1;
  const autoplay = count > 1 ? { delay: 5200, disableOnInteraction: false, pauseOnMouseEnter: true } : false;
  const navigation = count > 1;
  const speed = 650;
  switch (type) {
    case 'horizontal':
      return { modules: [Autoplay, Pagination, Navigation], autoplay, loop, pagination: { clickable: true }, navigation, speed, spaceBetween: 0 };
    case 'vertical':
      return { modules: [Autoplay, Pagination, Navigation], direction: 'vertical' as const, autoplay, loop, pagination: { clickable: true }, navigation, speed, spaceBetween: 0 };
    case 'fade':
      return { modules: [Autoplay, Pagination, Navigation, EffectFade], effect: 'fade' as const, autoplay, loop, pagination: { clickable: true }, navigation, speed: 800 };
    case 'cards':
      return { modules: [Autoplay, Navigation, EffectCards], effect: 'cards' as const, autoplay, loop, navigation, speed: 600 };
    case 'coverflow':
      return {
        modules: [Autoplay, Navigation, EffectCoverflow], effect: 'coverflow' as const, grabCursor: true,
        centeredSlides: true, slidesPerView: 'auto' as const,
        coverflowEffect: { rotate: 0, stretch: 0, depth: 120, modifier: 1.5, slideShadows: true },
        autoplay, loop, navigation, speed: 700,
      };
    case 'cube':
      return {
        modules: [Autoplay, Navigation, EffectCube], effect: 'cube' as const,
        cubeEffect: { shadow: true, slideShadows: true, shadowOffset: 20, shadowScale: 0.94 },
        autoplay, loop, navigation, speed: 800,
      };
    case 'flip':
      return { modules: [Autoplay, Navigation, EffectFlip], effect: 'flip' as const, flipEffect: { slideShadows: false }, autoplay, loop, navigation, speed: 700 };
    case 'grid': {
      const rows = 2;
      const perView = count >= 6 ? 3 : Math.max(1, Math.min(3, Math.ceil(count / rows)));
      return {
        modules: [Autoplay, Navigation, Pagination, Grid], slidesPerView: perView, grid: { rows, fill: 'row' as const },
        autoplay, loop: count >= perView * rows, pagination: { clickable: true }, navigation, speed: 600, spaceBetween: 12,
      };
    }
  }
}

export default function SliderBlock({ section }: { section: SliderSection }) {
  const { products } = useStorefront();
  const slides = (section.slides || []).filter(s => s && s.imageUrl);

  const go = (link: SlideLink) => {
    if (link.linkType === 'category') {
      window.dispatchEvent(new CustomEvent('category:filter', { detail: { name: link.categoryName } }));
      const el = document.getElementById('shop') || document.querySelector('[data-sec-categories]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (link.linkType === 'product') {
      const p = products.find(x => String(x.id) === String(link.productId));
      if (p) openProduct(p);
    } else if (link.linkType === 'url') {
      const u = link.url || '';
      if (u.startsWith('#')) {
        const el = document.getElementById(u.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (u) {
        window.location.href = u;
      }
    }
  };

  const cfg = swiperConfig(section.type, slides.length);

  return (
    <div className={`slider-block${section.hero ? ' slider-hero' : ''}`} data-edit-slider={section.id} data-edit-sec={section.id}>
      {slides.length > 0 ? (
        <Swiper {...cfg}>
          {slides.map(s => (
            <SwiperSlide key={s.id}>
              <div
                className="sl-slide"
                onClick={() => go(s.link)}
                onKeyDown={e => { if (e.key === 'Enter') go(s.link); }}
                role="link"
                tabIndex={0}
              >
                <img src={s.imageUrl} alt={s.label || 'Slider'} loading="lazy" draggable={false} />
                {s.label ? <span className="sl-label">{s.label}</span> : null}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="sl-empty">+</div>
      )}
    </div>
  );
}
