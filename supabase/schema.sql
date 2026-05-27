-- ================================================
-- WebChat Pro Database Schema
-- Supabase PostgreSQL
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    bio TEXT,
    settings JSONB DEFAULT '{"theme": "dark", "notifications": true, "sound": true}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_status ON public.users(status);

-- ================================================
-- FRIENDS TABLE
-- ================================================
CREATE TABLE public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user ON public.friends(user_id);
CREATE INDEX idx_friends_friend ON public.friends(friend_id);
CREATE INDEX idx_friends_status ON public.friends(status);

-- ================================================
-- CONVERSATIONS TABLE
-- ================================================
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    name VARCHAR(100),
    avatar_url TEXT,
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_type ON public.conversations(type);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- ================================================
-- CONVERSATION MEMBERS TABLE
-- ================================================
CREATE TABLE public.conversation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    nickname VARCHAR(100),
    is_pinned BOOLEAN DEFAULT FALSE,
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_members_conversation ON public.conversation_members(conversation_id);
CREATE INDEX idx_conv_members_user ON public.conversation_members(user_id);

-- ================================================
-- MESSAGES TABLE
-- ================================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'voice', 'system')),
    metadata JSONB DEFAULT '{}'::JSONB,
    reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_messages_pinned ON public.messages(is_pinned);

-- ================================================
-- MESSAGE STATUS TABLE (Delivery & Read receipts)
-- ================================================
CREATE TABLE public.message_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

CREATE INDEX idx_msg_status_message ON public.message_status(message_id);
CREATE INDEX idx_msg_status_user ON public.message_status(user_id);

-- ================================================
-- ATTACHMENTS TABLE
-- ================================================
CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_message ON public.attachments(message_id);

-- ================================================
-- NOTIFICATIONS TABLE
-- ================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    data JSONB DEFAULT '{}'::JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- ================================================
-- USER PRESENCE TABLE
-- ================================================
CREATE TABLE public.user_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    device_info JSONB DEFAULT '{}'::JSONB
);

-- ================================================
-- TRIGGER: Auto-update updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at
    BEFORE UPDATE ON public.friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_status_updated_at
    BEFORE UPDATE ON public.message_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TRIGGER: Update conversation last_message_at
-- ================================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ================================================
-- FUNCTION: Get conversation with members
-- ================================================
CREATE OR REPLACE FUNCTION get_conversation_with_members(conv_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'conversation', (SELECT row_to_json(c) FROM public.conversations c WHERE id = conv_id),
        'members', (
            SELECT json_agg(json_build_object(
                'user_id', cm.user_id,
                'role', cm.role,
                'nickname', cm.nickname,
                'is_pinned', cm.is_pinned,
                'user', (SELECT row_to_json(u) FROM public.users u WHERE id = cm.user_id)
            ))
            FROM public.conversation_members cm
            WHERE cm.conversation_id = conv_id
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCTION: Search messages
-- ================================================
CREATE OR REPLACE FUNCTION search_messages(search_query TEXT, user_id_param UUID)
RETURNS TABLE(
    message_id UUID,
    conversation_id UUID,
    content TEXT,
    sender_id UUID,
    created_at TIMESTAMPTZ,
    sender_name VARCHAR(100),
    sender_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.conversation_id,
        m.content,
        m.sender_id,
        m.created_at,
        COALESCE(u.display_name, u.username) as sender_name,
        u.avatar_url
    FROM public.messages m
    INNER JOIN public.conversation_members cm ON m.conversation_id = cm.conversation_id
    INNER JOIN public.users u ON m.sender_id = u.id
    WHERE cm.user_id = user_id_param
      AND m.content ILIKE '%' || search_query || '%'
      AND m.is_deleted = FALSE
    ORDER BY m.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================

-- Users: Anyone can view user profiles
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by authenticated users"
    ON public.users FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Friends: Users can manage their own friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friends"
    ON public.friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friends"
    ON public.friends FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friends"
    ON public.friends FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Conversations: Members can view their conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view conversations"
    ON public.conversations FOR SELECT
    USING (
        id IN (
            SELECT conversation_id FROM public.conversation_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Conversation Members
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view conversation members"
    ON public.conversation_members FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id FROM public.conversation_members
            WHERE user_id = auth.uid()
        )
    );

-- Messages: Members can view messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages"
    ON public.messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id FROM public.conversation_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Members can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        conversation_id IN (
            SELECT conversation_id FROM public.conversation_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Sender can update messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = sender_id);

CREATE POLICY "Sender can delete messages"
    ON public.messages FOR DELETE
    USING (auth.uid() = sender_id);

-- Message Status
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage message status"
    ON public.message_status FOR ALL
    USING (auth.uid() = user_id);

-- Attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments viewable by conversation members"
    ON public.attachments FOR SELECT
    USING (
        message_id IN (
            SELECT id FROM public.messages
            WHERE conversation_id IN (
                SELECT conversation_id FROM public.conversation_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create attachments"
    ON public.attachments FOR INSERT
    WITH CHECK (
        message_id IN (
            SELECT id FROM public.messages
            WHERE sender_id = auth.uid()
        )
    );

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- ================================================
-- STORAGE BUCKET
-- ================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can upload attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their attachments"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'attachments' AND auth.uid()::text = owner);

-- ================================================
-- REALTIME SUBSCRIPTIONS
-- ================================================
-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;