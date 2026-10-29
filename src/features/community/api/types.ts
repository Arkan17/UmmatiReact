// Shapes returned by the community RPCs in supabase_schema.sql (section "COMMUNITY v3").

export type Category = 'discuss' | 'ask' | 'event' | 'group';
export type ReactionKind = 'subhanallah' | 'mashallah' | 'jazakallah' | 'ameen';
export type Role = 'member' | 'scholar' | 'admin';
export type ReportTarget = 'post' | 'comment' | 'dua' | 'event';
export type ReportReason = 'spam' | 'offensive' | 'misinformation' | 'harassment' | 'other';

/** An ayah or dua shared into a post, rendered as a card. */
export interface Attachment {
  type: 'ayah' | 'dua';
  arabic: string;
  translation: string;
  /** e.g. "Al-Baqarah 2:286" or the dua title */
  ref: string;
}

export interface Post {
  id: string;
  user_id: string | null;
  author_name: string;
  avatar_color: string | null;
  author_role: Role;
  content: string;
  category: Category;
  attachment: Attachment | null;
  group_id: string | null;
  group_name: string | null;
  answered: boolean;
  is_hidden: boolean;
  created_at: string;
  reactions: Partial<Record<ReactionKind, number>>;
  reaction_total: number;
  comment_count: number;
  my_reaction: ReactionKind | null;
  is_bookmarked: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  author_name: string;
  avatar_color: string | null;
  author_role: Role;
  content: string;
  created_at: string;
  /** Scholar reply on an "Ask" post: pinned on top. */
  is_answer: boolean;
}

export interface DuaRequest {
  id: string;
  /** null when anonymous and not mine */
  user_id: string | null;
  author_name: string | null;
  avatar_color: string | null;
  content: string;
  is_anonymous: boolean;
  answered_at: string | null;
  created_at: string;
  ameen_count: number;
  my_ameen: boolean;
  is_mine: boolean;
}

export interface KhatamJuz {
  juz: number;
  user_id: string | null;
  completed: boolean;
}

export interface KhatamMember {
  user_id: string;
  username: string;
  avatar_color: string | null;
}

export interface KhatamGroup {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  juz: KhatamJuz[];
  members: KhatamMember[];
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string | null;
  tint: string;
  is_private: boolean;
  /** Only visible to members */
  invite_code: string | null;
  created_by: string;
  created_at: string;
  member_count: number;
  post_count: number;
  is_member: boolean;
  my_role: 'member' | 'admin' | null;
}

export type EventKind = 'lecture' | 'iftar' | 'jumuah' | 'class' | 'charity' | 'social' | 'other';

export interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  mosque_id: string | null;
  latitude: number | null;
  longitude: number | null;
  group_id: string | null;
  group_name: string | null;
  created_by: string;
  host_name: string | null;
  rsvp_count: number;
  my_rsvp: boolean;
  distance_km: number | null;
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  /** 'book' | 'heart' | 'book-open' | 'sunrise' | 'gift' | 'star' */
  icon: string;
  goal: number;
  unit: string;
  xp: number;
  starts_on: string;
  ends_on: string;
  participants: number;
  completed_count: number;
  my_progress: number;
  my_completed_at: string | null;
  joined: boolean;
}

export type NotificationKind = 'reaction' | 'comment' | 'answer' | 'ameen' | 'rsvp' | 'group_join';

export interface CommunityNotification {
  id: number;
  user_id: string;
  actor_id: string | null;
  actor_name: string | null;
  kind: NotificationKind;
  post_id: string | null;
  dua_id: string | null;
  event_id: string | null;
  group_id: string | null;
  /** For reactions: "<kind>|<post preview>" */
  preview: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  avatar_color: string | null;
  role: Role;
  bio: string | null;
  created_at: string;
  /** null when the user hides their stats (leaderboard opt-out) */
  total_xp: number | null;
  streak_count: number | null;
  post_count: number;
  is_blocked: boolean;
}

export interface OpenReport {
  target_type: ReportTarget;
  target_id: string;
  report_count: number;
  reasons: ReportReason[];
  details: string[];
  preview: string | null;
  author_id: string | null;
  author_name: string | null;
  is_hidden: boolean;
  last_reported_at: string;
}
