import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import { uploadFile } from "@/src/lib/storage";

type CreateGroupInput = {
  name: string;
  description?: string;
  isPublic: boolean;
  category?: string;
  endDate?: string;
  goalDescription?: string;
  prize?: string;
  type?: string;
  coverUri?: string;
};

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      if (!user) throw new Error("Not authenticated");

      let coverUrl: string | null = null;
      if (input.coverUri) {
        const key = `groups/${user.id}/${Date.now()}_cover.jpg`;
        coverUrl = await uploadFile(key, input.coverUri, "image/jpeg");
      }

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: input.name,
          description: input.description ?? null,
          owner_id: user.id,
          is_public: input.isPublic,
          status: input.isPublic ? "approved_public" : "private",
          category: input.category ?? null,
          end_date: input.endDate ?? null,
          goal_description: input.goalDescription ?? null,
          prize: input.prize ?? null,
          type: input.type ?? (input.isPublic ? "public" : "private"),
          cover_url: coverUrl,
        })
        .select("id, name")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      queryClient.invalidateQueries({ queryKey: ["public-groups"] });
    },
  });
}

type UpdateGroupInput = {
  groupId: string;
  name?: string;
  description?: string | null;
  coverUri?: string;
};

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: UpdateGroupInput) => {
      if (!user) throw new Error("Not authenticated");

      const updates: Record<string, unknown> = {};

      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;

      if (input.coverUri) {
        const key = `groups/${user.id}/${Date.now()}_cover.jpg`;
        updates.cover_url = await uploadFile(key, input.coverUri, "image/jpeg");
      }

      const { data, error } = await supabase
        .from("groups")
        .update(updates)
        .eq("id", input.groupId)
        .select("id, name")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      queryClient.invalidateQueries({ queryKey: ["public-groups"] });
    },
  });
}

export function useJoinPublicGroup() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: "member",
        });

      if (error) {
        if (error.code === "23505") throw new Error("You're already in this group");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      queryClient.invalidateQueries({ queryKey: ["public-groups"] });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });
}

export function useJoinGroupByCode() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error("Not authenticated");

      // Find group by invite code
      const { data: group, error: findError } = await supabase
        .from("groups")
        .select("id")
        .eq("invite_code", inviteCode.trim().toLowerCase())
        .single();

      if (findError || !group) throw new Error("Invalid invite code");

      // Join the group
      const { error: joinError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "member",
        });

      if (joinError) {
        if (joinError.code === "23505") throw new Error("You're already in this group");
        throw joinError;
      }

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      queryClient.invalidateQueries({ queryKey: ["public-groups"] });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });
}
