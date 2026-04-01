-- Add Cloudflare Stream fields to videos table
-- stream_uid    : CF Stream video UID (used to match webhook callbacks)
-- stream_url    : HLS manifest URL (m3u8), available as soon as encoding starts
-- stream_status : 'pending' | 'processing' | 'ready' | 'error'

ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS stream_uid    text,
  ADD COLUMN IF NOT EXISTS stream_url    text,
  ADD COLUMN IF NOT EXISTS stream_status text NOT NULL DEFAULT 'pending';

-- Index for webhook lookups (stream_uid → row)
CREATE INDEX IF NOT EXISTS videos_stream_uid_idx ON videos (stream_uid)
  WHERE stream_uid IS NOT NULL;

-- Comment for clarity
COMMENT ON COLUMN videos.stream_uid    IS 'Cloudflare Stream video UID';
COMMENT ON COLUMN videos.stream_url    IS 'HLS manifest URL served by Cloudflare Stream';
COMMENT ON COLUMN videos.stream_status IS 'pending | processing | ready | error';
