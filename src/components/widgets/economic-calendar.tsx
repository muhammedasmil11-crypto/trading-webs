'use client';

import React, { useEffect, useRef } from 'react';

interface EconomicCalendarProps {
  theme?: 'dark' | 'light';
}

export default function EconomicCalendar({ theme = 'dark' }: EconomicCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isSquareLayout: false,
      width: '100%',
      height: '100%',
      locale: 'en',
      importanceFilter: '-1,0,1',
      countryFilter: 'us,eu,gb,jp,ca,au',
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);
  }, [theme]);

  return (
    <div className="w-full h-full min-h-[400px] border border-border-color rounded-xl overflow-hidden bg-bg-card-solid">
      <div ref={containerRef} className="w-full h-full" style={{ height: '100%' }} />
    </div>
  );
}
