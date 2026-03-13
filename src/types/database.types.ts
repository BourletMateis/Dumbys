export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FriendshipStatus = "pending" | "accepted";
export type GroupStatus = "private" | "pending_public" | "approved_public";
export type GroupRole = "owner" | "admin" | "member";
export type ChallengeType = "private" | "public";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: FriendshipStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          is_public: boolean;
          status: GroupStatus;
          invite_code: string;
          cover_url: string | null;
          category: string | null;
          end_date: string | null;
          goal_description: string | null;
          prize: string | null;
          type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          is_public?: boolean;
          status?: GroupStatus;
          invite_code?: string;
          cover_url?: string | null;
          category?: string | null;
          end_date?: string | null;
          goal_description?: string | null;
          prize?: string | null;
          type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          is_public?: boolean;
          status?: GroupStatus;
          invite_code?: string;
          cover_url?: string | null;
          category?: string | null;
          end_date?: string | null;
          goal_description?: string | null;
          prize?: string | null;
          type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: GroupRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: GroupRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: GroupRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          submitter_id: string;
          group_id: string | null;
          category_id: string | null;
          source_url: string | null;
          video_path: string | null;
          thumbnail_url: string | null;
          title: string | null;
          description: string | null;
          is_public: boolean;
          week_number: number | null;
          year: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submitter_id: string;
          group_id?: string | null;
          category_id?: string | null;
          source_url?: string | null;
          video_path?: string | null;
          thumbnail_url?: string | null;
          title?: string | null;
          description?: string | null;
          is_public?: boolean;
          week_number?: number | null;
          year?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          submitter_id?: string;
          group_id?: string | null;
          category_id?: string | null;
          source_url?: string | null;
          video_path?: string | null;
          thumbnail_url?: string | null;
          title?: string | null;
          description?: string | null;
          is_public?: boolean;
          week_number?: number | null;
          year?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          user_id?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          emoji: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          emoji: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          emoji?: string;
        };
        Relationships: [];
      };
      weekly_votes: {
        Row: {
          id: string;
          voter_id: string;
          video_id: string;
          group_id: string;
          week_number: number;
          year: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          voter_id: string;
          video_id: string;
          group_id: string;
          week_number: number;
          year: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          voter_id?: string;
          video_id?: string;
          group_id?: string;
          week_number?: number;
          year?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_podium: {
        Row: {
          id: string;
          group_id: string;
          video_id: string;
          user_id: string;
          week_number: number;
          year: number;
          rank: number;
          vote_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          video_id: string;
          user_id: string;
          week_number: number;
          year: number;
          rank: number;
          vote_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          video_id?: string;
          user_id?: string;
          week_number?: number;
          year?: number;
          rank?: number;
          vote_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      friendship_status: FriendshipStatus;
      group_status: GroupStatus;
      group_role: GroupRole;
    };
  };
}
