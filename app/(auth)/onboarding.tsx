import { useState } from "react";
import { View, Text, Pressable, ScrollView, Dimensions, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useJoinPublicGroup } from "@/src/features/groups/useGroupActions";
import { usePublicGroups, PUBLIC_CATEGORIES } from "@/src/features/groups/usePublicGroups";
import { useUpdateUsername } from "@/src/features/profile/useUpdateUsername";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { FONT, FONT_FAMILY, PALETTE, RADIUS, SPACING, getGroupBannerColor } from "@/src/theme";

const { width: W } = Dimensions.get("window");

type Step = "welcome" | "username" | "themes" | "done";


async function markOnboardingDone() {
  await supabase.auth.updateUser({ data: { onboarding_completed: true } });
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<Step>("welcome");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const joinGroup = useJoinPublicGroup();
  const updateUsername = useUpdateUsername();

  // Fetch ALL public groups for smart suggestions
  const { data: allPublicGroups } = usePublicGroups();

  const topGroups = (() => {
    const groups = (allPublicGroups ?? []).filter((g) => !g.is_member || joinedGroupIds.has(g.id));
    if (selectedThemes.length > 0) {
      // Groups matching any selected theme → first
      const matching = groups.filter((g) => g.category && selectedThemes.includes(g.category));
      const notMatching = groups.filter((g) => !g.category || !selectedThemes.includes(g.category));
      const sorted = [
        ...matching.sort((a, b) => b.member_count - a.member_count),
        ...notMatching.sort((a, b) => b.member_count - a.member_count),
      ];
      return sorted.slice(0, 6);
    }
    // No theme selected: top by member count
    return groups.sort((a, b) => b.member_count - a.member_count).slice(0, 6);
  })();

  const toggleTheme = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedThemes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleJoinGroup = (groupId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    joinGroup.mutate(groupId, {
      onSuccess: () => setJoinedGroupIds((prev) => new Set(prev).add(groupId)),
    });
  };

  const finish = async () => {
    await markOnboardingDone();
    router.replace("/(tabs)");
  };

  // ── Step 1: Welcome ──────────────────────────────────────────
  if (step === "welcome") {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFF" }}>
        <LinearGradient
          colors={[`${PALETTE.sarcelle}18`, "#FFF"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: W }}
        />

        <View style={{ flex: 1, paddingHorizontal: SPACING["2xl"], paddingTop: insets.top + 40 }}>
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <View style={{ width: 88, height: 88, borderRadius: 28, overflow: "hidden", marginBottom: 20, shadowColor: PALETTE.sarcelle, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 }}>
              <LinearGradient colors={[PALETTE.sarcelle, "#2ABFB8"]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 40, fontFamily: FONT_FAMILY.black, color: "#FFF" }}>D</Text>
              </LinearGradient>
            </View>
            <Text style={{ fontSize: 36, fontFamily: FONT_FAMILY.black, color: "#1A1A1A", letterSpacing: -1 }}>
              Bienvenue 👋
            </Text>
            <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#888", textAlign: "center", marginTop: 8, lineHeight: 22 }}>
              Dumbys, c'est l'appli pour relever des défis vidéo avec tes potes et des communautés.
            </Text>
          </View>

          {/* Feature cards */}
          <View style={{ gap: 12, marginBottom: 48 }}>
            {[
              { icon: "people-circle" as const, color: PALETTE.sarcelle, title: "Groupes thématiques", desc: "Rejoins des groupes Comedy, Sports, Dance et plein d'autres." },
              { icon: "lock-closed" as const, color: "#555", title: "Entre potes", desc: "Crée un groupe privé pour les délires entre amis." },
              { icon: "trophy" as const, color: PALETTE.jaune, title: "Défis & votes", desc: "Poste tes vidéos chaque semaine et vote pour les meilleures." },
            ].map((item) => (
              <View key={item.title} style={{ flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "#F8F8FA", borderRadius: RADIUS.xl, padding: 16 }}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${item.color}15`, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }}>{item.title}</Text>
                  <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#999", marginTop: 2 }}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <AnimatedPressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setStep("username"); }}
            style={{ borderRadius: RADIUS.xl, overflow: "hidden" }}
          >
            <LinearGradient colors={[PALETTE.sarcelle, "#2ABFB8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 17, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 }}>
              <Text style={{ color: "#FFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>C'est parti !</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </AnimatedPressable>

          <Pressable onPress={() => setStep("username")} style={{ marginTop: 16, alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: "#CCC" }}>Passer l'introduction</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Step 2: Username ────────────────────────────────────────
  if (step === "username") {
    const isValid = usernameInput.trim().length >= 3 && usernameInput.trim().length <= 24;
    const handleContinue = async () => {
      if (!isValid) {
        setUsernameError("Le pseudo doit faire entre 3 et 24 caractères");
        return;
      }
      setUsernameError("");
      updateUsername.mutate(usernameInput.trim(), {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStep("themes");
        },
        onError: (err: any) => {
          setUsernameError(err.message ?? "Ce pseudo est déjà pris");
        },
      });
    };

    return (
      <View style={{ flex: 1, backgroundColor: "#FFF" }}>
        <LinearGradient
          colors={[`${PALETTE.sarcelle}18`, "#FFF"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: W }}
        />

        <View style={{ flex: 1, paddingHorizontal: SPACING["2xl"], paddingTop: insets.top + 40, justifyContent: "space-between", paddingBottom: Math.max(insets.bottom, 20) + 16 }}>
          <View>
            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 48 }}>
              <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: `${PALETTE.sarcelle}18`, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Ionicons name="person" size={34} color={PALETTE.sarcelle} />
              </View>
              <Text style={{ fontSize: 32, fontFamily: FONT_FAMILY.black, color: "#1A1A1A", letterSpacing: -0.5, textAlign: "center" }}>
                Choisis ton pseudo
              </Text>
              <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#888", textAlign: "center", marginTop: 8, lineHeight: 22 }}>
                C'est le nom que les autres verront sur Dumbys.
              </Text>
            </View>

            {/* Input */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F2F3F7",
              borderRadius: RADIUS.xl,
              paddingHorizontal: 18,
              borderWidth: 2,
              borderColor: usernameError ? "#EF4444" : isValid ? PALETTE.sarcelle : "transparent",
            }}>
              <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle, marginRight: 4 }}>@</Text>
              <TextInput
                value={usernameInput}
                onChangeText={(v) => { setUsernameInput(v); setUsernameError(""); }}
                placeholder="ton_pseudo"
                placeholderTextColor="#C0C0C0"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                maxLength={24}
                returnKeyType="done"
                style={{ flex: 1, fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A", paddingVertical: 16 }}
              />
              {isValid && !usernameError && (
                <Ionicons name="checkmark-circle" size={22} color={PALETTE.sarcelle} />
              )}
            </View>

            {usernameError ? (
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: "#EF4444", marginTop: 8, marginLeft: 4 }}>
                {usernameError}
              </Text>
            ) : (
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#BBBBBB", marginTop: 8, marginLeft: 4 }}>
                Entre 3 et 24 caractères, sans espaces.
              </Text>
            )}
          </View>

          {/* CTA */}
          <AnimatedPressable
            onPress={handleContinue}
            disabled={updateUsername.isPending}
            style={{ borderRadius: RADIUS.xl, overflow: "hidden" }}
          >
            <LinearGradient
              colors={isValid ? [PALETTE.sarcelle, "#2ABFB8"] : ["#DDD", "#CCC"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 17, alignItems: "center", justifyContent: "center" }}
            >
              {updateUsername.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: "#FFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                  Continuer
                </Text>
              )}
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  // ── Step 3: Themes ───────────────────────────────────────────
  if (step === "themes") {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFF" }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING["2xl"], paddingTop: insets.top + 32, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: FONT.sizes["4xl"], fontFamily: FONT_FAMILY.black, color: "#1A1A1A", letterSpacing: -1, marginBottom: 6 }}>
            Tes thèmes 🎯
          </Text>
          <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#888", marginBottom: 32, lineHeight: 22 }}>
            Choisis les univers qui t'intéressent. On te suggérera des groupes à rejoindre.
          </Text>

          {/* Theme grid */}
          {(() => {
            const CARD_W = (W - SPACING["2xl"] * 2 - 12) / 2;
            const PAD = W < 380 ? 12 : 18;
            const ICON_SIZE = W < 380 ? 36 : 42;
            return (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
                {PUBLIC_CATEGORIES.map((cat) => {
                  const isActive = selectedThemes.includes(cat.key);
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => toggleTheme(cat.key)}
                      style={{
                        width: CARD_W,
                        borderRadius: RADIUS.xl,
                        overflow: "hidden",
                        borderWidth: 2.5,
                        borderColor: isActive ? cat.color : "#F2F3F7",
                      }}
                    >
                      <LinearGradient
                        colors={isActive ? [cat.color, cat.color + "CC"] : ["#F2F3F7", "#F2F3F7"]}
                        style={{ padding: PAD, flexDirection: "row", alignItems: "center", gap: 10 }}
                      >
                        <View style={{ width: ICON_SIZE, height: ICON_SIZE, borderRadius: 13, backgroundColor: isActive ? "rgba(255,255,255,0.25)" : `${cat.color}18`, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Ionicons name={cat.icon as any} size={20} color={isActive ? "#FFF" : cat.color} />
                        </View>
                        <Text
                          style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: isActive ? "#FFF" : "#1A1A1A", flex: 1 }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {cat.label}
                        </Text>
                        {isActive && (
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Ionicons name="checkmark" size={13} color="#FFF" />
                          </View>
                        )}
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            );
          })()}

          {/* Suggested groups — always shown */}
          {topGroups.length > 0 && (
            <>
              <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A", marginBottom: 4 }}>
                {selectedThemes.length > 0 ? "Groupes suggérés 🎯" : "Groupes populaires 🔥"}
              </Text>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#999", marginBottom: 16 }}>
                {selectedThemes.length > 0 ? "Basé sur tes centres d'intérêt" : "Rejoins-en un pour commencer !"}
              </Text>
              <View style={{ gap: 10 }}>
                {topGroups.map((g) => {
                  const banner = getGroupBannerColor(g.id);
                  const joined = joinedGroupIds.has(g.id);
                  return (
                    <View key={g.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F8F8FA", borderRadius: RADIUS.xl, padding: 12, gap: 12 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 14, overflow: "hidden" }}>
                        <LinearGradient colors={[banner.from, banner.to]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 18, fontFamily: FONT_FAMILY.black, color: "rgba(255,255,255,0.6)" }}>
                            {g.name.slice(0, 2).toUpperCase()}
                          </Text>
                        </LinearGradient>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }} numberOfLines={1}>{g.name}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "#AAA" }}>
                            {g.member_count} membres
                          </Text>
                          {g.category && (() => {
                            const cat = PUBLIC_CATEGORIES.find((c) => c.key === g.category);
                            if (!cat) return null;
                            const isMatch = selectedThemes.includes(g.category);
                            return (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: isMatch ? `${cat.color}18` : "#F2F3F7", borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 }}>
                                <Ionicons name={cat.icon as any} size={10} color={isMatch ? cat.color : "#BBB"} />
                                <Text style={{ fontSize: 10, fontFamily: FONT_FAMILY.medium, color: isMatch ? cat.color : "#BBB" }}>{cat.label}</Text>
                              </View>
                            );
                          })()}
                        </View>
                      </View>
                      {joined ? (
                        <View style={{ backgroundColor: `${PALETTE.sarcelle}15`, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6 }}>
                          <Text style={{ color: PALETTE.sarcelle, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>Rejoint ✓</Text>
                        </View>
                      ) : (
                        <AnimatedPressable
                          onPress={() => handleJoinGroup(g.id)}
                          style={{ backgroundColor: PALETTE.sarcelle, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7 }}
                        >
                          <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>Rejoindre</Text>
                        </AnimatedPressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: SPACING["2xl"], paddingBottom: Math.max(insets.bottom, 20) + 8, paddingTop: 12, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" }}>
          <AnimatedPressable
            onPress={finish}
            style={{ borderRadius: RADIUS.xl, overflow: "hidden" }}
          >
            <LinearGradient
              colors={selectedThemes.length > 0 ? [PALETTE.sarcelle, "#2ABFB8"] : ["#DDD", "#CCC"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 17, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 }}
            >
              <Text style={{ color: "#FFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                {selectedThemes.length > 0 ? "Commencer l'aventure 🚀" : "Continuer sans thème"}
              </Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  return null;
}
