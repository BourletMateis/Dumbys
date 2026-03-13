import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { supabase } from "@/src/lib/supabase";
import { uploadFile } from "@/src/lib/storage";
import { useAuthStore } from "@/src/store/useAuthStore";

export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        throw new Error("Gallery permission required");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        throw new Error("__cancelled__");
      }

      const uri = result.assets[0].uri;
      const key = `avatars/${user.id}/${Date.now()}.jpg`;
      const publicUrl = await uploadFile(key, uri, "image/jpeg");

      const { error } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (error) throw error;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
    onError: (err) => {
      if (err.message === "__cancelled__") return;
      Alert.alert("Error", err.message);
    },
  });
}
