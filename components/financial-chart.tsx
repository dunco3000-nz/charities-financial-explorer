"use client"

import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FinancialChartProps = {
  data: any[]
  keys: string[]
  labels: string[]
  xAxisKey: string
  colors?: string[]
}

// Custom tooltip component with simpler implementation
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
        <p className="text-gray-900 font-medium mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
                <span className="text-gray-600 text-xs">{entry.name}:</span>
              </div>
              <span className="font-medium text-xs">${Number(entry.value).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function FinancialChart({ data, keys, labels, xAxisKey, colors }: FinancialChartProps) {
  // Format data for the chart
  const chartData = data
    .map((item) => ({
      ...item,
      [xAxisKey]: item[xAxisKey],
    }))
    .sort((a, b) => {
      // Sort by year ascending
      return a[xAxisKey].localeCompare(b[xAxisKey])
    })

  // Define chart colors based on props or defaults
  const chartColors = colors || ["#5C7933", "#BA484A", "#5B3ABA", "#333333"]

  return (
    <div className="space-y-4">
      <Tabs defaultValue="bar">
        <div className="flex justify-end mb-4">
          <TabsList>
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="line">Line</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bar">
          <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey={xAxisKey}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toLocaleString()}k`}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ zIndex: 1000 }}
                  cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                />
                <Legend />
                {keys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={labels[index]}
                    fill={chartColors[index]}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="line">
          <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey={xAxisKey}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toLocaleString()}k`}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ zIndex: 1000 }}
                  cursor={{ stroke: "rgba(0, 0, 0, 0.3)", strokeWidth: 1, strokeDasharray: "5 5" }}
                />
                <Legend />
                {keys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={labels[index]}
                    stroke={chartColors[index]}
                    strokeWidth={2}
                    dot={{ fill: chartColors[index], r: 4 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {keys.map((key, index) => {
          const color = chartColors[index]
          const colorStyle = { color }

          return (
            <Card key={key} className="border" style={{ borderColor: `${color}40` }}>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">{labels[index]}</div>
                <div className="text-2xl font-bold mt-1" style={colorStyle}>
                  ${data.length > 0 ? (data[0][key] || 0).toLocaleString() : "0"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Latest reported value</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

