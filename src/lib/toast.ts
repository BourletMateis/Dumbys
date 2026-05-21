import Toast from "react-native-toast-message";

export const toast = {
  error: (message: string, title = "Erreur") =>
    Toast.show({ type: "error", text1: title, text2: message, visibilityTime: 4000 }),

  success: (message: string, title?: string) =>
    Toast.show({ type: "success", text1: title ?? message, text2: title ? message : undefined, visibilityTime: 3000 }),

  info: (message: string, title?: string) =>
    Toast.show({ type: "info", text1: title ?? message, text2: title ? message : undefined, visibilityTime: 3000 }),
};
