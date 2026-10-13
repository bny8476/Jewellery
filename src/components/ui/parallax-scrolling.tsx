'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { Gem } from 'lucide-react';

export interface ParallaxComponentProps {
  title?: string;
  subtitle?: string;
  layer1Image?: string;
  layer2Image?: string;
  layer4Image?: string;
  showContent?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ParallaxComponent({
  title = "Parallax",
  subtitle,
  layer1Image = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80",
  layer2Image = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1920&q=80",
  layer4Image = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1920&q=80",
  showContent = true,
  className = "",
  children,
}: ParallaxComponentProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0
        }
      });

      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 }
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: "none"
          },
          idx === 0 ? undefined : "<"
        );
      });
    }

    const lenis = new Lenis();
    const handleScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on('scroll', handleScroll);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      // Clean up GSAP and ScrollTrigger instances
      ScrollTrigger.getAll().forEach(st => st.kill());
      if (triggerElement) {
        gsap.killTweensOf(triggerElement);
      }
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <div className={`parallax ${className}`} ref={parallaxRef}>
      <section className="parallax__header">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow"></div>
          <div data-parallax-layers className="parallax__layers">
            <img
              src={layer1Image}
              loading="eager"
              width="800"
              data-parallax-layer="1"
              alt=""
              className="parallax__layer-img"
            />
            <img
              src={layer2Image}
              loading="eager"
              width="800"
              data-parallax-layer="2"
              alt=""
              className="parallax__layer-img opacity-90"
            />
            <div data-parallax-layer="3" className="parallax__layer-title">
              <div className="text-center px-4 space-y-2">
                {subtitle && (
                  <p className="text-xs sm:text-sm font-sans font-semibold tracking-[0.25em] text-[#C69A8B] uppercase">
                    {subtitle}
                  </p>
                )}
                <h2 className="parallax__title">{title}</h2>
              </div>
            </div>
            <img
              src={layer4Image}
              loading="eager"
              width="800"
              data-parallax-layer="4"
              alt=""
              className="parallax__layer-img opacity-85"
            />
          </div>
          <div className="parallax__fade"></div>
        </div>
      </section>

      {showContent && (
        <section className="parallax__content">
          {children ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <Gem className="w-12 h-12 text-[#C69A8B] animate-pulse" />
              <span className="text-xs font-sans tracking-widest text-[#DFC0B5] uppercase">
                Artistry In Every Detail
              </span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default ParallaxComponent;
