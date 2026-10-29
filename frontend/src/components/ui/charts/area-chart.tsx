import React, { createContext, useContext, useState, useRef, useMemo, useEffect } from 'react';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { extent, max, min } from 'd3-array';

export interface ChartDataPoint {
  date: Date | string | number;
  [key: string]: any;
}

export interface AreaSeriesConfig {
  dataKey: string;
  name?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  unit?: string;
  formatter?: (val: number) => string;
}

interface AreaChartContextValue {
  data: ChartDataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xScale: any;
  yScale: any;
  hoverIndex: number | null;
  hoverPoint: ChartDataPoint | null;
  hoverCoords: { x: number; y: number } | null;
  setHover: (index: number | null, point: ChartDataPoint | null, coords: { x: number; y: number } | null) => void;
  uniqueId: string;
  xAccessor: (d: ChartDataPoint) => Date;
  yDomain?: [number, number];
}

const AreaChartContext = createContext<AreaChartContextValue | null>(null);

export function useChart() {
  const ctx = useContext(AreaChartContext);
  if (!ctx) throw new Error('Chart subcomponents must be used inside <AreaChart>');
  return ctx;
}

/* ========================================================================= */
/* 1. AreaChart Root Container                                               */
/* ========================================================================= */
export interface AreaChartProps {
  data: ChartDataPoint[];
  margin?: Partial<{ top: number; right: number; bottom: number; left: number }>;
  yDomain?: [number, number];
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  margin: customMargin,
  yDomain: customYDomain,
  className = '',
  style,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPoint, setHoverPoint] = useState<ChartDataPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const uniqueId = useMemo(() => `area-chart-${Math.random().toString(36).substring(2, 9)}`, []);

  const margin = useMemo(
    () => ({
      top: customMargin?.top ?? 20,
      right: customMargin?.right ?? 24,
      bottom: customMargin?.bottom ?? 36,
      left: customMargin?.left ?? 24,
    }),
    [customMargin]
  );

  // ResizeObserver for dynamic responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        setDimensions({
          width: Math.max(200, Math.floor(entry.contentRect.width)),
          height: Math.max(160, Math.floor(entry.contentRect.height)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const xAccessor = (d: ChartDataPoint) =>
    d.date instanceof Date ? d.date : new Date(d.date);

  // Scales calculation
  const { xScale, yScale } = useMemo(() => {
    const xDates = data.map(xAccessor);
    const xMinMax = extent(xDates) as [Date, Date];

    const innerWidth = Math.max(10, dimensions.width - margin.left - margin.right);

    const xSc = scaleTime({
      range: [margin.left, margin.left + innerWidth],
      domain: xMinMax[0] && xMinMax[1] ? xMinMax : [new Date(), new Date()],
    });

    let yMin = customYDomain ? customYDomain[0] : 0;
    let yMax = customYDomain ? customYDomain[1] : 100;

    if (!customYDomain) {
      // Find max across all numeric fields
      const numericVals: number[] = [];
      data.forEach((d) => {
        Object.entries(d).forEach(([k, v]) => {
          if (k !== 'date' && typeof v === 'number' && !isNaN(v)) {
            numericVals.push(v);
          }
        });
      });
      const dataMin = min(numericVals) ?? 0;
      const dataMax = max(numericVals) ?? 100;
      const padding = (dataMax - dataMin) * 0.1 || 10;
      yMin = Math.max(0, dataMin - padding);
      yMax = dataMax + padding;
    }

    const ySc = scaleLinear({
      range: [dimensions.height - margin.bottom, margin.top],
      domain: [yMin, yMax],
      nice: true,
    });

    return { xScale: xSc, yScale: ySc };
  }, [data, dimensions, margin, customYDomain]);

  // Pointer move handler for tooltip crosshair
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < margin.left || x > dimensions.width - margin.right) {
      setHoverIndex(null);
      setHoverPoint(null);
      setHoverCoords(null);
      return;
    }

    // Invert x to date
    const hoveredDate = xScale.invert(x).getTime();
    let closestIdx = 0;
    let minDiff = Infinity;

    for (let i = 0; i < data.length; i++) {
      const pointTime = xAccessor(data[i]).getTime();
      const diff = Math.abs(pointTime - hoveredDate);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    const point = data[closestIdx];
    const snapX = xScale(xAccessor(point));
    setHoverIndex(closestIdx);
    setHoverPoint(point);
    setHoverCoords({ x: snapX, y });
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
    setHoverPoint(null);
    setHoverCoords(null);
  };

  const ctxValue: AreaChartContextValue = {
    data,
    width: dimensions.width,
    height: dimensions.height,
    margin,
    xScale,
    yScale,
    hoverIndex,
    hoverPoint,
    hoverCoords,
    setHover: (idx, pt, coords) => {
      setHoverIndex(idx);
      setHoverPoint(pt);
      setHoverCoords(coords);
    },
    uniqueId,
    xAccessor,
    yDomain: customYDomain,
  };

  return (
    <AreaChartContext.Provider value={ctxValue}>
      <div
        ref={containerRef}
        className={`relative w-full select-none ${className}`}
        style={{ ...style, height: style?.height || 340 }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="overflow-visible block"
        >
          {children}
        </svg>
      </div>
    </AreaChartContext.Provider>
  );
};

