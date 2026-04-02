import pool from '../db';

// ── Browse catalog ────────────────────────────────────────────────────────────
export async function listSupplements(category?: string) {
  const { rows } = await pool.query(
    `SELECT id, name, name_tr, category, default_dose, timing, description
     FROM supplements
     ${category ? 'WHERE category = $1' : ''}
     ORDER BY category, name_tr`,
    category ? [category] : []
  );
  return rows;
}

// ── User stack ────────────────────────────────────────────────────────────────
export async function getUserSupplements(userId: string) {
  const { rows } = await pool.query(
    `SELECT us.id, us.dose, us.schedule_time, us.is_active, us.created_at,
            s.id AS supplement_id, s.name, s.name_tr, s.category, s.default_dose, s.timing, s.description
     FROM user_supplements us
     JOIN supplements s ON s.id = us.supplement_id
     WHERE us.user_id = $1 AND us.is_active = TRUE
     ORDER BY us.created_at`,
    [userId]
  );
  return rows;
}

export async function addUserSupplement(
  userId: string,
  supplementId: string,
  dose?: string,
  scheduleTime?: string
) {
  const { rows } = await pool.query(
    `INSERT INTO user_supplements (user_id, supplement_id, dose, schedule_time)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, supplement_id)
     DO UPDATE SET is_active = TRUE, dose = COALESCE(EXCLUDED.dose, user_supplements.dose),
                   schedule_time = COALESCE(EXCLUDED.schedule_time, user_supplements.schedule_time)
     RETURNING *`,
    [userId, supplementId, dose || null, scheduleTime || null]
  );
  return rows[0];
}

export async function updateUserSupplement(
  userId: string,
  userSupplementId: string,
  updates: { dose?: string; scheduleTime?: string | null }
) {
  const { rows } = await pool.query(
    `UPDATE user_supplements
     SET dose = COALESCE($3, dose),
         schedule_time = $4
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [userSupplementId, userId, updates.dose || null, updates.scheduleTime ?? null]
  );
  return rows[0];
}

export async function removeUserSupplement(userId: string, userSupplementId: string) {
  await pool.query(
    `UPDATE user_supplements SET is_active = FALSE WHERE id = $1 AND user_id = $2`,
    [userSupplementId, userId]
  );
}

// ── Daily logs ────────────────────────────────────────────────────────────────
export async function getDailyLogs(userId: string, date: string) {
  const { rows } = await pool.query(
    `SELECT us.id AS user_supplement_id, us.dose, us.schedule_time,
            s.id AS supplement_id, s.name, s.name_tr, s.category, s.default_dose,
            sl.id AS log_id, sl.taken_date
     FROM user_supplements us
     JOIN supplements s ON s.id = us.supplement_id
     LEFT JOIN supplement_logs sl ON sl.user_supplement_id = us.id AND sl.taken_date = $2
     WHERE us.user_id = $1 AND us.is_active = TRUE
     ORDER BY us.schedule_time NULLS LAST, s.name_tr`,
    [userId, date]
  );
  return rows;
}

export async function markTaken(userId: string, userSupplementId: string, date: string) {
  const { rows } = await pool.query(
    `INSERT INTO supplement_logs (user_id, user_supplement_id, taken_date)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_supplement_id, taken_date) DO NOTHING
     RETURNING *`,
    [userId, userSupplementId, date]
  );
  return rows[0];
}

export async function unmarkTaken(userId: string, userSupplementId: string, date: string) {
  await pool.query(
    `DELETE FROM supplement_logs
     WHERE user_id = $1 AND user_supplement_id = $2 AND taken_date = $3`,
    [userId, userSupplementId, date]
  );
}

// ── Push subscriptions ────────────────────────────────────────────────────────
export async function savePushSubscription(
  userId: string,
  endpoint: string,
  p256dh: string,
  authKey: string
) {
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth_key)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth_key = $4`,
    [userId, endpoint, p256dh, authKey]
  );
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  await pool.query(
    `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
    [userId, endpoint]
  );
}

// ── Cron: supplements due for notification ────────────────────────────────────
export async function getSupplementsDueForNotification() {
  // Find user_supplements where schedule_time is within the next 3 minutes
  // and we haven't sent a notification today
  const { rows } = await pool.query(`
    SELECT us.id, us.user_id, us.schedule_time, us.last_notified,
           s.name_tr,
           ps.endpoint, ps.p256dh, ps.auth_key
    FROM user_supplements us
    JOIN supplements s ON s.id = us.supplement_id
    JOIN push_subscriptions ps ON ps.user_id = us.user_id
    WHERE us.is_active = TRUE
      AND us.schedule_time IS NOT NULL
      AND (us.last_notified IS NULL OR us.last_notified < CURRENT_DATE)
      AND us.schedule_time
            BETWEEN (NOW() AT TIME ZONE 'Europe/Istanbul')::time
                AND ((NOW() + INTERVAL '3 minutes') AT TIME ZONE 'Europe/Istanbul')::time
  `);
  return rows;
}

export async function markNotificationSent(userSupplementId: string) {
  await pool.query(
    `UPDATE user_supplements SET last_notified = CURRENT_DATE WHERE id = $1`,
    [userSupplementId]
  );
}
