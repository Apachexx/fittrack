import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface MacroRingProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal?: number;
}

export default function MacroRing({ calories, protein, carbs, fat, calorieGoal = 2000 }: MacroRingProps) {
  const percentage = Math.min((calories / calorieGoal) * 100, 100);

  const data = [
    { name: 'Kalori', value: percentage, fill: '#f97316' },
  ];

  return (
    <div className="flex items-center gap-6">
      {/* Ring */}
      <div className="relative w-32 h-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#1f2937' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-white">{Math.round(calories)}</p>
          <p className="text-xs text-gray-400">kcal</p>
        </div>
      </div>

      {/* Makrolar */}
      <div className="space-y-3 flex-1">
        {[
          { label: 'Protein', value: protein, unit: 'g', color: 'bg-blue-500', goal: 150 },
          { label: 'Karbonhidrat', value: carbs, unit: 'g', color: 'bg-yellow-500', goal: 250 },
          { label: 'Yağ', value: fat, unit: 'g', color: 'bg-pink-500', goal: 65 },
        ].map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{m.label}</span>
              <span className="text-white font-medium">{Math.round(m.value)}{m.unit}</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${m.color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min((m.value / m.goal) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
