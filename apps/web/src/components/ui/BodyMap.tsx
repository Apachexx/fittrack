interface MuscleTarget { primary: string[]; secondary: string[] }

const EXERCISE_MUSCLES: Record<string, MuscleTarget> = {
  'Bench Press': {
    primary: ['pec-lower-l', 'pec-lower-r'],
    secondary: ['pec-upper-l', 'pec-upper-r', 'delt-ant-l', 'delt-ant-r', 'tricep-lat-l', 'tricep-lat-r', 'tricep-long-l', 'tricep-long-r'],
  },
  'Incline Bench Press': {
    primary: ['pec-upper-l', 'pec-upper-r'],
    secondary: ['pec-lower-l', 'pec-lower-r', 'delt-ant-l', 'delt-ant-r', 'tricep-lat-l', 'tricep-lat-r'],
  },
  'Smith Machine Low Incline Press': {
    primary: ['pec-upper-l', 'pec-upper-r', 'pec-lower-l', 'pec-lower-r'],
    secondary: ['delt-ant-l', 'delt-ant-r', 'tricep-lat-l', 'tricep-lat-r'],
  },
  'Chest Fly Machine': {
    primary: ['pec-lower-l', 'pec-lower-r', 'pec-upper-l', 'pec-upper-r'],
    secondary: ['delt-ant-l', 'delt-ant-r'],
  },
  'Dumbbell Fly': {
    primary: ['pec-lower-l', 'pec-lower-r'],
    secondary: ['pec-upper-l', 'pec-upper-r', 'delt-ant-l', 'delt-ant-r'],
  },
  'Cable Crossover': {
    primary: ['pec-lower-l', 'pec-lower-r'],
    secondary: ['pec-upper-l', 'pec-upper-r', 'delt-ant-l', 'delt-ant-r'],
  },
  'Push-up': {
    primary: ['pec-lower-l', 'pec-lower-r'],
    secondary: ['delt-ant-l', 'delt-ant-r', 'tricep-lat-l', 'tricep-lat-r'],
  },
  'Pull-up': {
    primary: ['lat-l', 'lat-r'],
    secondary: ['bicep-l', 'bicep-r', 'brachialis-l', 'brachialis-r', 'rhomboid', 'delt-post-l', 'delt-post-r', 'trap-mid'],
  },
  'Barbell Row': {
    primary: ['lat-l', 'lat-r', 'rhomboid'],
    secondary: ['trap-mid', 'trap-upper-l', 'trap-upper-r', 'delt-post-l', 'delt-post-r', 'bicep-l', 'bicep-r', 'erector-l', 'erector-r'],
  },
  'Lat Pulldown': {
    primary: ['lat-l', 'lat-r'],
    secondary: ['bicep-l', 'bicep-r', 'brachialis-l', 'brachialis-r', 'rhomboid', 'trap-mid'],
  },
  'Seated Cable Row': {
    primary: ['rhomboid', 'trap-mid'],
    secondary: ['lat-l', 'lat-r', 'bicep-l', 'bicep-r', 'delt-post-l', 'delt-post-r'],
  },
  'Cable Row': {
    primary: ['rhomboid', 'trap-mid', 'lat-l', 'lat-r'],
    secondary: ['bicep-l', 'bicep-r', 'delt-post-l', 'delt-post-r'],
  },
  'Cable Rear Delt Fly': {
    primary: ['delt-post-l', 'delt-post-r'],
    secondary: ['rhomboid', 'trap-mid', 'trap-upper-l', 'trap-upper-r'],
  },
  'Plate Loaded Wide Grip Row': {
    primary: ['lat-l', 'lat-r', 'rhomboid'],
    secondary: ['trap-mid', 'trap-upper-l', 'trap-upper-r', 'delt-post-l', 'delt-post-r', 'bicep-l', 'bicep-r'],
  },
  'Deadlift': {
    primary: ['erector-l', 'erector-r', 'glute-max-l', 'glute-max-r', 'hamstring-bf-l', 'hamstring-bf-r'],
    secondary: ['trap-upper-l', 'trap-upper-r', 'quad-vl-l', 'quad-vl-r', 'quad-rf-l', 'quad-rf-r', 'forearm-l', 'forearm-r', 'forearm-back-l', 'forearm-back-r'],
  },
  'Squat': {
    primary: ['quad-rf-l', 'quad-rf-r', 'quad-vl-l', 'quad-vl-r', 'quad-vm-l', 'quad-vm-r', 'glute-max-l', 'glute-max-r'],
    secondary: ['hamstring-bf-l', 'hamstring-bf-r', 'erector-l', 'erector-r', 'adductor-l', 'adductor-r'],
  },
  'Smith Machine Squat': {
    primary: ['quad-rf-l', 'quad-rf-r', 'quad-vl-l', 'quad-vl-r', 'quad-vm-l', 'quad-vm-r'],
    secondary: ['glute-max-l', 'glute-max-r', 'hamstring-bf-l', 'hamstring-bf-r'],
  },
  'Leg Press': {
    primary: ['quad-rf-l', 'quad-rf-r', 'quad-vl-l', 'quad-vl-r', 'quad-vm-l', 'quad-vm-r'],
    secondary: ['glute-max-l', 'glute-max-r', 'hamstring-bf-l', 'hamstring-bf-r', 'adductor-l', 'adductor-r'],
  },
  'Romanian Deadlift': {
    primary: ['hamstring-bf-l', 'hamstring-bf-r', 'hamstring-st-l', 'hamstring-st-r', 'glute-max-l', 'glute-max-r'],
    secondary: ['erector-l', 'erector-r', 'adductor-l', 'adductor-r'],
  },
  'Leg Curl': {
    primary: ['hamstring-bf-l', 'hamstring-bf-r', 'hamstring-st-l', 'hamstring-st-r'],
    secondary: ['calf-l', 'calf-r'],
  },
  'Seated Leg Curl': {
    primary: ['hamstring-bf-l', 'hamstring-bf-r', 'hamstring-st-l', 'hamstring-st-r'],
    secondary: [],
  },
  'Leg Extension': {
    primary: ['quad-rf-l', 'quad-rf-r', 'quad-vl-l', 'quad-vl-r', 'quad-vm-l', 'quad-vm-r'],
    secondary: [],
  },
  'Lunge': {
    primary: ['quad-rf-l', 'quad-rf-r', 'glute-max-l', 'glute-max-r'],
    secondary: ['quad-vl-l', 'quad-vl-r', 'quad-vm-l', 'quad-vm-r', 'hamstring-bf-l', 'hamstring-bf-r', 'adductor-l', 'adductor-r'],
  },
  'Overhead Press': {
    primary: ['delt-ant-l', 'delt-ant-r', 'delt-mid-l', 'delt-mid-r'],
    secondary: ['tricep-lat-l', 'tricep-lat-r', 'tricep-long-l', 'tricep-long-r', 'trap-upper-l', 'trap-upper-r'],
  },
  'Shoulder Press Machine': {
    primary: ['delt-ant-l', 'delt-ant-r', 'delt-mid-l', 'delt-mid-r'],
    secondary: ['tricep-lat-l', 'tricep-lat-r', 'trap-upper-l', 'trap-upper-r'],
  },
  'Dumbbell Lateral Raise': {
    primary: ['delt-mid-l', 'delt-mid-r'],
    secondary: ['delt-ant-l', 'delt-ant-r', 'trap-upper-l', 'trap-upper-r'],
  },
  'Lateral Raise': {
    primary: ['delt-mid-l', 'delt-mid-r'],
    secondary: ['delt-ant-l', 'delt-ant-r', 'trap-upper-l', 'trap-upper-r'],
  },
  'Front Raise': {
    primary: ['delt-ant-l', 'delt-ant-r'],
    secondary: ['delt-mid-l', 'delt-mid-r', 'pec-upper-l', 'pec-upper-r'],
  },
  'Face Pull': {
    primary: ['delt-post-l', 'delt-post-r'],
    secondary: ['rhomboid', 'trap-mid', 'trap-upper-l', 'trap-upper-r'],
  },
  'Bicep Curl': {
    primary: ['bicep-l', 'bicep-r'],
    secondary: ['brachialis-l', 'brachialis-r', 'forearm-l', 'forearm-r'],
  },
  'Hammer Curl': {
    primary: ['brachialis-l', 'brachialis-r', 'forearm-l', 'forearm-r'],
    secondary: ['bicep-l', 'bicep-r'],
  },
  'Cable Curl': {
    primary: ['bicep-l', 'bicep-r'],
    secondary: ['brachialis-l', 'brachialis-r', 'forearm-l', 'forearm-r'],
  },
  'Incline Dumbbell Curl': {
    primary: ['bicep-l', 'bicep-r'],
    secondary: ['brachialis-l', 'brachialis-r'],
  },
  'Tricep Pushdown': {
    primary: ['tricep-lat-l', 'tricep-lat-r'],
    secondary: ['tricep-long-l', 'tricep-long-r'],
  },
  'Overhead Rope Extension': {
    primary: ['tricep-long-l', 'tricep-long-r'],
    secondary: ['tricep-lat-l', 'tricep-lat-r'],
  },
  'Skull Crusher': {
    primary: ['tricep-long-l', 'tricep-long-r', 'tricep-lat-l', 'tricep-lat-r'],
    secondary: [],
  },
  'Plank': {
    primary: ['abs-upper', 'abs-lower'],
    secondary: ['oblique-l', 'oblique-r', 'erector-l', 'erector-r', 'glute-max-l', 'glute-max-r'],
  },
  'Crunch': {
    primary: ['abs-upper'],
    secondary: ['abs-lower', 'oblique-l', 'oblique-r'],
  },
  'Russian Twist': {
    primary: ['oblique-l', 'oblique-r'],
    secondary: ['abs-upper', 'abs-lower'],
  },
  'Treadmill': {
    primary: ['quad-rf-l', 'quad-rf-r', 'hamstring-bf-l', 'hamstring-bf-r', 'calf-l', 'calf-r'],
    secondary: ['glute-max-l', 'glute-max-r'],
  },
  'Cycling': {
    primary: ['quad-rf-l', 'quad-rf-r', 'quad-vl-l', 'quad-vl-r'],
    secondary: ['glute-max-l', 'glute-max-r', 'hamstring-bf-l', 'hamstring-bf-r', 'calf-l', 'calf-r'],
  },
  'Jump Rope': {
    primary: ['calf-l', 'calf-r'],
    secondary: ['quad-rf-l', 'quad-rf-r', 'hamstring-bf-l', 'hamstring-bf-r'],
  },
};

