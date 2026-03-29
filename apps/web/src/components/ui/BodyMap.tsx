import Body from 'react-muscle-highlighter';
import type { ExtendedBodyPart, Slug } from 'react-muscle-highlighter';

interface MuscleTarget { primary: Slug[]; secondary: Slug[] }

const EXERCISE_MUSCLES: Record<string, MuscleTarget> = {
  'Bench Press':                    { primary: ['chest'],                           secondary: ['deltoids', 'triceps'] },
  'Incline Bench Press':            { primary: ['chest'],                           secondary: ['deltoids', 'triceps'] },
  'Smith Machine Low Incline Press':{ primary: ['chest'],                           secondary: ['deltoids', 'triceps'] },
  'Chest Fly Machine':              { primary: ['chest'],                           secondary: ['deltoids'] },
  'Dumbbell Fly':                   { primary: ['chest'],                           secondary: ['deltoids'] },
  'Cable Crossover':                { primary: ['chest'],                           secondary: ['deltoids'] },
  'Push-up':                        { primary: ['chest'],                           secondary: ['deltoids', 'triceps'] },
  'Pull-up':                        { primary: ['upper-back'],                      secondary: ['biceps', 'forearm', 'trapezius'] },
  'Barbell Row':                    { primary: ['upper-back', 'lower-back'],        secondary: ['trapezius', 'deltoids', 'biceps'] },
  'Lat Pulldown':                   { primary: ['upper-back'],                      secondary: ['biceps', 'forearm', 'trapezius'] },
  'Seated Cable Row':               { primary: ['upper-back'],                      secondary: ['lower-back', 'biceps', 'deltoids'] },
  'Cable Row':                      { primary: ['upper-back'],                      secondary: ['lower-back', 'biceps', 'deltoids'] },
  'Cable Rear Delt Fly':            { primary: ['deltoids'],                        secondary: ['trapezius', 'upper-back'] },
  'Plate Loaded Wide Grip Row':     { primary: ['upper-back'],                      secondary: ['trapezius', 'deltoids', 'biceps'] },
  'Deadlift':                       { primary: ['lower-back', 'gluteal', 'hamstring'], secondary: ['trapezius', 'quadriceps', 'forearm'] },
  'Squat':                          { primary: ['quadriceps', 'gluteal'],           secondary: ['hamstring', 'lower-back', 'adductors'] },
  'Smith Machine Squat':            { primary: ['quadriceps'],                      secondary: ['gluteal', 'hamstring'] },
  'Leg Press':                      { primary: ['quadriceps'],                      secondary: ['gluteal', 'hamstring', 'adductors'] },
  'Romanian Deadlift':              { primary: ['hamstring', 'gluteal'],            secondary: ['lower-back', 'adductors'] },
  'Leg Curl':                       { primary: ['hamstring'],                       secondary: ['calves'] },
  'Seated Leg Curl':                { primary: ['hamstring'],                       secondary: [] },
  'Leg Extension':                  { primary: ['quadriceps'],                      secondary: [] },
  'Lunge':                          { primary: ['quadriceps', 'gluteal'],           secondary: ['hamstring', 'adductors'] },
  'Overhead Press':                 { primary: ['deltoids'],                        secondary: ['triceps', 'trapezius'] },
  'Shoulder Press Machine':         { primary: ['deltoids'],                        secondary: ['triceps', 'trapezius'] },
  'Dumbbell Lateral Raise':         { primary: ['deltoids'],                        secondary: ['trapezius'] },
  'Lateral Raise':                  { primary: ['deltoids'],                        secondary: ['trapezius'] },
  'Front Raise':                    { primary: ['deltoids'],                        secondary: ['chest'] },
  'Face Pull':                      { primary: ['deltoids', 'trapezius'],           secondary: ['upper-back'] },
  'Bicep Curl':                     { primary: ['biceps'],                          secondary: ['forearm'] },
  'Hammer Curl':                    { primary: ['biceps', 'forearm'],               secondary: [] },
  'Cable Curl':                     { primary: ['biceps'],                          secondary: ['forearm'] },
  'Incline Dumbbell Curl':          { primary: ['biceps'],                          secondary: [] },
  'Tricep Pushdown':                { primary: ['triceps'],                         secondary: ['forearm'] },
  'Overhead Rope Extension':        { primary: ['triceps'],                         secondary: [] },
  'Skull Crusher':                  { primary: ['triceps'],                         secondary: [] },
  'Plank':                          { primary: ['abs', 'obliques'],                 secondary: ['lower-back', 'gluteal'] },
  'Crunch':                         { primary: ['abs'],                             secondary: ['obliques'] },
  'Russian Twist':                  { primary: ['obliques'],                        secondary: ['abs'] },
  'Treadmill':                      { primary: ['quadriceps', 'hamstring', 'calves'], secondary: ['gluteal'] },
  'Cycling':                        { primary: ['quadriceps'],                      secondary: ['gluteal', 'hamstring', 'calves'] },
  'Jump Rope':                      { primary: ['calves'],                          secondary: ['quadriceps', 'hamstring'] },
};

