import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface CompositionPieChartProps {
  assets: { symbol: string; weight: number }[];
  title?: string;
  description?: string;
}

const COLORS = ["#10B981", "#6366F1", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6", "#F97316"];

export default function CompositionPieChart({
  assets,
  title = "Initial allocation",
  description = "Portfolio weights at the start of the simulation",
}: CompositionPieChartProps) {
  const data = assets.map((a) => ({ name: a.symbol, value: a.weight }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={36} outerRadius={72} paddingAngle={3}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => v !== undefined ? `${v}%` : '—'} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