const GROUP_FALLBACK: Record<string, MuscleTarget> = {
  chest: { primary: ['pec-lower-l', 'pec-lower-r', 'pec-upper-l', 'pec-upper-r'], secondary: ['delt-ant-l', 'delt-ant-r'] },
  back: { primary: ['lat-l', 'lat-r', 'rhomboid', 'trap-mid'], secondary: ['delt-post-l', 'delt-post-r', 'trap-upper-l', 'trap-upper-r'] },
  legs: { primary: ['quad-rf-l', 'quad-rf-r', 'quad-vl-l', 'quad-vl-r', 'glute-max-l', 'glute-max-r'], secondary: ['hamstring-bf-l', 'hamstring-bf-r', 'calf-l', 'calf-r'] },
  shoulders: { primary: ['delt-ant-l', 'delt-ant-r', 'delt-mid-l', 'delt-mid-r'], secondary: ['delt-post-l', 'delt-post-r', 'trap-upper-l', 'trap-upper-r'] },
  arms: { primary: ['bicep-l', 'bicep-r', 'tricep-long-l', 'tricep-long-r', 'tricep-lat-l', 'tricep-lat-r'], secondary: ['brachialis-l', 'brachialis-r', 'forearm-l', 'forearm-r'] },
  core: { primary: ['abs-upper', 'abs-lower', 'oblique-l', 'oblique-r'], secondary: ['erector-l', 'erector-r'] },
  cardio: { primary: ['quad-rf-l', 'quad-rf-r', 'hamstring-bf-l', 'hamstring-bf-r', 'calf-l', 'calf-r'], secondary: ['glute-max-l', 'glute-max-r'] },
};

