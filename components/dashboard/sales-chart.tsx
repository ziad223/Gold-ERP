const points = [58, 74, 62, 88, 77, 96, 83, 112, 104, 128, 116, 142];

export function SalesChart({ months }: { months: string[] }) {
  const max = Math.max(...points);
  const coords = points.map((point, index) => `${(index / (points.length - 1)) * 100},${100 - (point / max) * 82 - 8}`).join(" ");
  return (
    <div className="relative h-64 w-full overflow-hidden">
      <div className="absolute inset-0 grid grid-rows-4">{[1, 2, 3, 4].map((line) => <div key={line} className="border-t border-dashed border-border" />)}</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#279b90" stopOpacity="0.30" /><stop offset="100%" stopColor="#279b90" stopOpacity="0" /></linearGradient></defs>
        <polygon points={`0,100 ${coords} 100,100`} fill="url(#sales-fill)" />
        <polyline points={coords} fill="none" stroke="#279b90" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] font-semibold text-muted-foreground">{months.map((month) => <span key={month}>{month}</span>)}</div>
    </div>
  );
}
