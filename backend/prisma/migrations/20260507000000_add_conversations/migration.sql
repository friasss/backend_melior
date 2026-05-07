-- Migration: add_conversations
-- Replaces the old direct-message schema (sender_id/receiver_id) with
-- conversation-based schema (conversations + conversation_participants + messages with conversation_id).

-- Drop old messages table if it still has the old structure (sender_id column present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'sender_id'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'conversation_id'
      )
  ) THEN
    DROP TABLE IF EXISTS "messages";
  END IF;
END$$;

-- CreateTable conversations (IF NOT EXISTS so it's safe if db push already ran)
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "property_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable conversation_participants
CREATE TABLE IF NOT EXISTS "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unread_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on conversation_participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_participants_conversation_id_user_id_key'
  ) THEN
    ALTER TABLE "conversation_participants"
      ADD CONSTRAINT "conversation_participants_conversation_id_user_id_key"
      UNIQUE ("conversation_id", "user_id");
  END IF;
END$$;

-- CreateTable messages (new structure with conversation_id)
CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "messages_conversation_id_idx" ON "messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages"("sender_id");

-- Foreign Keys (only add if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_property_id_fkey'
  ) THEN
    ALTER TABLE "conversations"
      ADD CONSTRAINT "conversations_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_participants_conversation_id_fkey'
  ) THEN
    ALTER TABLE "conversation_participants"
      ADD CONSTRAINT "conversation_participants_conversation_id_fkey"
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_participants_user_id_fkey'
  ) THEN
    ALTER TABLE "conversation_participants"
      ADD CONSTRAINT "conversation_participants_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE "messages"
      ADD CONSTRAINT "messages_conversation_id_fkey"
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey'
  ) THEN
    ALTER TABLE "messages"
      ADD CONSTRAINT "messages_sender_id_fkey"
      FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;
