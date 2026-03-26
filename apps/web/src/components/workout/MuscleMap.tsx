import { useState, useEffect } from 'react';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Göğüs',
  anterior_delt: 'Ön Deltoid',
  lateral_delt: 'Yan Deltoid',
  rear_delt: 'Arka Deltoid',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Önkol',
  core: 'Karın/Core',
  quads: 'Ön Bacak',
  hamstrings: 'Arka Bacak',
  glutes: 'Kalça',
  calves: 'Baldır',
  lats: 'Sırt Geniş',
  traps: 'Trapez',
  lower_back: 'Alt Sırt',
};

interface MuscleMapProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

function shouldShowBack(primary: string[]) {
  const backSet = new Set(['lats', 'traps', 'rear_delt', 'hamstrings', 'glutes', 'lower_back', 'triceps']);
  const frontSet = new Set(['chest', 'anterior_delt', 'biceps', 'quads', 'core', 'lateral_delt']);
  const b = primary.filter((m) => backSet.has(m)).length;
  const f = primary.filter((m) => frontSet.has(m)).length;
  return b > f;
}

function BodyBase() {
  return (
    <g fill="#162030" stroke="#1e2d42" strokeWidth="0.5">
      <circle cx="100" cy="30" r="21" />
      <rect x="92" y="50" width="16" height="17" rx="6" />
      <ellipse cx="57" cy="82" rx="14" ry="17" />
      <ellipse cx="143" cy="82" rx="14" ry="17" />
      <rect x="72" y="65" width="56" height="132" rx="8" />
      <rect x="50" y="69" width="21" height="103" rx="9" />
      <rect x="129" y="69" width="21" height="103" rx="9" />
      <rect x="52" y="170" width="17" height="62" rx="8" />
      <rect x="131" y="170" width="17" height="62" rx="8" />
      <ellipse cx="60" cy="239" rx="11" ry="7" />
      <ellipse cx="140" cy="239" rx="11" ry="7" />
      <rect x="74" y="195" width="52" height="20" rx="8" />
      <rect x="75" y="211" width="23" height="98" rx="10" />
      <rect x="102" y="211" width="23" height="98" rx="10" />
      <rect x="76" y="307" width="21" height="14" rx="7" />
      <rect x="103" y="307" width="21" height="14" rx="7" />
      <rect x="76" y="319" width="20" height="68" rx="9" />
      <rect x="104" y="319" width="20" height="68" rx="9" />
      <ellipse cx="82" cy="395" rx="16" ry="8" />
      <ellipse cx="118" cy="395" rx="16" ry="8" />
    </g>
  );
}

interface MGroupProps {
  isPrimary: boolean;
  isSecondary: boolean;
  children: React.ReactNode;
}

function MGroup({ isPrimary, isSecondary, children }: MGroupProps) {
  const fill = isPrimary ? '#f97316' : isSecondary ? '#3b82f6' : '#1e2d3d';
  const opacity = isPrimary ? 1 : isSecondary ? 0.85 : 0.35;
  const filter = isPrimary
    ? 'drop-shadow(0 0 7px rgba(249,115,22,0.95))'
    : isSecondary
    ? 'drop-shadow(0 0 5px rgba(59,130,246,0.75))'
    : 'none';
  const cls = isPrimary ? 'muscle-pulse-primary' : isSecondary ? 'muscle-pulse-secondary' : '';

  return (
    <g className={cls} style={{ fill, opacity, filter }}>
      {children}
    </g>
  );
}

