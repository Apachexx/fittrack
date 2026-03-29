import BodyMap from '@/components/ui/BodyMap';

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Makine',
  bodyweight: 'Vücut Ağırlığı',
  cables: 'Kablo',
  other: 'Diğer',
};

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Göğüs',
  back: 'Sırt',
  legs: 'Bacak',
  shoulders: 'Omuz',
  arms: 'Kol',
  core: 'Core',
  cardio: 'Kardiyo',
};

interface Props {
  exercise: { name: string; muscleGroup: string; equipment?: string };
  onClose: () => void;
}

export default function ExerciseModal({ exercise, onClose }: Props) {

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-xs relative"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-all text-xl leading-none"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          ×
        </button>

        {/* Header */}
        <div className="mb-4 pr-10">
          <h2 className="text-lg font-bold text-white leading-snug">{exercise.name}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-xs px-2.5 py-1 rounded-lg capitalize"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#9ca3af' }}
            >
              {MUSCLE_GROUP_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup}
            </span>
            {exercise.equipment && exercise.equipment !== 'other' && (
              <span
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#9ca3af' }}
              >
                {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
              </span>
            )}
          </div>
        </div>

        <BodyMap exerciseName={exercise.name} muscleGroup={exercise.muscleGroup} />
      </div>
    </div>
  );
}