/* ========================================================================= */
/* 2. Grid Component                                                         */
/* ========================================================================= */
export interface GridProps {
  horizontal?: boolean;
  vertical?: boolean;
  numTicks?: number;
  stroke?: string;
  strokeDasharray?: string;
}

export const Grid: React.FC<GridProps> = ({
  horizontal = true,
  vertical = false,
  numTicks = 5,
  stroke = 'currentColor',
  strokeDasharray = '4 4',
}) => {
  const { width, height, margin, yScale, xScale } = useChart();

  const yTicks = horizontal && yScale.ticks ? yScale.ticks(numTicks) : [];
  const xTicks = vertical && xScale.ticks ? xScale.ticks(numTicks) : [];

  return (
    <g className="chart-grid opacity-15 dark:opacity-20 pointer-events-none">
      {horizontal &&
        yTicks.map((val: number, i: number) => {
          const y = yScale(val);
          return (
            <line
              key={`h-grid-${i}`}
              x1={margin.left}
              x2={width - margin.right}
              y1={y}
              y2={y}
              stroke={stroke}
              strokeWidth={1}
              strokeDasharray={strokeDasharray}
            />
          );
        })}
      {vertical &&
        xTicks.map((val: Date, i: number) => {
          const x = xScale(val);
          return (
            <line
              key={`v-grid-${i}`}
              x1={x}
              x2={x}
              y1={margin.top}
              y2={height - margin.bottom}
              stroke={stroke}
              strokeWidth={1}
              strokeDasharray={strokeDasharray}
            />
          );
        })}
    </g>
  );
};

/* ========================================================================= */
/* 3. Area Component                                                         */
/* ========================================================================= */
export interface AreaProps {
  dataKey: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  gradientFromOpacity?: number;
  gradientToOpacity?: number;
  curve?: any;
  showDotOnHover?: boolean;
}

