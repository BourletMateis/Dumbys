import { useEffect } from "react";
import { router } from "expo-router";
import { View } from "react-native";

// Placeholder tab — the FAB in the tab bar navigates directly to /camera.
// This file only exists so the "upload" route is registered in the tab navigator
// (required for the FAB to be positioned correctly in the tab bar layout).
export default function UploadTab() {
  useEffect(() => {
    router.replace("/camera" as any);
  }, []);
  return <View style={{ flex: 1 }} />;
}
