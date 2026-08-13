import { useState, useEffect } from 'react';

interface Props {
  target: number;
  now: number;
  compact?: boolean;
}

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function PreorderCountdown({ target, now, compact }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => parts(target - now));

  useEffect(() => {
    setTimeLeft(parts(target - Date.now()));
    const t = setInterval(() => setTimeLeft(parts(target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);

  const t = timeLeft;

  if (compact) {
    return (
      <span className="po-countdown-inline">
        {t.days}d {pad(t.hours)}h {pad(t.minutes)}m {pad(t.seconds)}s
      </span>
    );
  }

  return (
    <div className="po-countdown">
      {[
        { n: t.days, label: 'days' },
        { n: pad(t.hours), label: 'hours' },
        { n: pad(t.minutes), label: 'mins' },
        { n: pad(t.seconds), label: 'secs' },
      ].map((c) => (
        <div className="po-cell" key={c.label}>
          <div className="po-cell-num">{c.n}</div>
          <div className="po-cell-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
