interface MuscleTarget { primary: string[]; secondary: string[] }

const EXERCISE_MUSCLES: Record<string, MuscleTarget> = {
  'Bench Press': { primary: ['pec-l','pec-r'], secondary: ['delt-ant-l','delt-ant-r','tri-l','tri-r'] },
  'Incline Bench Press': { primary: ['pec-upper-l','pec-upper-r'], secondary: ['pec-l','pec-r','delt-ant-l','delt-ant-r','tri-l','tri-r'] },
  'Smith Machine Low Incline Press': { primary: ['pec-upper-l','pec-upper-r','pec-l','pec-r'], secondary: ['delt-ant-l','delt-ant-r','tri-l','tri-r'] },
  'Chest Fly Machine': { primary: ['pec-l','pec-r','pec-upper-l','pec-upper-r'], secondary: ['delt-ant-l','delt-ant-r'] },
  'Dumbbell Fly': { primary: ['pec-l','pec-r'], secondary: ['pec-upper-l','pec-upper-r','delt-ant-l','delt-ant-r'] },
  'Cable Crossover': { primary: ['pec-l','pec-r'], secondary: ['pec-upper-l','pec-upper-r','delt-ant-l','delt-ant-r'] },
  'Push-up': { primary: ['pec-l','pec-r'], secondary: ['delt-ant-l','delt-ant-r','tri-l','tri-r'] },
  'Pull-up': { primary: ['lat-l','lat-r'], secondary: ['bi-l','bi-r','brachialis-l','brachialis-r','rhomboid','trap-mid','delt-post-l','delt-post-r'] },
  'Barbell Row': { primary: ['lat-l','lat-r','rhomboid'], secondary: ['trap-upper-l','trap-upper-r','trap-mid','delt-post-l','delt-post-r','bi-l','bi-r','erector-l','erector-r'] },
  'Lat Pulldown': { primary: ['lat-l','lat-r'], secondary: ['bi-l','bi-r','brachialis-l','brachialis-r','rhomboid','trap-mid'] },
  'Seated Cable Row': { primary: ['rhomboid','trap-mid'], secondary: ['lat-l','lat-r','bi-l','bi-r','delt-post-l','delt-post-r'] },
  'Cable Row': { primary: ['rhomboid','trap-mid','lat-l','lat-r'], secondary: ['bi-l','bi-r','delt-post-l','delt-post-r'] },
  'Cable Rear Delt Fly': { primary: ['delt-post-l','delt-post-r'], secondary: ['rhomboid','trap-mid','trap-upper-l','trap-upper-r'] },
  'Plate Loaded Wide Grip Row': { primary: ['lat-l','lat-r','rhomboid'], secondary: ['trap-mid','trap-upper-l','trap-upper-r','delt-post-l','delt-post-r','bi-l','bi-r'] },
  'Deadlift': { primary: ['erector-l','erector-r','glute-l','glute-r','ham-l','ham-r'], secondary: ['trap-upper-l','trap-upper-r','quad-l','quad-r','forearm-l','forearm-r'] },
  'Squat': { primary: ['quad-l','quad-r','quad-vm-l','quad-vm-r','glute-l','glute-r'], secondary: ['ham-l','ham-r','erector-l','erector-r','adductor-l','adductor-r'] },
  'Smith Machine Squat': { primary: ['quad-l','quad-r','quad-vm-l','quad-vm-r'], secondary: ['glute-l','glute-r','ham-l','ham-r'] },
  'Leg Press': { primary: ['quad-l','quad-r','quad-vm-l','quad-vm-r'], secondary: ['glute-l','glute-r','ham-l','ham-r','adductor-l','adductor-r'] },
  'Romanian Deadlift': { primary: ['ham-l','ham-r','glute-l','glute-r'], secondary: ['erector-l','erector-r','adductor-l','adductor-r'] },
  'Leg Curl': { primary: ['ham-l','ham-r'], secondary: ['calf-l','calf-r'] },
  'Seated Leg Curl': { primary: ['ham-l','ham-r'], secondary: [] },
  'Leg Extension': { primary: ['quad-l','quad-r','quad-vm-l','quad-vm-r'], secondary: [] },
  'Lunge': { primary: ['quad-l','quad-r','glute-l','glute-r'], secondary: ['quad-vm-l','quad-vm-r','ham-l','ham-r','adductor-l','adductor-r'] },
  'Overhead Press': { primary: ['delt-ant-l','delt-ant-r','delt-mid-l','delt-mid-r'], secondary: ['tri-l','tri-r','trap-upper-l','trap-upper-r'] },
  'Shoulder Press Machine': { primary: ['delt-ant-l','delt-ant-r','delt-mid-l','delt-mid-r'], secondary: ['tri-l','tri-r','trap-upper-l','trap-upper-r'] },
  'Dumbbell Lateral Raise': { primary: ['delt-mid-l','delt-mid-r'], secondary: ['delt-ant-l','delt-ant-r','trap-upper-l','trap-upper-r'] },
  'Lateral Raise': { primary: ['delt-mid-l','delt-mid-r'], secondary: ['delt-ant-l','delt-ant-r','trap-upper-l','trap-upper-r'] },
  'Front Raise': { primary: ['delt-ant-l','delt-ant-r'], secondary: ['delt-mid-l','delt-mid-r','pec-upper-l','pec-upper-r'] },
  'Face Pull': { primary: ['delt-post-l','delt-post-r'], secondary: ['rhomboid','trap-mid','trap-upper-l','trap-upper-r'] },
  'Bicep Curl': { primary: ['bi-l','bi-r'], secondary: ['brachialis-l','brachialis-r','forearm-l','forearm-r'] },
  'Hammer Curl': { primary: ['brachialis-l','brachialis-r','forearm-l','forearm-r'], secondary: ['bi-l','bi-r'] },
  'Cable Curl': { primary: ['bi-l','bi-r'], secondary: ['brachialis-l','brachialis-r','forearm-l','forearm-r'] },
  'Incline Dumbbell Curl': { primary: ['bi-l','bi-r'], secondary: ['brachialis-l','brachialis-r'] },
  'Tricep Pushdown': { primary: ['tri-l','tri-r'], secondary: [] },
  'Overhead Rope Extension': { primary: ['tri-l','tri-r'], secondary: [] },
  'Skull Crusher': { primary: ['tri-l','tri-r'], secondary: [] },
  'Plank': { primary: ['abs','oblique-l','oblique-r'], secondary: ['erector-l','erector-r','glute-l','glute-r'] },
  'Crunch': { primary: ['abs'], secondary: ['oblique-l','oblique-r'] },
  'Russian Twist': { primary: ['oblique-l','oblique-r'], secondary: ['abs'] },
  'Treadmill': { primary: ['quad-l','quad-r','ham-l','ham-r','calf-l','calf-r'], secondary: ['glute-l','glute-r'] },
  'Cycling': { primary: ['quad-l','quad-r'], secondary: ['glute-l','glute-r','ham-l','ham-r','calf-l','calf-r'] },
  'Jump Rope': { primary: ['calf-l','calf-r'], secondary: ['quad-l','quad-r','ham-l','ham-r'] },
};

