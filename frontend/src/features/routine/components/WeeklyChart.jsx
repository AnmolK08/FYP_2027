import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export function WeeklyChart({ days = [], summary = {} }) {
  if (!days || days.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-xs font-mono-display">
        No weekly routine history found yet.
      </div>
    );
  }

  const chartData = days.map((day) => ({
    name: day.dayOfWeek ? day.dayOfWeek.slice(0, 3) : '',
    date: day.date,
    percentage: Math.round(day.completionPercentage || 0),
    completed: day.completedTasks || 0,
    total: day.totalTasks || 0,
    hasRoutine: day.hasRoutine,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 6,
            color: 'hsl(var(--foreground))',
          }}
          className="p-3 shadow-md text-xs space-y-1"
        >
          <p className="font-semibold text-foreground">
            {data.name} ({data.date})
          </p>
          {data.hasRoutine ? (
            <>
              <p className="text-primary font-mono-display">
                Completion: {data.percentage}%
              </p>
              <p className="text-muted-foreground font-mono-display">
                Tasks: {data.completed} / {data.total}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground italic">No routine scheduled</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-md p-4">
          <div className="text-overline">Avg Completion</div>
          <div className="font-heading text-2xl text-foreground font-mono-display mt-1">
            {summary.averageCompletionPercentage || 0}%
          </div>
        </div>
        <div className="bg-card border border-border rounded-md p-4">
          <div className="text-overline">Tasks Done</div>
          <div className="font-heading text-2xl text-foreground font-mono-display mt-1">
            {summary.totalTasksCompleted || 0}
          </div>
        </div>
        <div className="bg-card border border-border rounded-md p-4">
          <div className="text-overline">Perfect Days</div>
          <div className="font-heading text-2xl text-foreground font-mono-display mt-1">
            {summary.perfectDaysCount || 0}
          </div>
        </div>
        <div className="bg-card border border-border rounded-md p-4">
          <div className="text-overline">Tracked Days</div>
          <div className="font-heading text-2xl text-foreground font-mono-display mt-1">
            {summary.daysTracked || 0} / {summary.totalDaysInRange || 7}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => {
                let fill = 'hsl(var(--primary))';
                if (entry.percentage === 100) fill = '#10B981';
                else if (entry.percentage < 50 && entry.hasRoutine) fill = '#F59E0B';
                else if (!entry.hasRoutine) fill = 'hsl(var(--muted))';

                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
