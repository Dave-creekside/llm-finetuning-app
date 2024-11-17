import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface GPUInfo {
  id: number;
  name: string;
  total_memory: number;
  memory_allocated: number;
  utilization: number;
}

interface Metrics {
  cpu_percent: number;
  memory_percent: number;
  gpu_info: GPUInfo[];
  active_sessions: number;
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [historicalData, setHistoricalData] = useState<Metrics[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onmessage = (event) => {
      const newMetrics = JSON.parse(event.data);
      setMetrics(newMetrics);
      setHistoricalData(prev => [...prev.slice(-30), newMetrics]); // Keep last 30 data points
    };

    return () => ws.close();
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Fine-Tuning Monitor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">System Overview</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">CPU Usage</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${metrics.cpu_percent}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{metrics.cpu_percent.toFixed(1)}%</p>
            </div>
            
            <div>
              <p className="text-gray-600">Memory Usage</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: `${metrics.memory_percent}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{metrics.memory_percent.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
          <div className="text-4xl font-bold text-blue-600">
            {metrics.active_sessions}
          </div>
          <p className="text-gray-500 mt-2">Current Training Jobs</p>
        </div>

        {/* GPU Monitoring */}
        {metrics.gpu_info.map((gpu) => (
          <div key={gpu.id} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              GPU {gpu.id}: {gpu.name}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">GPU Utilization</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full"
                    style={{ width: `${gpu.utilization}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{gpu.utilization}%</p>
              </div>
              
              <div>
                <p className="text-gray-600">Memory Usage</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-yellow-600 h-2.5 rounded-full"
                    style={{ width: `${(gpu.memory_allocated / gpu.total_memory) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {(gpu.memory_allocated / 1024 / 1024 / 1024).toFixed(2)}GB /
                  {(gpu.total_memory / 1024 / 1024 / 1024).toFixed(2)}GB
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Historical Usage Graph */}
        <div className="bg-white rounded-lg shadow p-6 col-span-full">
          <h2 className="text-xl font-semibold mb-4">Resource Usage History</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpu_percent" stroke="#3B82F6" name="CPU" />
                <Line type="monotone" dataKey="memory_percent" stroke="#10B981" name="Memory" />
                {metrics.gpu_info.map((gpu) => (
                  <Line
                    key={gpu.id}
                    type="monotone"
                    dataKey={`gpu_info[${gpu.id}].utilization`}
                    stroke="#8B5CF6"
                    name={`GPU ${gpu.id}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