const GROUP_FALLBACK: Record<string, MuscleTarget> = {
  chest: { primary: ['pec-l','pec-r','pec-upper-l','pec-upper-r'], secondary: ['delt-ant-l','delt-ant-r'] },
  back: { primary: ['lat-l','lat-r','rhomboid','trap-mid'], secondary: ['delt-post-l','delt-post-r','trap-upper-l','trap-upper-r'] },
  legs: { primary: ['quad-l','quad-r','glute-l','glute-r'], secondary: ['ham-l','ham-r','calf-l','calf-r'] },
  shoulders: { primary: ['delt-ant-l','delt-ant-r','delt-mid-l','delt-mid-r'], secondary: ['delt-post-l','delt-post-r','trap-upper-l','trap-upper-r'] },
  arms: { primary: ['bi-l','bi-r','tri-l','tri-r'], secondary: ['brachialis-l','brachialis-r','forearm-l','forearm-r'] },
  core: { primary: ['abs','oblique-l','oblique-r'], secondary: ['erector-l','erector-r'] },
  cardio: { primary: ['quad-l','quad-r','ham-l','ham-r','calf-l','calf-r'], secondary: ['glute-l','glute-r'] },
};

interface BodyMapProps {
  exerciseName?: string | null;
  muscleGroup?: string | null;
}

