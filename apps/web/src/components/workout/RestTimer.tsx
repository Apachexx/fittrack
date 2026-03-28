import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

const PRESETS = [
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '90s', value: 90 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
];

export interface RestTimerRef {
  start: (secs?: number) => void;
}

const RestTimer = forwardRef<RestTimerRef, { onComplete?: () => void }>(
  function RestTimer({ onComplete }, ref) {
    const [target, setTarget] = useState(90);
    const [seconds, setSeconds] = useState(0);
    const [active, setActive] = useState(false);

    const beep = useCallback(() => {
      try {
        const ctx = new AudioContext();
        [880, 1100, 1320].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.2);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.25);
        });
      } catch { /* sessiz */ }
    }, []);

    useEffect(() => {
      if (!active) return;
      if (seconds <= 0) {
        setActive(false);
        beep();
        onComplete?.();
        return;
      }
      const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }, [active, seconds, beep, onComplete]);

    function start(secs = target) {
      setTarget(secs);
      setSeconds(secs);
      setActive(true);
    }

    useImperativeHandle(ref, () => ({ start }));

    const progress = active ? seconds / target : 0;
    const r = 42;
    const circumference = 2 * Math.PI * r;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const display = active
      ? mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${seconds}`
      : '—';

    const urgentColor = seconds <= 10 && active ? '#ef4444' : seconds <= 30 && active ? '#f59e0b' : '#f97316';

    return (
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Dinlenme</p>

        {/* SVG Ring */}
        <div className="flex justify-center mb-4">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r={r} fill="none"
                stroke={urgentColor}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease', filter: active ? `drop-shadow(0 0 6px ${urgentColor}88)` : 'none' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{display}</span>
              {active && <span className="text-xs text-gray-600 mt-0.5">saniye</span>}
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="flex gap-1.5 mb-4 justify-center flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => start(p.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150"
              style={
                target === p.value && active
                  ? { background: `${urgentColor}20`, color: urgentColor, border: `1px solid ${urgentColor}40` }
                  : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button onClick={() => start()} className="btn-primary flex-1 text-sm py-2">
            {active ? '↺ Yeniden' : '▶ Başlat'}
          </button>
          {active && (
            <button onClick={() => { setActive(false); setSeconds(0); }} className="btn-secondary text-sm py-2 px-3">
              ■
            </button>
          )}
        </div>
      </div>
    );
  }
);

export default RestTimer;
