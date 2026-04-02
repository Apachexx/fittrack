import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supplementsApi } from '@/api/supplements.api';

// Returns supplements scheduled within the next 30 minutes that haven't been taken today
export function useSupplementAlerts() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: logs = [] } = useQuery({
    queryKey: ['supplement-logs', today],
    queryFn: () => supplementsApi.getLogs(today),
    // Refresh every 2 minutes to pick up changes
    refetchInterval: 1000 * 60 * 2,
  });

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const alerts = logs.filter((log) => {
    // Only items with a scheduled time and not yet taken
    if (!log.schedule_time || log.log_id) return false;

    const [h, m] = log.schedule_time.split(':').map(Number);
    const scheduleMinutes = h * 60 + m;
    const diff = scheduleMinutes - nowMinutes;

    // Due in the next 30 minutes (or up to 10 minutes overdue)
    return diff >= -10 && diff <= 30;
  });

  return { alerts, count: alerts.length };
}