export default function BodyMap({ exerciseName, muscleGroup }: BodyMapProps) {
  const target: MuscleTarget | null =
    (exerciseName && EXERCISE_MUSCLES[exerciseName]) ? EXERCISE_MUSCLES[exerciseName]
    : (muscleGroup && GROUP_FALLBACK[muscleGroup]) ? GROUP_FALLBACK[muscleGroup]
    : null;

  const primary = new Set(target?.primary ?? []);
  const secondary = new Set(target?.secondary ?? []);

  const fill = (id: string) => primary.has(id) ? '#ef4444' : secondary.has(id) ? '#f97316' : '#253545';
  const stroke = (id: string) => primary.has(id) ? '#7f1d1d' : secondary.has(id) ? '#7c2d12' : '#1a2a38';

  const M = (id: string, d: string, extra?: React.SVGProps<SVGPathElement>) => (
    <path d={d} fill={fill(id)} stroke={stroke(id)} strokeWidth="0.8" strokeLinejoin="round" strokeLinecap="round" {...extra} />
  );

  // Body color (dark blue-gray)
  const B = '#1c2d3c';
  // Skin lines
  const S = '#131f2a';

  const hasTarget = !!target;

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {exerciseName && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            {exerciseName}
          </span>
          {hasTarget && secondary.size > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }}>
              +yardımcı
            </span>
          )}
        </div>
      )}

      <svg viewBox="0 0 260 440" className="w-full max-w-[260px]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="ms">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Labels */}
        <text x="65" y="9" textAnchor="middle" fill="#3d5a6e" fontSize="7" fontFamily="sans-serif" letterSpacing="1.5" fontWeight="700">ÖN</text>
        <text x="195" y="9" textAnchor="middle" fill="#3d5a6e" fontSize="7" fontFamily="sans-serif" letterSpacing="1.5" fontWeight="700">ARKA</text>
        <line x1="130" y1="12" x2="130" y2="432" stroke="#14202b" strokeWidth="1.5" />

        {/* ═══════════════════════════════════════
            FRONT VIEW  (centered x=65)
            ═══════════════════════════════════════ */}

        {/* —— Body silhouette —— */}
        {/* Head */}
        <ellipse cx="65" cy="26" rx="14" ry="17" fill={B} />
        {/* Neck */}
        <path d="M59,42 Q62,37 65,36 Q68,37 71,42 L70,57 L60,57 Z" fill={B} />
        {/* Left trapezius slope neck→shoulder */}
        <path d="M60,57 Q44,53 20,68 L24,82 Q42,67 61,62 Z" fill={B} />
        {/* Right trapezius slope */}
        <path d="M70,57 Q86,53 110,68 L106,82 Q88,67 69,62 Z" fill={B} />
        {/* Left deltoid cap */}
        <path d="M12,64 Q2,72 2,100 Q4,116 16,114 Q28,94 24,80 Z" fill={B} />
        {/* Right deltoid cap */}
        <path d="M118,64 Q128,72 128,100 Q126,116 114,114 Q102,94 106,80 Z" fill={B} />
        {/* Torso — natural hourglass */}
        <path d="M24,80 C18,108 18,144 34,162 C32,175 34,188 38,196 L92,196 C96,188 98,175 96,162 C112,144 112,108 106,80 Q65,64 24,80 Z" fill={B} />
        {/* Left upper arm */}
        <path d="M12,64 Q0,76 0,106 Q0,128 6,144 Q14,152 26,148 Q34,126 30,98 Z" fill={B} />
        {/* Right upper arm */}
        <path d="M118,64 Q130,76 130,106 Q130,128 124,144 Q116,152 104,148 Q96,126 100,98 Z" fill={B} />
        {/* Left forearm */}
        <path d="M6,144 Q0,166 2,198 Q10,206 24,202 Q32,176 26,148 Z" fill={B} />
        {/* Right forearm */}
        <path d="M124,144 Q130,166 128,198 Q120,206 106,202 Q98,176 104,148 Z" fill={B} />
        {/* Hands */}
        <ellipse cx="14" cy="212" rx="11" ry="8" fill={B} />
        <ellipse cx="116" cy="212" rx="11" ry="8" fill={B} />
        {/* Pelvis */}
        <path d="M36,194 L38,208 Q65,218 92,208 L94,194 Q65,204 36,194 Z" fill={B} />
        {/* Left thigh */}
        <path d="M34,206 Q16,252 18,298 Q28,310 48,304 Q56,258 56,206 Z" fill={B} />
        {/* Right thigh */}
        <path d="M96,206 Q114,252 112,298 Q102,310 82,304 Q74,258 74,206 Z" fill={B} />
        {/* Left lower leg */}
        <path d="M18,298 Q12,328 14,362 Q22,372 42,368 Q48,336 48,304 Z" fill={B} />
        {/* Right lower leg */}
        <path d="M112,298 Q118,328 116,362 Q108,372 88,368 Q82,336 82,304 Z" fill={B} />
        {/* Feet */}
        <path d="M14,362 Q8,378 16,384 Q28,390 44,386 Q48,376 42,368 Z" fill={B} />
        <path d="M116,362 Q122,378 114,384 Q102,390 86,386 Q80,376 88,368 Z" fill={B} />

        {/* —— Front muscles —— */}

        {/* Traps (front visible: neck slopes) */}
        {M('trap-upper-l', 'M60,57 Q44,53 20,68 L24,82 Q42,67 61,62 Z')}
        {M('trap-upper-r', 'M70,57 Q86,53 110,68 L106,82 Q88,67 69,62 Z')}

        {/* Lateral deltoid */}
        {M('delt-mid-l', 'M12,64 Q2,72 2,100 Q4,114 16,112 Q28,92 24,80 Z')}
        {M('delt-mid-r', 'M118,64 Q128,72 128,100 Q126,114 114,112 Q102,92 106,80 Z')}

        {/* Anterior deltoid — teardrop at front of shoulder */}
        {M('delt-ant-l', 'M24,80 Q14,86 14,110 Q16,120 26,118 Q36,104 36,84 Z')}
        {M('delt-ant-r', 'M106,80 Q116,86 116,110 Q114,120 104,118 Q94,104 94,84 Z')}

        {/* Upper pectoralis — upper fan */}
        {M('pec-upper-l', 'M61,62 Q46,58 30,76 Q36,92 50,94 Q58,82 65,66 Z')}
        {M('pec-upper-r', 'M69,62 Q84,58 100,76 Q94,92 80,94 Q72,82 65,66 Z')}

        {/* Lower pectoralis — main fan shape */}
        {M('pec-l', 'M50,94 Q30,100 30,128 Q44,138 60,132 Q66,118 62,96 Z')}
        {M('pec-r', 'M80,94 Q100,100 100,128 Q86,138 70,132 Q64,118 68,96 Z')}

        {/* Pec bottom fold line */}
        <path d="M30,128 Q65,138 100,128" stroke={S} strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Sternum / pec center line */}
        <path d="M65,62 L65,138" stroke={S} strokeWidth="0.8" fill="none" />

        {/* Bicep */}
        {M('bi-l', 'M14,102 Q2,124 4,140 Q12,150 24,146 Q32,128 28,108 Z')}
        {M('bi-r', 'M116,102 Q128,124 126,140 Q118,150 106,146 Q98,128 102,108 Z')}

        {/* Brachialis — small oval at elbow */}
        {M('brachialis-l', 'M4,140 Q2,152 6,162 Q14,168 22,164 Q26,152 24,146 Z')}
        {M('brachialis-r', 'M126,140 Q128,152 124,162 Q116,168 108,164 Q104,152 106,146 Z')}

        {/* Forearms */}
        {M('forearm-l', 'M6,162 Q0,180 2,198 Q10,206 24,202 Q30,180 22,164 Z')}
        {M('forearm-r', 'M124,162 Q130,180 128,198 Q120,206 106,202 Q110,180 108,164 Z')}

        {/* Serratus anterior (finger marks on ribcage) */}
        <path d="M30,92 Q24,104 26,116 M30,104 Q22,116 24,128 M30,116 Q22,128 24,140" stroke={S} strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M100,92 Q106,104 104,116 M100,104 Q108,116 106,128 M100,116 Q108,128 106,140" stroke={S} strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Abs (6-pack with linea alba) */}
        {M('abs', 'M44,130 Q65,138 86,130 L84,172 Q65,178 46,172 Z')}
        {/* Abs grid */}
        <line x1="65" y1="128" x2="65" y2="178" stroke={S} strokeWidth="0.9" />
        <line x1="44" y1="146" x2="86" y2="146" stroke={S} strokeWidth="0.8" />
        <line x1="44" y1="160" x2="86" y2="160" stroke={S} strokeWidth="0.8" />
        <line x1="44" y1="172" x2="86" y2="172" stroke={S} strokeWidth="0.8" />

        {/* Obliques */}
        {M('oblique-l', 'M30,128 Q22,148 24,174 Q30,182 44,176 L46,172 L44,130 Z')}
        {M('oblique-r', 'M100,128 Q108,148 106,174 Q100,182 86,176 L84,172 L86,130 Z')}

        {/* Adductors (inner thigh) */}
        {M('adductor-l', 'M56,206 Q58,250 58,292 Q52,300 44,296 Q48,250 50,206 Z')}
        {M('adductor-r', 'M74,206 Q72,250 72,292 Q78,300 86,296 Q82,250 80,206 Z')}

        {/* Quads vastus lateralis (outer thigh) */}
        {M('quad-l', 'M34,204 Q18,250 20,294 Q28,306 46,300 Q54,256 52,204 Z')}
        {M('quad-r', 'M96,204 Q112,250 110,294 Q102,306 84,300 Q76,256 78,204 Z')}

        {/* Quad vastus medialis (teardrop inner knee) */}
        {M('quad-vm-l', 'M50,258 Q40,276 44,292 Q54,302 62,296 Q64,278 56,256 Z')}
        {M('quad-vm-r', 'M80,258 Q90,276 86,292 Q76,302 68,296 Q66,278 74,256 Z')}

        {/* Quad definition line */}
        <path d="M52,204 Q50,248 48,290" stroke={S} strokeWidth="0.8" fill="none" />
        <path d="M78,204 Q80,248 82,290" stroke={S} strokeWidth="0.8" fill="none" />

        {/* Tibialis anterior (shin) */}
        <path d="M22,296 Q16,320 18,356 Q26,364 40,360 Q44,330 44,300 Z"
          fill={fill('quad-l')} stroke={stroke('quad-l')} strokeWidth="0.8" />
        <path d="M108,296 Q114,320 112,356 Q104,364 90,360 Q86,330 86,300 Z"
          fill={fill('quad-r')} stroke={stroke('quad-r')} strokeWidth="0.8" />

        {/* ═══════════════════════════════════════
            BACK VIEW  (centered x=195)
            ═══════════════════════════════════════ */}

        {/* —— Body silhouette —— */}
        <ellipse cx="195" cy="26" rx="14" ry="17" fill={B} />
        <path d="M189,42 Q192,37 195,36 Q198,37 201,42 L200,57 L190,57 Z" fill={B} />
        {/* Left trap slope */}
        <path d="M190,57 Q174,53 150,68 L154,82 Q172,67 191,62 Z" fill={B} />
        {/* Right trap slope */}
        <path d="M200,57 Q216,53 240,68 L236,82 Q218,67 199,62 Z" fill={B} />
        {/* Left shoulder cap */}
        <path d="M142,64 Q132,72 132,100 Q134,116 146,114 Q158,94 154,80 Z" fill={B} />
        {/* Right shoulder cap */}
        <path d="M248,64 Q258,72 258,100 Q256,116 244,114 Q232,94 236,80 Z" fill={B} />
        {/* Torso back */}
        <path d="M154,80 C148,108 148,144 164,162 C162,175 164,188 168,196 L222,196 C226,188 228,175 226,162 C242,144 242,108 236,80 Q195,64 154,80 Z" fill={B} />
        {/* Left upper arm back */}
        <path d="M142,64 Q130,76 130,106 Q130,128 136,144 Q144,152 156,148 Q164,126 160,98 Z" fill={B} />
        {/* Right upper arm back */}
        <path d="M248,64 Q260,76 260,106 Q260,128 254,144 Q246,152 234,148 Q226,126 230,98 Z" fill={B} />
        {/* Left forearm back */}
        <path d="M136,144 Q130,166 132,198 Q140,206 154,202 Q162,176 156,148 Z" fill={B} />
        {/* Right forearm back */}
        <path d="M254,144 Q260,166 258,198 Q250,206 236,202 Q228,176 234,148 Z" fill={B} />
        {/* Hands */}
        <ellipse cx="144" cy="212" rx="11" ry="8" fill={B} />
        <ellipse cx="246" cy="212" rx="11" ry="8" fill={B} />
        {/* Pelvis back */}
        <path d="M166,194 L168,208 Q195,218 222,208 L224,194 Q195,204 166,194 Z" fill={B} />
        {/* Left thigh back */}
        <path d="M164,206 Q146,252 148,298 Q158,310 178,304 Q186,258 186,206 Z" fill={B} />
        {/* Right thigh back */}
        <path d="M226,206 Q244,252 242,298 Q232,310 212,304 Q204,258 204,206 Z" fill={B} />
        {/* Left lower leg back */}
        <path d="M148,298 Q142,328 144,362 Q152,372 172,368 Q178,336 178,304 Z" fill={B} />
        {/* Right lower leg back */}
        <path d="M242,298 Q248,328 246,362 Q238,372 218,368 Q212,336 212,304 Z" fill={B} />
        {/* Feet back */}
        <path d="M144,362 Q138,378 146,384 Q158,390 174,386 Q178,376 172,368 Z" fill={B} />
        <path d="M246,362 Q252,378 244,384 Q232,390 216,386 Q210,376 218,368 Z" fill={B} />

        {/* —— Back muscles —— */}

        {/* Upper trapezius — large diamond from neck to mid-back */}
        {M('trap-upper-l', 'M190,57 Q174,53 150,68 L154,82 Q172,67 191,62 Z')}
        {M('trap-upper-r', 'M200,57 Q216,53 240,68 L236,82 Q218,67 199,62 Z')}

        {/* Middle trapezius — fills between shoulder blades */}
        {M('trap-mid', 'M160,80 Q195,92 230,80 Q226,110 195,118 Q164,110 160,80 Z')}

        {/* Rhomboids — between/below mid-traps */}
        {M('rhomboid', 'M176,116 Q195,124 214,116 Q210,140 195,148 Q180,140 176,116 Z')}

        {/* Spine definition */}
        <line x1="195" y1="80" x2="195" y2="196" stroke={S} strokeWidth="0.9" />
        <path d="M160,80 Q195,92 230,80" stroke={S} strokeWidth="0.9" fill="none" />

        {/* Posterior deltoid — teardrop back shoulder */}
        {M('delt-post-l', 'M142,64 Q132,72 132,100 Q134,114 146,112 Q158,92 154,80 Z')}
        {M('delt-post-r', 'M248,64 Q258,72 258,100 Q256,114 244,112 Q232,92 236,80 Z')}

        {/* Lateral deltoid back */}
        {M('delt-mid-l', 'M154,80 Q144,88 142,110 Q144,120 154,118 Q162,104 160,84 Z')}
        {M('delt-mid-r', 'M236,80 Q246,88 248,110 Q246,120 236,118 Q228,104 230,84 Z')}

        {/* Latissimus dorsi — large V-shape fan */}
        {M('lat-l', 'M158,84 Q142,110 140,164 Q152,174 170,162 Q180,136 178,82 Z')}
        {M('lat-r', 'M232,84 Q248,110 250,164 Q238,174 220,162 Q210,136 212,82 Z')}

        {/* Lat edge line */}
        <path d="M178,90 Q168,126 166,160" stroke={S} strokeWidth="0.8" fill="none" />
        <path d="M212,90 Q222,126 224,160" stroke={S} strokeWidth="0.8" fill="none" />

        {/* Triceps — long head (back of upper arm) */}
        {M('tri-l', 'M154,80 Q134,100 132,140 Q140,152 154,148 Q162,126 160,84 Z')}
        {M('tri-r', 'M236,80 Q256,100 258,140 Q250,152 236,148 Q228,126 230,84 Z')}

        {/* Tricep separation line */}
        <path d="M160,84 Q156,114 156,140" stroke={S} strokeWidth="0.7" fill="none" />
        <path d="M230,84 Q234,114 234,140" stroke={S} strokeWidth="0.7" fill="none" />

        {/* Forearms back */}
        {M('forearm-l', 'M136,144 Q128,166 132,198 Q140,206 154,202 Q160,178 154,148 Z')}
        {M('forearm-r', 'M254,144 Q262,166 258,198 Q250,206 236,202 Q230,178 236,148 Z')}

        {/* Erector spinae (two pillars beside spine) */}
        {M('erector-l', 'M186,148 Q181,176 184,208 Q190,214 194,208 Q194,176 190,148 Z')}
        {M('erector-r', 'M204,148 Q209,176 206,208 Q200,214 196,208 Q196,176 200,148 Z')}

        {/* Gluteus maximus — large rounded */}
        {M('glute-l', 'M164,204 Q146,222 146,256 Q160,268 180,258 Q186,238 186,206 Z')}
        {M('glute-r', 'M226,204 Q244,222 244,256 Q230,268 210,258 Q204,238 204,206 Z')}

        {/* Glute crease */}
        <path d="M166,204 Q184,240 180,260" stroke={S} strokeWidth="0.9" fill="none" />
        <path d="M224,204 Q206,240 210,260" stroke={S} strokeWidth="0.9" fill="none" />
        {/* Glute divide (center) */}
        <path d="M195,196 Q195,228 195,260" stroke={S} strokeWidth="1" fill="none" />

        {/* Hamstrings — two heads */}
        {M('ham-l', 'M146,256 Q136,292 138,326 Q150,338 168,330 Q176,294 176,260 Z')}
        {M('ham-r', 'M244,256 Q254,292 252,326 Q240,338 222,330 Q214,294 214,260 Z')}

        {/* Ham separation */}
        <path d="M174,260 Q170,294 168,328" stroke={S} strokeWidth="0.8" fill="none" />
        <path d="M216,260 Q220,294 222,328" stroke={S} strokeWidth="0.8" fill="none" />

        {/* Calves — medial + lateral heads */}
        {M('calf-l', 'M138,326 Q130,350 134,370 Q142,378 158,372 Q164,350 162,330 Z')}
        <path d="M162,330 Q164,352 158,370 Q166,378 178,368 Q180,346 176,328 Z"
          fill={fill('calf-l')} stroke={stroke('calf-l')} strokeWidth="0.8" />
        {M('calf-r', 'M252,326 Q260,350 256,370 Q248,378 232,372 Q226,350 228,330 Z')}
        <path d="M228,330 Q226,352 232,370 Q224,378 212,368 Q210,346 214,328 Z"
          fill={fill('calf-r')} stroke={stroke('calf-r')} strokeWidth="0.8" />

        {/* Calf separation */}
        <path d="M162,330 Q160,352 158,370" stroke={S} strokeWidth="0.7" fill="none" />
        <path d="M228,330 Q230,352 232,370" stroke={S} strokeWidth="0.7" fill="none" />

        {/* ── Legend ── */}
        <g transform="translate(5,424)">
          <rect x="0" y="0" width="8" height="7" rx="1.5" fill="#ef4444" />
          <text x="11" y="6.5" fill="#4a6070" fontSize="6.5" fontFamily="sans-serif">Primer</text>
          <rect x="50" y="0" width="8" height="7" rx="1.5" fill="#f97316" />
          <text x="61" y="6.5" fill="#4a6070" fontSize="6.5" fontFamily="sans-serif">Sekonder</text>
          <rect x="112" y="0" width="8" height="7" rx="1.5" fill="#253545" />
          <text x="123" y="6.5" fill="#4a6070" fontSize="6.5" fontFamily="sans-serif">Pasif</text>
        </g>
      </svg>

      {!hasTarget && (
        <p className="text-xs text-gray-600 text-center">Kas grubunu görmek için egzersize tıkla</p>
      )}
    </div>
  );
}
