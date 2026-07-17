export function ProgressRing({
  progress,
  label,
  sublabel
}: {
  progress: number;
  label: string;
  sublabel: string;
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="progress-ring">
      <svg viewBox="0 0 132 132">
        <circle className="progress-ring__track" cx="66" cy="66" r={radius} />
        <circle
          className="progress-ring__fill"
          cx="66"
          cy="66"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
        />
      </svg>
      <div><strong>{label}</strong><span>{sublabel}</span></div>
    </div>
  );
}

export function MacroRow({
  label,
  value,
  target,
  color
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const width = Math.min(100, Math.round((value / target) * 100));

  return (
    <div className="macro-row">
      <div><span>{label}</span><strong>{value}g <small>/ {target}g</small></strong></div>
      <div className="macro-track"><span style={{ width: `${width}%`, background: color }} /></div>
    </div>
  );
}

export function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return <div className="metric"><span>{label}</span><strong>{value} <small>{unit}</small></strong></div>;
}

