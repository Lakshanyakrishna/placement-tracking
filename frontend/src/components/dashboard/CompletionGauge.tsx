import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface CompletionGaugeProps {
  value: number
  size?: number
}

export function CompletionGauge({ value, size = 56 }: CompletionGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const data = [{ value: clamped, fill: '#b82020' }]

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          barSize={6}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar background={{ fill: '#f3e8e8' }} dataKey="value" cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[#111827]">{clamped}%</span>
      </div>
    </div>
  )
}