const GROUP_FALLBACK: Record<string, MuscleTarget> = {
  chest:     { primary: ['chest'],                           secondary: ['deltoids'] },
  back:      { primary: ['upper-back', 'lower-back'],        secondary: ['trapezius', 'deltoids'] },
  legs:      { primary: ['quadriceps', 'gluteal'],           secondary: ['hamstring', 'calves'] },
  shoulders: { primary: ['deltoids'],                        secondary: ['trapezius', 'upper-back'] },
  arms:      { primary: ['biceps', 'triceps'],               secondary: ['forearm'] },
  core:      { primary: ['abs', 'obliques'],                 secondary: ['lower-back'] },
  cardio:    { primary: ['quadriceps', 'hamstring', 'calves'], secondary: ['gluteal'] },
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

  // Build data arrays for the Body component
  const data: ExtendedBodyPart[] = [
    ...(target?.primary ?? []).map((slug) => ({ slug, color: '#ef4444', intensity: 2 })),
    ...(target?.secondary ?? []).map((slug) => ({ slug, color: '#f97316', intensity: 1 })),
  ];

  const hasSecondary = (target?.secondary ?? []).length > 0;

  // Which sides to show — if primary is back muscles show back, else front
  const backMuscles: Slug[] = ['upper-back', 'lower-back', 'trapezius', 'gluteal', 'hamstring'];
  const hasFrontMuscles = (target?.primary ?? []).some((s) => !backMuscles.includes(s));
  const hasBackMuscles  = (target?.primary ?? []).some((s) => backMuscles.includes(s));

  const showFront = !target || hasFrontMuscles || (!hasFrontMuscles && !hasBackMuscles);
  const showBack  = !target || hasBackMuscles  || (!hasFrontMuscles && !hasBackMuscles);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {exerciseName && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            {exerciseName}
          </span>
          {target && hasSecondary && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }}>
              +yardımcı
            </span>
          )}
        </div>
      )}

      <div className="flex items-start justify-center gap-1 w-full">
        {showFront && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: '#3d5a6e' }}>ÖN</span>
            <Body
              data={data}
              side="front"
              gender="male"
              scale={0.85}
              colors={['#ef4444', '#f97316']}
              defaultFill="#253545"
              defaultStroke="#1a2a38"
              defaultStrokeWidth={0.5}
              border="none"
            />
          </div>
        )}
        {showBack && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: '#3d5a6e' }}>ARKA</span>
            <Body
              data={data}
              side="back"
              gender="male"
              scale={0.85}
              colors={['#ef4444', '#f97316']}
              defaultFill="#253545"
              defaultStroke="#1a2a38"
              defaultStrokeWidth={0.5}
              border="none"
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#ef4444' }} />
          <span className="text-[10px]" style={{ color: '#4a6070' }}>Primer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f97316' }} />
          <span className="text-[10px]" style={{ color: '#4a6070' }}>Sekonder</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#253545' }} />
          <span className="text-[10px]" style={{ color: '#4a6070' }}>Pasif</span>
        </div>
      </div>

      {!target && (
        <p className="text-xs text-gray-600 text-center">Kas grubunu görmek için egzersize tıkla</p>
      )}
    </div>
  );
}
