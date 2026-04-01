import { create } from "zustand";

export type PendingUpload = {
  localId: string;
  videoUri: string;
  thumbnailUri: string | null;
  groupId: string;
  challengeId?: string;
  weekNumber: number;
  year: number;
  title?: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type UploadStore = {
  uploads: PendingUpload[];
  addUpload: (upload: Omit<PendingUpload, "status">) => void;
  setStatus: (localId: string, status: PendingUpload["status"], error?: string) => void;
  remove: (localId: string) => void;
};

export const useUploadStore = create<UploadStore>((set) => ({
  uploads: [],
  addUpload: (upload) =>
    set((s) => ({ uploads: [...s.uploads, { ...upload, status: "pending" }] })),
  setStatus: (localId, status, error) =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.localId === localId ? { ...u, status, error } : u,
      ),
    })),
  remove: (localId) =>
    set((s) => ({ uploads: s.uploads.filter((u) => u.localId !== localId) })),
}));