interface BodyMapProps {
  exerciseName?: string | null;
  muscleGroup?: string | null;
}

export default function BodyMap({ exerciseName, muscleGroup }: BodyMapProps) {
  const target: MuscleTarget | null =
    (exerciseName && EXERCISE_MUSCLES[exerciseName])
      ? EXERCISE_MUSCLES[exerciseName]
      : (muscleGroup && GROUP_FALLBACK[muscleGroup])
        ? GROUP_FALLBACK[muscleGroup]
        : null;

  const primary = new Set(target?.primary ?? []);
  const secondary = new Set(target?.secondary ?? []);

  // inactive muscles are always visible as dark overlay (like anatomy reference image)
  const f = (id: string): string => {
    if (primary.has(id)) return '#ef4444';
    if (secondary.has(id)) return '#f97316';
    return '#1b2d3e';
  };
  const fs = (id: string): string => {
    if (primary.has(id)) return '#991b1b';
    if (secondary.has(id)) return '#9a3412';
    return '#0f1e2b';
  };

  const BC = '#0b1520';   // body silhouette fill
  const DL = '#1a2e3e';   // definition/division line color
  const sw = '0.6';       // stroke width for muscle outlines

  const M = (id: string, d: string) => (
    <path key={id} d={d} fill={f(id)} stroke={fs(id)} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
  );

  const hasTarget = !!target;
  const label = exerciseName ?? null;

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {label && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            {label}
          </span>
          {hasTarget && secondary.size > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }}>
              +yardımcı
            </span>
          )}
        </div>
      )}

      <svg viewBox="0 0 300 420" className="w-full max-w-[280px]" fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* ── Labels ── */}
        <text x="72" y="9" textAnchor="middle" fill="#4a6070" fontSize="7" fontFamily="sans-serif" letterSpacing="1.5" fontWeight="600">ÖN</text>
        <text x="228" y="9" textAnchor="middle" fill="#4a6070" fontSize="7" fontFamily="sans-serif" letterSpacing="1.5" fontWeight="600">ARKA</text>
        <line x1="150" y1="12" x2="150" y2="410" stroke="#162230" strokeWidth="1" />

        {/* ══════════════════════════════════════════
            FRONT SILHOUETTE  (center x = 72)
            ══════════════════════════════════════════ */}

        {/* Head */}
        <ellipse cx="72" cy="19" rx="13" ry="15" fill={BC} />
        {/* Neck */}
        <path d="M65,33 Q68,30 72,30 Q76,30 79,33 L77,50 L67,50 Z" fill={BC} />
        {/* Left trap slope neck→shoulder */}
        <path d="M67,50 Q52,47 28,62 L32,78 Q48,63 69,56 Z" fill={BC} />
        {/* Right trap slope */}
        <path d="M77,50 Q92,47 116,62 L112,78 Q96,63 75,56 Z" fill={BC} />
        {/* Left deltoid cap */}
        <path d="M22,64 Q12,70 10,98 Q12,112 24,110 Q34,92 32,78 Z" fill={BC} />
        {/* Right deltoid cap */}
        <path d="M122,64 Q132,70 134,98 Q132,112 120,110 Q110,92 112,78 Z" fill={BC} />
        {/* Torso — tapered waist with cubic bezier */}
        <path d="M32,82 C26,108 26,146 40,162 C38,174 40,184 42,192 L102,192 C104,184 106,174 104,162 C118,146 118,108 112,82 Q72,68 32,82 Z" fill={BC} />
        {/* Left upper arm */}
        <path d="M22,64 Q10,72 8,102 Q8,124 16,144 Q24,150 34,146 Q38,124 36,98 Z" fill={BC} />
        {/* Right upper arm */}
        <path d="M122,64 Q134,72 136,102 Q136,124 128,144 Q120,150 110,146 Q106,124 108,98 Z" fill={BC} />
        {/* Left forearm */}
        <path d="M16,144 Q8,166 10,198 Q18,206 30,202 Q38,174 34,146 Z" fill={BC} />
        {/* Right forearm */}
        <path d="M128,144 Q136,166 134,198 Q126,206 114,202 Q106,174 110,146 Z" fill={BC} />
        {/* Left hand */}
        <ellipse cx="21" cy="212" rx="10" ry="9" fill={BC} />
        {/* Right hand */}
        <ellipse cx="123" cy="212" rx="10" ry="9" fill={BC} />
        {/* Pelvis */}
        <path d="M40,190 L44,204 Q72,213 100,204 L104,190 Q72,200 40,190 Z" fill={BC} />
        {/* Left thigh */}
        <path d="M40,202 Q22,248 24,294 Q34,306 50,300 Q58,256 58,204 Z" fill={BC} />
        {/* Right thigh */}
        <path d="M104,202 Q122,248 120,294 Q110,306 94,300 Q86,256 86,204 Z" fill={BC} />
        {/* Left lower leg */}
        <path d="M24,294 Q18,324 20,358 Q28,368 46,364 Q52,332 50,300 Z" fill={BC} />
        {/* Right lower leg */}
        <path d="M120,294 Q126,324 124,358 Q116,368 98,364 Q92,332 94,300 Z" fill={BC} />
        {/* Left foot */}
        <path d="M20,358 Q14,374 22,380 Q34,386 48,382 Q52,372 46,364 Z" fill={BC} />
        {/* Right foot */}
        <path d="M124,358 Q130,374 122,380 Q110,386 96,382 Q90,372 98,364 Z" fill={BC} />

        {/* ══════════════════════════════════════════
            FRONT MUSCLES
            ══════════════════════════════════════════ */}

        {/* ── Traps (front visible portion, neck slopes) ── */}
        {M('trap-upper-l', 'M67,50 Q52,47 28,62 L32,78 Q48,63 69,56 Z')}
        {M('trap-upper-r', 'M77,50 Q92,47 116,62 L112,78 Q96,63 75,56 Z')}

        {/* ── Lateral deltoid (shoulder cap) ── */}
        {M('delt-mid-l', 'M22,64 Q12,70 10,98 Q12,110 24,108 Q34,90 32,78 Z')}
        {M('delt-mid-r', 'M122,64 Q132,70 134,98 Q132,110 120,108 Q110,90 112,78 Z')}

        {/* ── Anterior deltoid ── */}
        {M('delt-ant-l', 'M32,78 Q22,84 20,110 Q22,120 32,118 Q40,102 40,84 Z')}
        {M('delt-ant-r', 'M112,78 Q122,84 124,110 Q122,120 112,118 Q104,102 104,84 Z')}

        {/* ── Upper pectoralis ── */}
        {M('pec-upper-l', 'M69,56 Q54,52 38,72 Q44,90 58,92 Q66,80 72,64 Z')}
        {M('pec-upper-r', 'M75,56 Q90,52 106,72 Q100,90 86,92 Q78,80 72,64 Z')}

        {/* ── Lower pectoralis (fan shape) ── */}
        {M('pec-lower-l', 'M58,92 Q36,98 38,126 Q52,136 68,130 Q74,116 68,94 Z')}
        {M('pec-lower-r', 'M86,92 Q108,98 106,126 Q92,136 76,130 Q70,116 76,94 Z')}

        {/* Pec definition line (bottom fold) */}
        <path d="M38,126 Q72,136 106,126" stroke={DL} strokeWidth="0.8" fill="none" />

        {/* ── Biceps ── */}
        {M('bicep-l', 'M20,106 Q10,126 10,142 Q18,150 28,148 Q36,130 36,112 Z')}
        {M('bicep-r', 'M124,106 Q134,126 134,142 Q126,150 116,148 Q108,130 108,112 Z')}

        {/* ── Brachialis (elbow bump) ── */}
        {M('brachialis-l', 'M10,142 Q8,154 10,164 Q18,170 26,166 Q30,154 28,148 Z')}
        {M('brachialis-r', 'M134,142 Q136,154 134,164 Q126,170 118,166 Q114,154 116,148 Z')}

        {/* ── Forearms ── */}
        {M('forearm-l', 'M10,164 Q4,182 6,198 Q16,206 28,202 Q34,180 26,166 Z')}
        {M('forearm-r', 'M134,164 Q140,182 138,198 Q128,206 116,202 Q110,180 118,166 Z')}

        {/* ── Serratus anterior (finger lines on ribcage sides) ── */}
        <path d="M38,90 Q32,102 34,116 M38,102 Q30,114 32,126 M38,114 Q30,126 32,138" stroke={DL} strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M106,90 Q112,102 110,116 M106,102 Q114,114 112,126 M106,114 Q114,126 112,138" stroke={DL} strokeWidth="0.9" fill="none" strokeLinecap="round" />

        {/* ── Abs upper ── */}
        {M('abs-upper', 'M48,124 Q72,132 96,124 L94,152 Q72,158 50,152 Z')}

        {/* ── Abs lower ── */}
        {M('abs-lower', 'M50,152 Q72,158 94,152 L92,174 Q72,180 52,174 Z')}

        {/* Abs grid lines (linea alba + horizontal divisions) */}
        <line x1="72" y1="122" x2="72" y2="176" stroke={DL} strokeWidth="0.8" />
        <line x1="50" y1="138" x2="94" y2="138" stroke={DL} strokeWidth="0.7" />
        <line x1="50" y1="152" x2="94" y2="152" stroke={DL} strokeWidth="0.7" />

        {/* ── External obliques ── */}
        {M('oblique-l', 'M38,126 Q28,146 30,174 Q36,182 48,176 L50,152 L50,124 Z')}
        {M('oblique-r', 'M106,126 Q116,146 114,174 Q108,182 96,176 L94,152 L94,124 Z')}

        {/* ── Adductors ── */}
        {M('adductor-l', 'M58,202 Q62,248 62,290 Q56,298 48,294 Q52,250 54,204 Z')}
        {M('adductor-r', 'M86,202 Q82,248 82,290 Q88,298 96,294 Q92,250 90,204 Z')}

        {/* ── Quad vastus lateralis ── */}
        {M('quad-vl-l', 'M38,200 Q22,246 24,290 Q34,302 48,298 Q54,254 54,202 Z')}
        {M('quad-vl-r', 'M106,200 Q122,246 120,290 Q110,302 96,298 Q90,254 90,202 Z')}

        {/* ── Quad rectus femoris ── */}
        {M('quad-rf-l', 'M54,202 Q48,250 50,288 Q58,298 64,292 Q66,252 62,202 Z')}
        {M('quad-rf-r', 'M90,202 Q96,250 94,288 Q86,298 80,292 Q78,252 82,202 Z')}

        {/* ── Quad vastus medialis (teardrop) ── */}
        {M('quad-vm-l', 'M50,256 Q40,272 44,286 Q54,296 64,290 Q66,274 58,254 Z')}
        {M('quad-vm-r', 'M94,256 Q104,272 100,286 Q90,296 80,290 Q78,274 86,254 Z')}

        {/* Quad definition (separation between heads) */}
        <path d="M54,202 Q52,246 50,284" stroke={DL} strokeWidth="0.7" fill="none" />
        <path d="M90,202 Q92,246 94,284" stroke={DL} strokeWidth="0.7" fill="none" />

        {/* ── Tibialis anterior ── */}
        {M('tibialis-l', 'M28,292 Q20,320 22,354 Q30,362 44,358 Q48,328 46,298 Z')}
        {M('tibialis-r', 'M116,292 Q124,320 122,354 Q114,362 100,358 Q96,328 98,298 Z')}

        {/* ══════════════════════════════════════════
            BACK SILHOUETTE  (center x = 228, offset +156)
            ══════════════════════════════════════════ */}

        <ellipse cx="228" cy="19" rx="13" ry="15" fill={BC} />
        <path d="M221,33 Q224,30 228,30 Q232,30 235,33 L233,50 L223,50 Z" fill={BC} />
        {/* Left trap slope back */}
        <path d="M223,50 Q208,47 184,62 L188,78 Q204,63 225,56 Z" fill={BC} />
        {/* Right trap slope back */}
        <path d="M233,50 Q248,47 272,62 L268,78 Q252,63 231,56 Z" fill={BC} />
        {/* Left shoulder cap back */}
        <path d="M178,64 Q168,70 166,98 Q168,112 180,110 Q190,92 188,78 Z" fill={BC} />
        {/* Right shoulder cap back */}
        <path d="M278,64 Q288,70 290,98 Q288,112 276,110 Q266,92 268,78 Z" fill={BC} />
        {/* Torso back */}
        <path d="M188,82 C182,108 182,146 196,162 C194,174 196,184 198,192 L258,192 C260,184 262,174 260,162 C274,146 274,108 268,82 Q228,68 188,82 Z" fill={BC} />
        {/* Left upper arm back */}
        <path d="M178,64 Q166,72 164,102 Q164,124 172,144 Q180,150 190,146 Q194,124 192,98 Z" fill={BC} />
        {/* Right upper arm back */}
        <path d="M278,64 Q290,72 292,102 Q292,124 284,144 Q276,150 266,146 Q262,124 264,98 Z" fill={BC} />
        {/* Left forearm back */}
        <path d="M172,144 Q164,166 166,198 Q174,206 186,202 Q194,174 190,146 Z" fill={BC} />
        {/* Right forearm back */}
        <path d="M284,144 Q292,166 290,198 Q282,206 270,202 Q262,174 266,146 Z" fill={BC} />
        {/* Hands */}
        <ellipse cx="177" cy="212" rx="10" ry="9" fill={BC} />
        <ellipse cx="279" cy="212" rx="10" ry="9" fill={BC} />
        {/* Pelvis back */}
        <path d="M196,190 L200,204 Q228,213 256,204 L260,190 Q228,200 196,190 Z" fill={BC} />
        {/* Left thigh back */}
        <path d="M196,202 Q178,248 180,294 Q190,306 206,300 Q214,256 214,204 Z" fill={BC} />
        {/* Right thigh back */}
        <path d="M260,202 Q278,248 276,294 Q266,306 250,300 Q242,256 242,204 Z" fill={BC} />
        {/* Left lower leg back */}
        <path d="M180,294 Q174,324 176,358 Q184,368 202,364 Q208,332 206,300 Z" fill={BC} />
        {/* Right lower leg back */}
        <path d="M276,294 Q282,324 280,358 Q272,368 254,364 Q248,332 250,300 Z" fill={BC} />
        {/* Feet back */}
        <path d="M176,358 Q170,374 178,380 Q190,386 204,382 Q208,372 202,364 Z" fill={BC} />
        <path d="M280,358 Q286,374 278,380 Q266,386 252,382 Q246,372 254,364 Z" fill={BC} />

        {/* ══════════════════════════════════════════
            BACK MUSCLES
            ══════════════════════════════════════════ */}

        {/* ── Upper traps (prominent diamond on upper back) ── */}
        {M('trap-upper-l', 'M223,50 Q208,47 184,62 L188,78 Q204,63 225,56 Z')}
        {M('trap-upper-r', 'M233,50 Q248,47 272,62 L268,78 Q252,63 231,56 Z')}

        {/* ── Middle trapezius ── */}
        {M('trap-mid', 'M196,78 Q228,88 260,78 Q256,106 228,112 Q200,106 196,78 Z')}

        {/* ── Rhomboids ── */}
        {M('rhomboid', 'M214,110 Q228,118 242,110 Q238,134 228,140 Q218,134 214,110 Z')}

        {/* Trap/rhomboid definition line */}
        <path d="M196,78 Q228,88 260,78" stroke={DL} strokeWidth="0.8" fill="none" />

        {/* ── Posterior deltoid ── */}
        {M('delt-post-l', 'M178,64 Q168,70 166,98 Q168,110 180,108 Q190,90 188,78 Z')}
        {M('delt-post-r', 'M278,64 Q288,70 290,98 Q288,110 276,108 Q266,90 268,78 Z')}

        {/* ── Latissimus dorsi (large fan shape) ── */}
        {M('lat-l', 'M188,82 Q172,106 168,162 Q180,172 198,160 Q208,132 206,80 Z')}
        {M('lat-r', 'M268,82 Q284,106 288,162 Q276,172 258,160 Q248,132 250,80 Z')}

        {/* Lat separation line from rhomboid */}
        <path d="M196,110 Q184,134 180,162" stroke={DL} strokeWidth="0.7" fill="none" />
        <path d="M260,110 Q272,134 276,162" stroke={DL} strokeWidth="0.7" fill="none" />

        {/* ── Tricep long head ── */}
        {M('tricep-long-l', 'M180,82 Q166,104 164,138 Q172,148 184,144 Q190,120 188,86 Z')}
        {M('tricep-long-r', 'M276,82 Q290,104 292,138 Q284,148 272,144 Q266,120 268,86 Z')}

        {/* ── Tricep lateral head ── */}
        {M('tricep-lat-l', 'M188,86 Q180,114 182,138 Q190,146 196,142 Q196,120 192,88 Z')}
        {M('tricep-lat-r', 'M268,86 Q276,114 274,138 Q266,146 260,142 Q260,120 264,88 Z')}

        {/* Tricep definition line */}
        <path d="M188,86 Q184,112 184,136" stroke={DL} strokeWidth="0.7" fill="none" />
        <path d="M268,86 Q272,112 272,136" stroke={DL} strokeWidth="0.7" fill="none" />

        {/* ── Forearms back ── */}
        {M('forearm-back-l', 'M164,138 Q158,160 162,198 Q170,206 184,202 Q190,174 184,144 Z')}
        {M('forearm-back-r', 'M292,138 Q298,160 294,198 Q286,206 270,202 Q264,174 270,144 Z')}

        {/* ── Erector spinae (two columns flanking spine) ── */}
        {M('erector-l', 'M218,138 Q213,174 216,206 Q222,212 226,208 Q226,174 222,138 Z')}
        {M('erector-r', 'M238,138 Q243,174 240,206 Q234,212 230,208 Q230,174 234,138 Z')}

        {/* Spine definition line */}
        <line x1="228" y1="110" x2="228" y2="196" stroke={DL} strokeWidth="0.8" />

        {/* ── Gluteus maximus ── */}
        {M('glute-max-l', 'M196,200 Q178,218 176,250 Q190,262 210,252 Q216,232 214,202 Z')}
        {M('glute-max-r', 'M260,200 Q278,218 280,250 Q266,262 246,252 Q240,232 242,202 Z')}

        {/* Glute division line */}
        <path d="M196,200 Q214,236 210,254" stroke={DL} strokeWidth="0.8" fill="none" />
        <path d="M260,200 Q242,236 246,254" stroke={DL} strokeWidth="0.8" fill="none" />

        {/* ── Hamstring biceps femoris (outer) ── */}
        {M('hamstring-bf-l', 'M176,250 Q164,286 166,320 Q176,330 188,324 Q194,288 190,252 Z')}
        {M('hamstring-bf-r', 'M280,250 Q292,286 290,320 Q280,330 268,324 Q262,288 266,252 Z')}

        {/* ── Hamstring semitendinosus (inner) ── */}
        {M('hamstring-st-l', 'M190,252 Q192,290 188,324 Q198,332 210,322 Q212,286 214,202 Q210,232 200,252 Z')}
        {M('hamstring-st-r', 'M266,252 Q264,290 268,324 Q258,332 246,322 Q244,286 242,202 Q246,232 256,252 Z')}

        {/* Hamstring division */}
        <path d="M190,252 Q190,288 188,322" stroke={DL} strokeWidth="0.7" fill="none" />
        <path d="M266,252 Q266,288 268,322" stroke={DL} strokeWidth="0.7" fill="none" />

        {/* ── Calves — lateral + medial heads ── */}
        {M('calf-l', 'M166,320 Q158,346 162,364 Q170,372 182,364 Q188,344 184,322 Z')}
        <path d="M184,322 Q186,348 180,364 Q188,372 200,362 Q204,340 200,322 Z"
          fill={f('calf-l')} stroke={fs('calf-l')} strokeWidth={sw} strokeLinejoin="round" />

        {M('calf-r', 'M290,320 Q298,346 294,364 Q286,372 274,364 Q268,344 272,322 Z')}
        <path d="M272,322 Q270,348 276,364 Q284,372 296,362 Q300,340 296,322 Z"
          fill={f('calf-r')} stroke={fs('calf-r')} strokeWidth={sw} strokeLinejoin="round" />

        {/* Calf definition */}
        <path d="M184,322 Q184,344 182,362" stroke={DL} strokeWidth="0.7" fill="none" />
        <path d="M272,322 Q272,344 274,362" stroke={DL} strokeWidth="0.7" fill="none" />

        {/* ── Legend ── */}
        <g transform="translate(6,402)">
          <rect x="0" y="0" width="8" height="7" rx="1.5" fill="#ef4444" />
          <text x="11" y="6.5" fill="#6a8090" fontSize="6" fontFamily="sans-serif">Primer</text>
          <rect x="48" y="0" width="8" height="7" rx="1.5" fill="#f97316" />
          <text x="59" y="6.5" fill="#6a8090" fontSize="6" fontFamily="sans-serif">Sekonder</text>
          <rect x="108" y="0" width="8" height="7" rx="1.5" fill="#1b2d3e" />
          <text x="119" y="6.5" fill="#6a8090" fontSize="6" fontFamily="sans-serif">Pasif</text>
        </g>
      </svg>

      {!hasTarget && (
        <p className="text-xs text-gray-600 text-center">Kas grubunu görmek için egzersize tıkla</p>
      )}
    </div>
  );
}