export const Area: React.FC<AreaProps> = ({
  dataKey,
  fill = '#F59E0B',
  stroke = '#F59E0B',
  strokeWidth = 2.5,
  fillOpacity = 0.25,
  gradientFromOpacity = 0.45,
  gradientToOpacity = 0.02,
  curve = curveMonotoneX,
  showDotOnHover = true,
}) => {
  const { data, height, margin, xScale, yScale, xAccessor, uniqueId, hoverPoint } = useChart();

  const gradientId = `${uniqueId}-gradient-${dataKey}`;

  const getX = (d: ChartDataPoint) => xScale(xAccessor(d));
  const getY = (d: ChartDataPoint) => yScale(d[dataKey] ?? 0);
  const y0 = height - margin.bottom;

  // Hover indicator coordinates
  const hoverDotCoords = useMemo(() => {
    if (!hoverPoint || hoverPoint[dataKey] === undefined) return null;
    return {
      x: getX(hoverPoint),
      y: getY(hoverPoint),
      val: hoverPoint[dataKey],
    };
  }, [hoverPoint, dataKey]);

  return (
    <g className={`chart-area-series-${dataKey}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={gradientFromOpacity} />
          <stop offset="65%" stopColor={fill} stopOpacity={gradientFromOpacity * 0.4} />
          <stop offset="100%" stopColor={fill} stopOpacity={gradientToOpacity} />
        </linearGradient>
      </defs>

      {/* Filled Area */}
      <AreaClosed
        data={data}
        x={getX}
        y={getY}
        y0={y0}
        yScale={yScale}
        curve={curve}
        fill={`url(#${gradientId})`}
        fillOpacity={fillOpacity}
        className="transition-opacity duration-300"
      />

      {/* Top Line Contour */}
      <LinePath
        data={data}
        x={getX}
        y={getY}
        curve={curve}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />

      {/* Hover Pinpoint Circle */}
      {showDotOnHover && hoverDotCoords && (
        <g className="pointer-events-none">
          <circle
            cx={hoverDotCoords.x}
            cy={hoverDotCoords.y}
            r={7}
            fill={stroke}
            fillOpacity={0.25}
            className="animate-ping"
          />
          <circle
            cx={hoverDotCoords.x}
            cy={hoverDotCoords.y}
            r={5}
            fill="#FFFFFF"
            stroke={stroke}
            strokeWidth={2.5}
            className="shadow-sm"
          />
        </g>
      )}
    </g>
  );
};

/* ========================================================================= */
/* 4. XAxis Component                                                        */
/* ========================================================================= */
export interface XAxisProps {
  numTicks?: number;
  formatTick?: (date: Date) => string;
  className?: string;
}

export const XAxis: React.FC<XAxisProps> = ({
  numTicks = 6,
  formatTick = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  className = '',
}) => {
  const { xScale, height, margin } = useChart();
  const ticks = xScale.ticks ? xScale.ticks(numTicks) : [];

  return (
    <g
      className={`chart-xaxis ${className}`}
      transform={`translate(0, ${height - margin.bottom + 14})`}
    >
      {ticks.map((t: Date, idx: number) => {
        const x = xScale(t);
        return (
          <text
            key={`x-tick-${idx}`}
            x={x}
            y={0}
            textAnchor="middle"
            className="fill-stone-600 dark:fill-stone-400 text-[10px] font-medium tracking-wide"
          >
            {formatTick(t)}
          </text>
        );
      })}
    </g>
  );
};

/* ========================================================================= */
/* 5. ChartTooltip Component                                                 */
/* ========================================================================= */
export interface AreaChartTooltipProps {
  series?: Array<{
    dataKey: string;
    name: string;
    color: string;
    unit?: string;
    formatter?: (val: number) => string;
  }>;
  children?: (props: { point: ChartDataPoint; coords: { x: number; y: number } }) => React.ReactNode;
}

export const AreaChartTooltip: React.FC<AreaChartTooltipProps> = ({
  series = [],
  children,
}) => {
  const { hoverPoint, hoverCoords, width, height, margin } = useChart();

  if (!hoverPoint || !hoverCoords) return null;

  const tooltipWidth = 220;
  const tooltipHeight = 44 + series.length * 24;

  // Clamp tooltip position inside svg
  let left = hoverCoords.x + 14;
  if (left + tooltipWidth > width - margin.right) {
    left = hoverCoords.x - tooltipWidth - 14;
  }
  let top = Math.max(margin.top, Math.min(hoverCoords.y - tooltipHeight / 2, height - margin.bottom - tooltipHeight));

  const dateObj = hoverPoint.date instanceof Date ? hoverPoint.date : new Date(hoverPoint.date);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <g className="pointer-events-none">
      {/* Vertical Crosshair Line */}
      <line
        x1={hoverCoords.x}
        x2={hoverCoords.x}
        y1={margin.top}
        y2={height - margin.bottom}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        className="text-stone-400 dark:text-stone-600 opacity-80"
      />

      {/* Floating HTML Tooltip */}
      <foreignObject
        x={left}
        y={top}
        width={tooltipWidth}
        height={tooltipHeight + 30}
        className="overflow-visible"
      >
        {children ? (
          children({ point: hoverPoint, coords: hoverCoords })
        ) : (
          <div className="bg-stone-900/95 dark:bg-black/95 backdrop-blur-md text-stone-100 border border-stone-700/80 dark:border-neutral-800 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 ring-1 ring-black/40">
            <div className="text-[11px] font-semibold text-stone-400 border-b border-stone-800 pb-1 flex items-center justify-between">
              <span>{formattedDate}</span>
              <span className="text-[9px] uppercase tracking-wider text-amber-400/80 font-bold">Benchmark</span>
            </div>

            <div className="space-y-1 pt-0.5">
              {series.map((s) => {
                const val = hoverPoint[s.dataKey];
                if (val === undefined || val === null) return null;
                const formatted = s.formatter ? s.formatter(val) : `${val.toLocaleString('en-IN')}`;
                return (
                  <div key={s.dataKey} className="flex items-center justify-between gap-3 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-stone-300 font-medium truncate">{s.name}</span>
                    </div>
                    <span className="font-bold font-mono text-white text-right shrink-0">
                      {formatted}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </foreignObject>
    </g>
  );
};
