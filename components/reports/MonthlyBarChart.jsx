const BAR_MAX_HEIGHT = 120;

function monthLabel(m) {
  const [, mo] = m.split('-');
  return `Th.${mo}`;
}

export default function MonthlyBarChart({ data }) {
  const max = Math.max(1, ...data.map(d => d.count));

  return (
    <div className="flex items-end gap-3" style={{ height: BAR_MAX_HEIGHT + 40 }}>
      {data.map(d => {
        const height = d.count === 0 ? 2 : Math.max(6, Math.round((d.count / max) * BAR_MAX_HEIGHT));
        return (
          <div key={d.month} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
            <span className="text-xs text-gray-500">{d.count}</span>
            <div className="w-full bg-blue-500 rounded-t-md" style={{ height }} />
            <span className="text-xs text-gray-400">{monthLabel(d.month)}</span>
          </div>
        );
      })}
    </div>
  );
}
