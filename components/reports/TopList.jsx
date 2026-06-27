export default function TopList({ title, items, renderLabel, renderSub }) {
  const max = Math.max(1, ...items.map(i => i.count));

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      {!items.length
        ? <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
        : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1 gap-2">
                  <span className="text-gray-700 font-medium truncate">{i + 1}. {renderLabel(item)}</span>
                  <span className="text-gray-500 flex-shrink-0">{item.count} lượt</span>
                </div>
                {renderSub && <p className="text-xs text-gray-400 mb-1">{renderSub(item)}</p>}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
