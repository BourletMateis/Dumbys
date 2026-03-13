import { z } from "zod/v4";

const SUPPORTED_URL_PATTERNS = [
  /^https?:\/\/(www\.)?tiktok\.com\//,
  /^https?:\/\/vm\.tiktok\.com\//,
  /^https?:\/\/(www\.)?instagram\.com\/reel(s)?\//,
  /^https?:\/\/(www\.)?(twitter|x)\.com\//,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\//,
  /^https?:\/\/youtu\.be\//,
];

export const submitVideoSchema = z.object({
  source_url: z
    .url("Please enter a valid URL")
    .check(
      z.refine((url) => SUPPORTED_URL_PATTERNS.some((p) => p.test(url)), {
        message: "Only TikTok, Instagram Reels, X/Twitter, and YouTube Shorts links are supported",
      }),
    ),
  category_id: z.string().check(z.minLength(1, "Please select a category")),
});

export type SubmitVideoForm = z.infer<typeof submitVideoSchema>;
