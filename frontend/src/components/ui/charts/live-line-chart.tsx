import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { LinePath, AreaClosed } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleLinear } from '@visx/scale';

export interface LiveLinePoint {
  time: number; // Unix time in seconds
  value: number;
  [key: string]: any;
}

export interface MomentumColors {
  up: string;
  down: string;
  flat: string;
}

export type TrendDirection = 'up' | 'down' | 'flat';

interface LiveChartContextValue {
  data: LiveLinePoint[];
  value: number;
  dataKey: string;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xScale: any;
  yScale: any;
  hoverPoint: LiveLinePoint | null;
  hoverCoords: { x: number; y: number } | null;
  setHover: (point: LiveLinePoint | null, coords: { x: number; y: number } | null) => void;
  trend: TrendDirection;
  currentTime: number;
  window: number;
  uniqueId: string;
}

const LiveChartContext = createContext<LiveChartContextValue | null>(null);

export function useLiveChart() {
  const ctx = useContext(LiveChartContext);
  if (!ctx) throw new Error('LiveChart subcomponents must be used inside <LiveLineChart>');
  return ctx;
}

/* ========================================================================= */
/* 1. LiveLineChart Container Component                                      */
/* ========================================================================= */
export interface LiveLineChartProps {
  data: LiveLinePoint[];
  value: number;
  dataKey?: string;
  window?: number; // Visible time window in seconds
  numXTicks?: number;
  nowOffsetUnits?: number;
  exaggerate?: boolean;
  lerpSpeed?: number;
  margin?: Partial<{ top: number; right: number; bottom: number; left: number }>;
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const LiveLineChart: React.FC<LiveLineChartProps> = ({
  data,
  value,
  dataKey = 'value',
  window: timeWindow = 30,
  nowOffsetUnits = 0,
  exaggerate = false,
  lerpSpeed = 0.08,
  margin: customMargin,
  paused = false,
  className = '',
  style,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 260, height: 64 });
  const [hoverPoint, setHoverPoint] = useState<LiveLinePoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  // Smooth Y-bounds interpolation state
  const yBoundsRef = useRef({ min: value * 0.99, max: value * 1.01 });

