import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesChartProps {
  data: Record<string, number>;
  period: string;
}

export default function SalesChart({ data = {}, period }: SalesChartProps) {
  // Ensure we have data for all days in the period
  const filledData: Record<string, number> = {};
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 6); // Last 7 days including today
      break;
    case 'month':
      startDate.setDate(1); // Start of current month
      break;
    case 'year':
      startDate.setMonth(0, 1); // Start of current year
      break;
    default: // today
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  // Fill missing dates with 0
  let currentDate = new Date(startDate);
  while (currentDate <= now) {
    const dateKey = currentDate.toISOString().split('T')[0];
    filledData[dateKey] = data[dateKey] || 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const chartData = {
    labels: Object.keys(filledData).map(date => 
      new Date(date).toLocaleDateString('fr-FR', {
        weekday: period === 'week' ? 'short' : undefined,
        day: 'numeric',
        month: period === 'month' ? 'short' : undefined,
        year: period === 'year' ? 'numeric' : undefined
      })
    ),
    datasets: [{
      label: 'Chiffre d\'affaires',
      data: Object.values(filledData),
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y.toFixed(2)} €`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `${value.toFixed(2)} €`
        },
        grid: {
          display: true,
          drawBorder: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}