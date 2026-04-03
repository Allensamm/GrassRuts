-- =============================================
-- FUNCTION: Notify reporters when issue hits high_priority
-- =============================================
CREATE OR REPLACE FUNCTION notify_threshold_reached()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status transitions to high_priority
  IF NEW.status = 'high_priority' AND OLD.status != 'high_priority' THEN
    INSERT INTO notifications (user_id, type, title, message, issue_id)
    SELECT
      r.user_id,
      'threshold_reached',
      '🔥 Issue Escalated!',
      'An issue you reported has reached the reporting threshold and is now HIGH PRIORITY: ' || NEW.title,
      NEW.id
    FROM reports r
    WHERE r.issue_id = NEW.id;
  END IF;

  -- Notify when government marks as resolved (resolution vote needed)
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    INSERT INTO notifications (user_id, type, title, message, issue_id)
    SELECT
      r.user_id,
      'resolution_request',
      '✅ Issue Marked Resolved',
      'Government has marked an issue as resolved. Please confirm: ' || NEW.title,
      NEW.id
    FROM reports r
    WHERE r.issue_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_threshold
  AFTER UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION notify_threshold_reached();
