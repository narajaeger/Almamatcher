-- 20260629_buddy_chat.sql
-- Allow messaging a mutual STUDY BUDDY (not only a romantic match).
-- Match chats and buddy chats are separate rooms in the app (match_key is
-- suffixed with ":buddy" for buddy chats), so their histories never collide.
-- This updates the message-guard trigger to permit either relationship.

CREATE OR REPLACE FUNCTION public.check_match_before_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allowed if the two users are a mutual romantic match …
  IF EXISTS (
    SELECT 1
    FROM public.likes l1
    JOIN public.likes l2
      ON  l1.from_user_id = l2.to_user_id
      AND l1.to_user_id   = l2.from_user_id
    WHERE l1.from_user_id = NEW.sender_id
      AND l1.to_user_id   = NEW.receiver_id
  ) THEN
    RETURN NEW;
  END IF;

  -- … or a mutual study-buddy pair.
  IF EXISTS (
    SELECT 1
    FROM public.buddy_requests b1
    JOIN public.buddy_requests b2
      ON  b1.from_user_id = b2.to_user_id
      AND b1.to_user_id   = b2.from_user_id
    WHERE b1.from_user_id = NEW.sender_id
      AND b1.to_user_id   = NEW.receiver_id
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Cannot send message: users are not matched or study buddies';
END;
$$;

-- Trigger already exists from 20260628_security_fixes.sql; recreate defensively.
DROP TRIGGER IF EXISTS enforce_match_before_message ON public.messages;
CREATE TRIGGER enforce_match_before_message
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_match_before_message();
