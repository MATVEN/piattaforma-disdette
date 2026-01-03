-- Create contact_messages table for contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied'))
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- RLS Policies (admin only for now - no user access)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- No user policies - only admin can view contact messages
-- You can add admin policies later if needed

-- Comment
COMMENT ON TABLE contact_messages IS 'Stores contact form submissions from /contact page';
COMMENT ON COLUMN contact_messages.status IS 'Status: new, read, replied';
