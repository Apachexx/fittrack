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

  // Inactive = transparent so the gray silhouette shows through
  const f = (id: string): string => {
    if (primary.has(id)) return '#ef4444';
    if (secondary.has(id)) return '#f97316';
    return 'none';
  };

  // Body silhouette color
  const BC = '#6b7a8a';
  // Muscle definition line color (slightly darker than silhouette)
  const DL = '#4a5a6a';
  const sw = '0.7';

  const hasTarget = !!target;
  const label = exerciseName ?? null;

  // Helper: render muscle path
  const M = (id: string, d: string) => {
    const fill = f(id);
    return (
      <path
        key={id}
        d={d}
        fill={fill}
        stroke={fill === 'none' ? DL : (primary.has(id) ? '#c53030' : '#c05020')}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    );
  };

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

      <svg viewBox="0 0 300 400" className="w-full max-w-[280px]" fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* ─── Labels ─── */}
        <text x="75" y="9" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="sans-serif" letterSpacing="1">ÖN</text>
        <text x="225" y="9" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="sans-serif" letterSpacing="1">ARKA</text>
        <line x1="150" y1="12" x2="150" y2="398" stroke="#1e2a35" strokeWidth="1.5" />

        {/* ════════════════════════════════════════
            FRONT SILHOUETTE (center x=75)
            Drawn first — muscle paths overlay on top
            ════════════════════════════════════════ */}

        {/* Head */}
        <ellipse cx="75" cy="20" rx="13" ry="15" fill={BC} />
        {/* Neck */}
        <path d="M68,34 L82,34 L82,50 L68,50 Z" fill={BC} />
        {/* Left trap slope (neck → shoulder) */}
        <path d="M68,50 Q54,48 40,62 L44,78 Q58,66 70,56 Z" fill={BC} />
        {/* Right trap slope */}
        <path d="M82,50 Q96,48 110,62 L106,78 Q92,66 80,56 Z" fill={BC} />
        {/* Left deltoid/shoulder cap */}
        <path d="M26,56 Q14,62 14,88 Q18,100 32,98 Q40,80 42,62 Z" fill={BC} />
        {/* Right deltoid/shoulder cap */}
        <path d="M124,56 Q136,62 136,88 Q132,100 118,98 Q110,80 108,62 Z" fill={BC} />
        {/* Main torso */}
        <path d="M40,62 Q75,52 110,62 L112,186 Q75,198 38,186 Z" fill={BC} />
        {/* Left upper arm */}
        <path d="M14,84 Q10,104 10,140 Q16,146 30,142 Q36,114 34,96 Z" fill={BC} />
        {/* Right upper arm */}
        <path d="M136,84 Q140,104 140,140 Q134,146 120,142 Q114,114 116,96 Z" fill={BC} />
        {/* Left forearm */}
        <path d="M10,140 Q6,162 8,196 Q16,202 30,198 Q34,166 34,144 Z" fill={BC} />
        {/* Right forearm */}
        <path d="M140,140 Q144,162 142,196 Q134,202 120,198 Q116,166 116,144 Z" fill={BC} />
        {/* Left hand */}
        <ellipse cx="19" cy="210" rx="11" ry="9" fill={BC} />
        {/* Right hand */}
        <ellipse cx="131" cy="210" rx="11" ry="9" fill={BC} />
        {/* Hip/pelvis */}
        <path d="M38,186 Q75,198 112,186 L114,204 Q75,214 36,204 Z" fill={BC} />
        {/* Left thigh */}
        <path d="M36,202 Q20,244 22,290 Q34,300 50,296 Q58,254 58,204 Z" fill={BC} />
        {/* Right thigh */}
        <path d="M114,202 Q130,244 128,290 Q116,300 100,296 Q92,254 92,204 Z" fill={BC} />
        {/* Left lower leg */}
        <path d="M22,290 Q18,318 20,352 Q28,362 46,358 Q52,328 50,298 Z" fill={BC} />
        {/* Right lower leg */}
        <path d="M128,290 Q132,318 130,352 Q122,362 104,358 Q98,328 100,298 Z" fill={BC} />
        {/* Left foot */}
        <path d="M20,352 Q16,368 22,376 Q34,382 48,378 Q52,366 50,354 Z" fill={BC} />
        {/* Right foot */}
        <path d="M130,352 Q134,368 128,376 Q116,382 102,378 Q98,366 100,354 Z" fill={BC} />

        {/* ════════ FRONT MUSCLES ════════ */}

        {/* Trap upper (front visible portion) */}
        {M('trap-upper-l', 'M68,50 Q54,48 40,62 L44,78 Q56,66 70,56 Z')}
        {M('trap-upper-r', 'M82,50 Q96,48 110,62 L106,78 Q94,66 80,56 Z')}

        {/* Medial deltoid */}
        {M('delt-mid-l', 'M26,56 Q14,62 14,88 Q18,100 30,98 Q38,80 42,62 Z')}
        {M('delt-mid-r', 'M124,56 Q136,62 136,88 Q132,100 120,98 Q112,80 108,62 Z')}

        {/* Anterior deltoid */}
        {M('delt-ant-l', 'M42,62 Q32,64 26,84 Q28,98 36,98 Q42,82 46,70 Z')}
        {M('delt-ant-r', 'M108,62 Q118,64 124,84 Q122,98 114,98 Q108,82 104,70 Z')}

        {/* Upper pectoralis */}
        {M('pec-upper-l', 'M70,56 Q58,54 44,70 Q50,84 62,84 Q68,72 72,62 Z')}
        {M('pec-upper-r', 'M80,56 Q92,54 106,70 Q100,84 88,84 Q82,72 78,62 Z')}

        {/* Lower pectoralis */}
        {M('pec-lower-l', 'M62,84 Q44,90 44,120 Q60,128 72,120 L72,62 Q68,72 62,84 Z')}
        {M('pec-lower-r', 'M88,84 Q106,90 106,120 Q90,128 78,120 L78,62 Q82,72 88,84 Z')}

        {/* Biceps */}
        {M('bicep-l', 'M18,84 Q10,104 10,136 Q18,142 30,138 Q36,114 34,96 Z')}
        {M('bicep-r', 'M132,84 Q140,104 140,136 Q132,142 120,138 Q114,114 116,96 Z')}

        {/* Brachialis */}
        {M('brachialis-l', 'M10,136 Q8,152 12,162 Q20,166 30,162 Q34,150 30,138 Z')}
        {M('brachialis-r', 'M140,136 Q142,152 138,162 Q130,166 120,162 Q116,150 120,138 Z')}

        {/* Forearms */}
        {M('forearm-l', 'M12,162 Q6,180 8,198 Q16,204 30,200 Q34,180 30,162 Z')}
        {M('forearm-r', 'M138,162 Q144,180 142,198 Q134,204 120,200 Q116,180 120,162 Z')}

        {/* Abs upper */}
        {M('abs-upper', 'M50,120 Q75,128 100,120 L100,146 Q75,152 50,146 Z')}

        {/* Abs lower */}
        {M('abs-lower', 'M50,146 Q75,152 100,146 L100,170 Q75,174 50,170 Z')}

        {/* Obliques */}
        {M('oblique-l', 'M40,120 Q32,136 34,170 Q42,178 50,170 L50,146 L50,120 Z')}
        {M('oblique-r', 'M110,120 Q118,136 116,170 Q108,178 100,170 L100,146 L100,120 Z')}

        {/* Adductors */}
        {M('adductor-l', 'M62,204 Q66,244 66,288 Q58,294 50,290 Q52,250 56,204 Z')}
        {M('adductor-r', 'M88,204 Q84,244 84,288 Q92,294 100,290 Q98,250 94,204 Z')}

        {/* Quad vastus lateralis */}
        {M('quad-vl-l', 'M36,204 Q20,244 22,286 Q34,296 46,292 Q52,252 54,204 Z')}
        {M('quad-vl-r', 'M114,204 Q130,244 128,286 Q116,296 104,292 Q98,252 96,204 Z')}

        {/* Quad rectus femoris */}
        {M('quad-rf-l', 'M54,204 Q50,246 52,288 Q60,294 66,290 Q68,248 64,204 Z')}
        {M('quad-rf-r', 'M96,204 Q100,246 98,288 Q90,294 84,290 Q82,248 86,204 Z')}

        {/* Quad vastus medialis (teardrop) */}
        {M('quad-vm-l', 'M52,254 Q44,272 48,286 Q56,294 66,288 Q68,272 60,252 Z')}
        {M('quad-vm-r', 'M98,254 Q106,272 102,286 Q94,294 84,288 Q82,272 90,252 Z')}

        {/* Tibialis anterior */}
        {M('tibialis-l', 'M26,292 Q20,316 22,348 Q30,358 44,354 Q48,326 48,296 Z')}
        {M('tibialis-r', 'M124,292 Q130,316 128,348 Q120,358 106,354 Q102,326 102,296 Z')}


        {/* ════════════════════════════════════════
            BACK SILHOUETTE (center x=225, offset +150)
            ════════════════════════════════════════ */}

        {/* Head */}
        <ellipse cx="225" cy="20" rx="13" ry="15" fill={BC} />
        {/* Neck */}
        <path d="M218,34 L232,34 L232,50 L218,50 Z" fill={BC} />
        {/* Left trap slope */}
        <path d="M218,50 Q204,48 190,62 L194,78 Q208,66 220,56 Z" fill={BC} />
        {/* Right trap slope */}
        <path d="M232,50 Q246,48 260,62 L256,78 Q242,66 230,56 Z" fill={BC} />
        {/* Left shoulder cap */}
        <path d="M176,56 Q164,62 164,88 Q168,100 182,98 Q190,80 192,62 Z" fill={BC} />
        {/* Right shoulder cap */}
        <path d="M274,56 Q286,62 286,88 Q282,100 268,98 Q260,80 258,62 Z" fill={BC} />
        {/* Main torso back */}
        <path d="M190,62 Q225,52 260,62 L262,186 Q225,198 188,186 Z" fill={BC} />
        {/* Left upper arm back */}
        <path d="M164,84 Q160,104 160,140 Q166,146 180,142 Q186,114 184,96 Z" fill={BC} />
        {/* Right upper arm back */}
        <path d="M286,84 Q290,104 290,140 Q284,146 270,142 Q264,114 266,96 Z" fill={BC} />
        {/* Left forearm back */}
        <path d="M160,140 Q156,162 158,196 Q166,202 180,198 Q184,166 184,144 Z" fill={BC} />
        {/* Right forearm back */}
        <path d="M290,140 Q294,162 292,196 Q284,202 270,198 Q266,166 266,144 Z" fill={BC} />
        {/* Hands */}
        <ellipse cx="169" cy="210" rx="11" ry="9" fill={BC} />
        <ellipse cx="281" cy="210" rx="11" ry="9" fill={BC} />
        {/* Hip/pelvis back */}
        <path d="M188,186 Q225,198 262,186 L264,204 Q225,214 186,204 Z" fill={BC} />
        {/* Left thigh back */}
        <path d="M186,202 Q170,244 172,290 Q184,300 200,296 Q208,254 208,204 Z" fill={BC} />
        {/* Right thigh back */}
        <path d="M264,202 Q280,244 278,290 Q266,300 250,296 Q242,254 242,204 Z" fill={BC} />
        {/* Left lower leg back */}
        <path d="M172,290 Q168,318 170,352 Q178,362 196,358 Q202,328 200,298 Z" fill={BC} />
        {/* Right lower leg back */}
        <path d="M278,290 Q282,318 280,352 Q272,362 254,358 Q248,328 250,298 Z" fill={BC} />
        {/* Feet back */}
        <path d="M170,352 Q166,368 172,376 Q184,382 198,378 Q202,366 200,354 Z" fill={BC} />
        <path d="M280,352 Q284,368 278,376 Q266,382 252,378 Q248,366 250,354 Z" fill={BC} />

        {/* ════════ BACK MUSCLES ════════ */}

        {/* Trap upper */}
        {M('trap-upper-l', 'M218,50 Q204,48 190,62 L194,78 Q208,66 220,56 Z')}
        {M('trap-upper-r', 'M232,50 Q246,48 260,62 L256,78 Q242,66 230,56 Z')}

        {/* Trap middle */}
        {M('trap-mid', 'M200,76 Q225,84 250,76 Q246,104 225,110 Q204,104 200,76 Z')}

        {/* Rhomboids */}
        {M('rhomboid', 'M212,108 Q225,114 238,108 Q234,130 225,136 Q216,130 212,108 Z')}

        {/* Posterior deltoid */}
        {M('delt-post-l', 'M192,62 Q180,62 172,86 Q174,100 184,98 Q192,82 194,70 Z')}
        {M('delt-post-r', 'M258,62 Q270,62 278,86 Q276,100 266,98 Q258,82 256,70 Z')}

        {/* Lats */}
        {M('lat-l', 'M184,96 Q168,116 166,162 Q178,170 194,160 Q204,134 204,76 Z')}
        {M('lat-r', 'M266,96 Q282,116 284,162 Q272,170 256,160 Q246,134 246,76 Z')}

        {/* Tricep long head */}
        {M('tricep-long-l', 'M172,86 Q160,106 160,136 Q168,142 180,138 Q182,114 182,96 Z')}
        {M('tricep-long-r', 'M278,86 Q290,106 290,136 Q282,142 270,138 Q268,114 268,96 Z')}

        {/* Tricep lateral head */}
        {M('tricep-lat-l', 'M182,96 Q172,114 174,136 Q182,142 188,138 Q188,116 186,96 Z')}
        {M('tricep-lat-r', 'M268,96 Q278,114 276,136 Q268,142 262,138 Q262,116 264,96 Z')}

        {/* Forearms back */}
        {M('forearm-back-l', 'M160,136 Q156,156 158,196 Q166,202 180,198 Q184,168 180,138 Z')}
        {M('forearm-back-r', 'M290,136 Q294,156 292,196 Q284,202 270,198 Q266,168 270,138 Z')}

        {/* Erector spinae */}
        {M('erector-l', 'M216,134 Q212,170 212,204 Q220,210 224,204 Q224,170 220,134 Z')}
        {M('erector-r', 'M234,134 Q238,170 238,204 Q230,210 226,204 Q226,170 230,134 Z')}

        {/* Glutes */}
        {M('glute-max-l', 'M186,202 Q172,218 170,248 Q182,258 196,250 Q202,232 202,204 Z')}
        {M('glute-max-r', 'M264,202 Q278,218 280,248 Q268,258 254,250 Q248,232 248,204 Z')}

        {/* Hamstring biceps femoris (outer) */}
        {M('hamstring-bf-l', 'M170,248 Q160,280 162,316 Q172,324 182,318 Q186,284 184,250 Z')}
        {M('hamstring-bf-r', 'M280,248 Q290,280 288,316 Q278,324 268,318 Q264,284 266,250 Z')}

        {/* Hamstring semitendinosus (inner) */}
        {M('hamstring-st-l', 'M184,250 Q184,286 182,318 Q192,326 202,316 Q204,282 204,204 Q202,232 196,250 Z')}
        {M('hamstring-st-r', 'M266,250 Q266,286 268,318 Q258,326 248,316 Q246,282 246,204 Q248,232 254,250 Z')}

        {/* Calves (back) */}
        {M('calf-l', 'M162,316 Q154,340 158,358 Q168,366 178,358 Q184,338 182,318 Z')}
        <path d="M182,318 Q184,340 180,358 Q188,366 198,356 Q200,336 196,316 Z"
          fill={f('calf-l')}
          stroke={f('calf-l') === 'none' ? DL : '#c53030'}
          strokeWidth={sw} />
        {M('calf-r', 'M288,316 Q296,340 292,358 Q282,366 272,358 Q266,338 268,318 Z')}
        <path d="M268,318 Q266,340 270,358 Q278,366 288,356 Q290,336 282,314 Z"
          fill={f('calf-r')}
          stroke={f('calf-r') === 'none' ? DL : '#c53030'}
          strokeWidth={sw} />

        {/* ─── Legend ─── */}
        <g transform="translate(8, 390)">
          <rect x="0" y="0" width="8" height="8" rx="2" fill="#ef4444" />
          <text x="11" y="7" fill="#94a3b8" fontSize="6.5" fontFamily="sans-serif">Primer</text>
          <rect x="44" y="0" width="8" height="8" rx="2" fill="#f97316" />
          <text x="55" y="7" fill="#94a3b8" fontSize="6.5" fontFamily="sans-serif">Sekonder</text>
        </g>
      </svg>

      {!hasTarget && (
        <p className="text-xs text-gray-600 text-center">Kas grubunu görmek için egzersize tıkla</p>
      )}
    </div>
  );
}
