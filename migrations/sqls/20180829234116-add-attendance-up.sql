CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- Updated at trigger
--
CREATE OR REPLACE FUNCTION updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

--
-- Attendance table
--
CREATE TABLE attendance (
  id                      uuid                        PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id              text                        NOT NULL,
  user_id                 text                        NOT NULL,
  people_count            int                         NOT NULL,
  day                     date                        NOT NULL DEFAULT now(),
  created_at              timestamp with time zone    NOT NULL DEFAULT now(),
  updated_at              timestamp with time zone,
  CONSTRAINT attendance_channel_day UNIQUE (channel_id, day)
);

CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE PROCEDURE updated_at();