  // Generate unique id for gradients
  const uniqueId = useMemo(() => `live-chart-${Math.random().toString(36).substring(2, 9)}`, []);

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        setDimensions({
          width: Math.max(120, Math.floor(entry.contentRect.width)),
          height: Math.max(40, Math.floor(entry.contentRect.height)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const margin = useMemo(() => ({
    top: customMargin?.top ?? 6,
    right: customMargin?.right ?? (nowOffsetUnits > 0 ? 20 : 8),
    bottom: customMargin?.bottom ?? 6,
    left: customMargin?.left ?? 6,
  }), [customMargin, nowOffsetUnits]);

  // Current reference time for sliding window (freezes if paused is true)
  const frozenTimeRef = useRef<number | null>(null);
  const currentTime = useMemo(() => {
    if (paused) {
      if (frozenTimeRef.current === null) {
        frozenTimeRef.current = data.length > 0 ? data[data.length - 1].time : Date.now() / 1000;
      }
      return frozenTimeRef.current;
    }
    frozenTimeRef.current = null;
    if (data.length > 0) {
      return data[data.length - 1].time;
    }
    return Date.now() / 1000;
  }, [data, paused]);

  // Determine short-term momentum trend (comparing latest 3-5 ticks)
  const trend: TrendDirection = useMemo(() => {
    if (data.length < 2) return 'flat';
    const recent = data.slice(-5);
    const firstVal = recent[0].value;
    const lastVal = recent[recent.length - 1].value;
    const diff = lastVal - firstVal;
    if (Math.abs(diff) < 0.001) return 'flat';
    return diff > 0 ? 'up' : 'down';
  }, [data]);

  // Filter visible points within sliding time window [currentTime - window, currentTime + offset]
  const visibleData = useMemo(() => {
    const minTime = currentTime - timeWindow;
    return data.filter((d) => d.time >= minTime - 2);
  }, [data, currentTime, timeWindow]);

  // Compute target Y scale min and max
  const { targetYMin, targetYMax } = useMemo(() => {
    if (visibleData.length === 0) {
      return { targetYMin: value * 0.99, targetYMax: value * 1.01 };
    }
    const values = visibleData.map((d) => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const spread = Math.max(rawMax - rawMin, value * 0.002);
    const padFactor = exaggerate ? 0.05 : 0.2;
    return {
      targetYMin: rawMin - spread * padFactor,
      targetYMax: rawMax + spread * padFactor,
    };
  }, [visibleData, value, exaggerate]);

  // Lerp smoothing for smooth Y domain transitions
  useEffect(() => {
    const current = yBoundsRef.current;
    yBoundsRef.current = {
      min: current.min + (targetYMin - current.min) * Math.min(1, Math.max(0.01, lerpSpeed)),
      max: current.max + (targetYMax - current.max) * Math.min(1, Math.max(0.01, lerpSpeed)),
    };
  }, [targetYMin, targetYMax, lerpSpeed]);

  const { width, height } = dimensions;

  // Scales
  const xScale = useMemo(() => {
    const minTime = currentTime - timeWindow;
    const offsetSeconds = nowOffsetUnits > 0 ? (timeWindow / 5) * nowOffsetUnits : 0;
    const maxTime = currentTime + offsetSeconds;
    return scaleLinear({
      domain: [minTime, maxTime],
      range: [margin.left, width - margin.right],
    });
  }, [currentTime, timeWindow, nowOffsetUnits, margin, width]);

  const yScale = useMemo(() => {
    return scaleLinear({
      domain: [yBoundsRef.current.min, yBoundsRef.current.max],
      range: [height - margin.bottom, margin.top],
    });
  }, [height, margin]);

  // Mouse / Touch handlers for crosshair tooltip
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || visibleData.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;

    // Find nearest data point along X
    let closest: LiveLinePoint = visibleData[0];
    let minDistance = Infinity;

    for (const pt of visibleData) {
      const ptX = xScale(pt.time);
      const dist = Math.abs(ptX - pointerX);
      if (dist < minDistance) {
        minDistance = dist;
        closest = pt;
      }
    }

    if (minDistance < 60) {
      setHoverPoint(closest);
      setHoverCoords({ x: xScale(closest.time), y: yScale(closest.value) });
    } else {
      setHoverPoint(null);
      setHoverCoords(null);
    }
  };

  const handlePointerLeave = () => {
    setHoverPoint(null);
    setHoverCoords(null);
  };

  return (
    <LiveChartContext.Provider
      value={{
        data: visibleData,
        value,
        dataKey,
        width,
        height,
        margin,
        xScale,
        yScale,
        hoverPoint,
        hoverCoords,
        setHover: (p, c) => {
          setHoverPoint(p);
          setHoverCoords(c);
        },
        trend,
        currentTime,
        window: timeWindow,
        uniqueId,
      }}
    >
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={`relative select-none overflow-visible ${className}`}
        style={{ width: '100%', height: '100%', ...style }}
      >
        <svg width={width} height={height} className="block overflow-visible pointer-events-none">
          {children}
        </svg>
      </div>
    </LiveChartContext.Provider>
  );
};

/* ========================================================================= */
/* 2. LiveLine Component with Fill, Glow & Pulsing Dot                       */
/* ========================================================================= */
export interface LiveLineProps {
  dataKey?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: boolean;
  pulse?: boolean;
  dotSize?: number;
  badge?: boolean;
  formatValue?: (v: number) => string;
  momentumColors?: MomentumColors;
}

export const LiveLine: React.FC<LiveLineProps> = ({
  dataKey = 'value',
  stroke = 'var(--chart-line-primary, #B38738)',
  strokeWidth = 2,
  fill = true,
  pulse = true,
  dotSize = 4,
  badge = true,
  formatValue = (v) => `₹${v.toFixed(2)}`,
  momentumColors,
}) => {
  const { data, xScale, yScale, trend, uniqueId } = useLiveChart();

  // Active color based on momentum colors or fallback stroke
  const activeStroke = useMemo(() => {
    if (momentumColors) {
      return momentumColors[trend] || momentumColors.flat || stroke;
    }
    return stroke;
  }, [momentumColors, trend, stroke]);

  if (data.length < 2) return null;

  const latestPoint = data[data.length - 1];
  const latestX = xScale(latestPoint.time);
  const latestY = yScale(latestPoint[dataKey]);

  return (
    <g className="live-line-layer">
      {/* SVG Gradient Definition */}
      <defs>
        <linearGradient id={`${uniqueId}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={activeStroke} stopOpacity={0.35} />
          <stop offset="60%" stopColor={activeStroke} stopOpacity={0.12} />
          <stop offset="100%" stopColor={activeStroke} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Area Gradient Fill under line */}
      {fill && (
        <AreaClosed
          data={data}
          x={(d) => xScale(d.time)}
          y={(d) => yScale(d[dataKey])}
          yScale={yScale}
          curve={curveMonotoneX}
          fill={`url(#${uniqueId}-fill)`}
          className="transition-colors duration-500"
        />
      )}

      {/* Main Curved Line Path */}
      <LinePath
        data={data}
        x={(d) => xScale(d.time)}
        y={(d) => yScale(d[dataKey])}
        curve={curveMonotoneX}
        stroke={activeStroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-500"
      />

      {/* Live Pulsing Dot at current value tip */}
      {pulse && (
        <g transform={`translate(${latestX}, ${latestY})`}>
          {/* Outer radar pulse animation */}
          <circle
            r={dotSize * 2.4}
            fill={activeStroke}
            opacity="0.35"
            className="animate-ping"
          />
          {/* Middle glow circle */}
          <circle
            r={dotSize * 1.5}
            fill={activeStroke}
            opacity="0.5"
          />
          {/* Inner solid center dot */}
          <circle
            r={dotSize}
            fill="#FFFFFF"
            stroke={activeStroke}
            strokeWidth={1.5}
          />
        </g>
      )}

      {/* Value Badge at live tip */}
      {badge && (
        <g transform={`translate(${latestX + 8}, ${latestY})`}>
          <rect
            x="0"
            y="-10"
            width={58}
            height="20"
            rx="4"
            fill="rgba(15, 12, 16, 0.85)"
            stroke={activeStroke}
            strokeWidth="0.8"
          />
          <text
            x="29"
            y="3.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {formatValue(latestPoint[dataKey])}
          </text>
        </g>
      )}
    </g>
  );
};

/* ========================================================================= */
/* 3. ChartTooltip Component with Interactive Crosshair                      */
/* ========================================================================= */
export interface ChartTooltipProps {
  showDatePill?: boolean;
  content?: (props: { point: LiveLinePoint; formattedValue: string }) => React.ReactNode;
  formatValue?: (v: number) => string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  showDatePill = false,
  content,
  formatValue = (v) => `₹${v.toFixed(2)}`,
}) => {
  const { hoverPoint, hoverCoords, height, margin, dataKey } = useLiveChart();

  if (!hoverPoint || !hoverCoords) return null;

  const { x, y } = hoverCoords;
  const val = hoverPoint[dataKey];
  const formattedVal = formatValue(val);
  const dateStr = new Date(hoverPoint.time * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <g className="chart-tooltip-layer pointer-events-none">
      {/* Vertical crosshair line */}
      <line
        x1={x}
        y1={margin.top}
        x2={x}
        y2={height - margin.bottom}
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />

      {/* Crosshair target dot */}
      <circle cx={x} cy={y} r="5" fill="#FFFFFF" stroke="#B38738" strokeWidth="2" />

      {/* Tooltip Card */}
      <foreignObject
        x={Math.max(4, Math.min(x - 55, 160))}
        y={Math.max(2, y - 48)}
        width={110}
        height={44}
      >
        {content ? (
          content({ point: hoverPoint, formattedValue: formattedVal })
        ) : (
          <div className="bg-stone-900/95 dark:bg-stone-950/95 backdrop-blur-md text-white border border-stone-700/80 rounded-lg px-2.5 py-1.5 shadow-xl text-center">
            <div className="text-[11px] font-bold tracking-tight text-amber-300">
              {formattedVal}
            </div>
            {showDatePill && (
              <div className="text-[9px] text-stone-400 font-medium">
                {dateStr}
              </div>
            )}
          </div>
        )}
      </foreignObject>
    </g>
  );
};

/* ========================================================================= */
/* 4. LiveXAxis & LiveYAxis Components                                       */
/* ========================================================================= */
export const LiveXAxis: React.FC<{ numTicks?: number; formatTick?: (v: number) => string }> = ({
  numTicks = 4,
  formatTick = (t) => new Date(t * 1000).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
}) => {
  const { xScale, height, margin } = useLiveChart();
  const ticks = xScale.ticks ? xScale.ticks(numTicks) : [];

  return (
    <g className="live-xaxis" transform={`translate(0, ${height - margin.bottom})`}>
      {ticks.map((t: number) => (
        <text
          key={t}
          x={xScale(t)}
          y={12}
          textAnchor="middle"
          fontSize="9"
          fill="rgba(150, 150, 150, 0.7)"
          fontFamily="sans-serif"
        >
          {formatTick(t)}
        </text>
      ))}
    </g>
  );
};

export const LiveYAxis: React.FC<{
  position?: 'left' | 'right';
  formatValue?: (v: number) => string;
}> = ({ position = 'right', formatValue = (v) => `₹${v.toFixed(0)}` }) => {
  const { yScale, width, margin } = useLiveChart();
  const ticks = yScale.ticks ? yScale.ticks(3) : [];
  const xPos = position === 'right' ? width - margin.right + 4 : margin.left - 4;
  const anchor = position === 'right' ? 'start' : 'end';

  return (
    <g className="live-yaxis">
      {ticks.map((val: number) => (
        <text
          key={val}
          x={xPos}
          y={yScale(val) + 3}
          textAnchor={anchor}
          fontSize="8.5"
          fill="rgba(150, 150, 150, 0.7)"
          fontFamily="sans-serif"
        >
          {formatValue(val)}
        </text>
      ))}
    </g>
  );
};
