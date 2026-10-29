import { useState, useEffect } from 'react';
import {
  LiveLineChart,
  LiveLine,
  ChartTooltip,
  LiveXAxis,
  LiveYAxis,
  LiveLinePoint,
} from '@/components/ui/charts';

export function LiveLineChartDemo() {
  const [data, setData] = useState<LiveLinePoint[]>(() => {
    const pts: LiveLinePoint[] = [];
    const now = Math.floor(Date.now() / 1000);
    let val = 7243;
    for (let i = 30; i >= 0; i--) {
      val += (Math.random() - 0.48) * 4;
      pts.push({ time: now - i, value: Number(val.toFixed(2)) });
    }
    return pts;
  });

  const [value, setValue] = useState(7243);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const nextVal = Number((value + (Math.random() - 0.48) * 6).toFixed(2));
      setData((prev) => [...prev.slice(-60), { time: now, value: nextVal }]);
      setValue(nextVal);
    }, 1000);
    return () => clearInterval(id);
  }, [value]);

  const momentumColors = {
    up: 'rgb(16, 185, 129)',
    down: 'rgb(239, 68, 68)',
    flat: '#B38738',
  };

  return (
    <div className="w-full max-w-xl h-48 bg-stone-900 rounded-2xl p-4 border border-stone-800">
      <LiveLineChart data={data} value={value} window={30} nowOffsetUnits={1}>
        <LiveLine
          dataKey="value"
          momentumColors={momentumColors}
          pulse={true}
          dotSize={4}
          badge={true}
          formatValue={(v) => `₹${v.toFixed(2)}`}
        />
        <ChartTooltip showDatePill={true} />
        <LiveXAxis />
        <LiveYAxis position="right" formatValue={(v) => `₹${v.toFixed(0)}`} />
      </LiveLineChart>
    </div>
  );
}

export default LiveLineChartDemo;
