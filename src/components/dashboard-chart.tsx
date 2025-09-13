'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer } from 'recharts';

const chartData = [
  { resource: 'CS', total: Math.floor(Math.random() * 50) + 20 },
  { resource: 'EE', total: Math.floor(Math.random() * 50) + 20 },
  { resource: 'ME', total: Math.floor(Math.random() * 50) + 20 },
  { resource: 'Arts', total: Math.floor(Math.random() * 50) + 20 },
  { resource: 'Sci', total: Math.floor(Math.random() * 50) + 20 },
  { resource: 'Hum', total: Math.floor(Math.random() * 50) + 20 },
];

export function DashboardChart() {
    return (
        <ChartContainer config={{}} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="resource"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-primary)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
