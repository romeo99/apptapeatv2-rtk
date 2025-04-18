import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OrdersChartProps {
  data: Record<string, number>;
  period: string;
}

export default function OrdersChart({ data = {}, period }: OrdersChartProps) {
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
      label: 'Commandes',
      data: Object.values(filledData),
      backgroundColor: 'rgb(37, 99, 235)',
      borderRadius: 6
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
          label: (context: any) => `${context.parsed.y} commande${context.parsed.y > 1 ? 's' : ''}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
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
      <Bar data={chartData} options={options} />
    </div>
  );
}