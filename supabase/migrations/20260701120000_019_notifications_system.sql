-- Notifications System Migration
-- Add notification_settings to game_progress
ALTER TABLE game_progress ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"enabled": true, "daily_reminder": true, "energy_full": true, "prestige_ready": true}'::jsonb;

-- Create scheduled_notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    notification_type TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_telegram ON scheduled_notifications(telegram_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status_scheduled ON scheduled_notifications(status, scheduled_for) WHERE status = 'pending';

-- RLS policies
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role full access" ON scheduled_notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read their own notifications
CREATE POLICY "Users read own notifications" ON scheduled_notifications
    FOR SELECT USING (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint);

-- Allow users to delete their own notifications
CREATE POLICY "Users delete own notifications" ON scheduled_notifications
    FOR DELETE USING (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint);

-- Update game_progress policy to include notification_settings
DROP POLICY IF EXISTS "Users can update their game progress" ON game_progress;
CREATE POLICY "Users can update their game progress" ON game_progress
    FOR UPDATE USING (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON scheduled_notifications TO service_role;
