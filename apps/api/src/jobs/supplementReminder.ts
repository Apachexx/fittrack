import cron from 'node-cron';
import webpush from 'web-push';
import {
  getSupplementsDueForNotification,
  markNotificationSent,
} from '../services/supplement.service';

export function startSupplementReminderJob() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:fittrack@example.com';

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log('⚠️  VAPID keys not set — supplement push notifications disabled');
    return;
  }

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const due = await getSupplementsDueForNotification();
      for (const row of due) {
        const payload = JSON.stringify({
          title: '💊 Supplement Zamanı!',
          body: `${row.name_tr} alma vakti geldi.`,
          url: '/supplements',
        });

        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth_key } },
            payload
          );
          await markNotificationSent(row.id);
        } catch (pushErr: any) {
          // Remove expired subscriptions (410 Gone)
          if (pushErr.statusCode === 410) {
            await import('../db').then(({ default: pool }) =>
              pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint])
            );
          } else {
            console.error('Push send error:', pushErr.message);
          }
        }
      }
    } catch (err) {
      console.error('Supplement reminder cron error:', err);
    }
  });

  console.log('✓ Supplement reminder cron job started');
}