export default function MuscleMap({ primaryMuscles, secondaryMuscles }: MuscleMapProps) {
  const [view, setView] = useState<'front' | 'back'>(() =>
    shouldShowBack(primaryMuscles) ? 'back' : 'front'
  );

  useEffect(() => {
    setView(shouldShowBack(primaryMuscles) ? 'back' : 'front');
  }, [primaryMuscles]);

  const s = (id: string) => ({
    isPrimary: primaryMuscles.includes(id),
    isSecondary: secondaryMuscles.includes(id),
  });

  const allActive = [...primaryMuscles, ...secondaryMuscles];

  return (
    <div>
      <div className="flex gap-2 justify-center mb-4">
        {(['front', 'back'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              view === v
                ? { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {v === 'front' ? 'Ön Görünüm' : 'Arka Görünüm'}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 200 420" className="w-44 mx-auto block">
        <defs>
          <filter id="glow-p" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feFlood floodColor="#f97316" floodOpacity="0.7" result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <BodyBase />

        {/* FRONT VIEW */}
        {view === 'front' && (
          <>
            <MGroup {...s('chest')}>
              <ellipse cx="84" cy="99" rx="15" ry="13" />
              <ellipse cx="116" cy="99" rx="15" ry="13" />
            </MGroup>
            <MGroup {...s('anterior_delt')}>
              <ellipse cx="61" cy="80" rx="9" ry="8" />
              <ellipse cx="139" cy="80" rx="9" ry="8" />
            </MGroup>
            <MGroup {...s('lateral_delt')}>
              <ellipse cx="53" cy="89" rx="7" ry="10" />
              <ellipse cx="147" cy="89" rx="7" ry="10" />
            </MGroup>
            <MGroup {...s('biceps')}>
              <ellipse cx="57" cy="128" rx="8" ry="18" />
              <ellipse cx="143" cy="128" rx="8" ry="18" />
            </MGroup>
            <MGroup {...s('forearms')}>
              <ellipse cx="58" cy="182" rx="7" ry="18" />
              <ellipse cx="142" cy="182" rx="7" ry="18" />
            </MGroup>
            <MGroup {...s('core')}>
              <ellipse cx="93" cy="136" rx="8" ry="8" />
              <ellipse cx="107" cy="136" rx="8" ry="8" />
              <ellipse cx="93" cy="155" rx="8" ry="8" />
              <ellipse cx="107" cy="155" rx="8" ry="8" />
              <ellipse cx="93" cy="174" rx="8" ry="8" />
              <ellipse cx="107" cy="174" rx="8" ry="8" />
            </MGroup>
            <MGroup {...s('quads')}>
              <ellipse cx="86" cy="257" rx="16" ry="34" />
              <ellipse cx="114" cy="257" rx="16" ry="34" />
            </MGroup>
            <MGroup {...s('calves')}>
              <ellipse cx="86" cy="350" rx="10" ry="24" />
              <ellipse cx="114" cy="350" rx="10" ry="24" />
            </MGroup>
          </>
        )}

        {/* BACK VIEW */}
        {view === 'back' && (
          <>
            <MGroup {...s('traps')}>
              <path d="M80 65 Q100 53 120 65 L129 87 Q100 97 71 87 Z" />
            </MGroup>
            <MGroup {...s('rear_delt')}>
              <ellipse cx="60" cy="82" rx="10" ry="9" />
              <ellipse cx="140" cy="82" rx="10" ry="9" />
            </MGroup>
            <MGroup {...s('lats')}>
              <path d="M70 94 L78 94 L84 183 L63 158 Z" />
              <path d="M130 94 L122 94 L116 183 L137 158 Z" />
            </MGroup>
            <MGroup {...s('triceps')}>
              <ellipse cx="57" cy="130" rx="8" ry="19" />
              <ellipse cx="143" cy="130" rx="8" ry="19" />
            </MGroup>
            <MGroup {...s('forearms')}>
              <ellipse cx="58" cy="182" rx="7" ry="18" />
              <ellipse cx="142" cy="182" rx="7" ry="18" />
            </MGroup>
            <MGroup {...s('lower_back')}>
              <ellipse cx="91" cy="170" rx="10" ry="20" />
              <ellipse cx="109" cy="170" rx="10" ry="20" />
            </MGroup>
            <MGroup {...s('glutes')}>
              <ellipse cx="87" cy="216" rx="19" ry="17" />
              <ellipse cx="113" cy="216" rx="19" ry="17" />
            </MGroup>
            <MGroup {...s('hamstrings')}>
              <ellipse cx="86" cy="257" rx="16" ry="34" />
              <ellipse cx="114" cy="257" rx="16" ry="34" />
            </MGroup>
            <MGroup {...s('calves')}>
              <ellipse cx="86" cy="350" rx="11" ry="25" />
              <ellipse cx="114" cy="350" rx="11" ry="25" />
            </MGroup>
          </>
        )}
      </svg>

      {/* Legend */}
      {allActive.length > 0 && (
        <div className="mt-5 space-y-2">
          {primaryMuscles.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-1.5">Ana Kaslar</p>
              <div className="flex flex-wrap gap-1.5">
                {primaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}
                  >
                    {MUSCLE_LABELS[m] ?? m}
                  </span>
                ))}
              </div>
            </div>
          )}
          {secondaryMuscles.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-1.5">Yardımcı Kaslar</p>
              <div className="flex flex-wrap gap-1.5">
                {secondaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    {MUSCLE_LABELS[m] ?? m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
