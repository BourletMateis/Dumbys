import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  StatusBar,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/src/store/useOnboardingStore";
import { PALETTE, FONT, FONT_FAMILY } from "@/src/theme";

const { width: W, height: H } = Dimensions.get("window");

type Slide = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  gradientColors: [string, string];
  title: string;
  subtitle: string;
  tips: string[];
};

const SLIDES: Slide[] = [
  {
    key: "welcome",
    icon: "flash",
    iconColor: PALETTE.jaune,
    gradientColors: ["#0D1A1A", "#080F0F"],
    title: "Bienvenue sur\nDumbeez !",
    subtitle: "L'app de défis vidéo entre amis. Poste, challenge, grimpe au classement.",
    tips: [],
  },
  {
    key: "feed",
    icon: "home",
    iconColor: PALETTE.sarcelle,
    gradientColors: ["#0A1818", "#080F0F"],
    title: "Feed & Explore",
    subtitle: "Ton hub principal pour voir l'activité de ta communauté.",
    tips: [
      "Feed — les vidéos de tes groupes en temps réel",
      "Explore — découvre par catégorie en mode TikTok",
      "Cloche — toutes tes notifications en un clic",
    ],
  },
  {
    key: "groups",
    icon: "people",
    iconColor: PALETTE.sarcelle,
    gradientColors: ["#0A1818", "#080F0F"],
    title: "Groupes Privés",
    subtitle: "Lance des défis dans un cercle fermé avec tes amis.",
    tips: [
      "Crée un groupe depuis l'onglet Upload",
      "Partage le code d'invitation à tes amis",
      "Chaque membre poste sa vidéo de la semaine",
    ],
  },
  {
    key: "tournaments",
    icon: "trophy",
    iconColor: PALETTE.jaune,
    gradientColors: ["#1A1208", "#080F0F"],
    title: "Tournois & Défis",
    subtitle: "Organise des compétitions et récompense le meilleur.",
    tips: [
      "Crée un tournoi dans un groupe existant",
      "Les membres votent pour leur vidéo préférée",
      "Définis une récompense pour motiver tout le monde",
    ],
  },
  {
    key: "upload",
    icon: "add-circle",
    iconColor: PALETTE.fuchsia,
    gradientColors: ["#1A0810", "#080F0F"],
    title: "Poste ta Vidéo",
    subtitle: "Le bouton + au centre de la barre — c'est ton portail vers le fun.",
    tips: [
      "Enregistrer — ouvre la caméra directement",
      "Déposer — choisie depuis ta galerie",
      "Sélectionne le groupe avant de publier",
    ],
  },
  {
    key: "friends",
    icon: "people-circle",
    iconColor: PALETTE.sarcelle,
    gradientColors: ["#0A1818", "#080F0F"],
    title: "Amis & Social",
    subtitle: "Plus tu es connecté, plus c'est fun.",
    tips: [
      "Recherche tes amis par username",
      "Commente et like les vidéos du feed",
      "Visite les profils pour voir leurs stats",
    ],
  },
  {
    key: "ready",
    icon: "rocket",
    iconColor: PALETTE.fuchsia,
    gradientColors: ["#1A0810", "#080F0F"],
    title: "Let's Go !",
    subtitle: "Tu sais tout. Maintenant c'est à toi de jouer. Relève le premier défi.",
    tips: [],
  },
];

function SlideItem({ slide, insets }: { slide: Slide; insets: ReturnType<typeof useSafeAreaInsets> }) {
  const isFirst = slide.key === "welcome";
  const isLast = slide.key === "ready";

  return (
    <View style={{ width: W, height: H }}>
      <LinearGradient
        colors={slide.gradientColors}
        style={{ flex: 1, paddingHorizontal: 28 }}
      >
        {/* Glow blob */}
        <View
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: slide.iconColor,
            opacity: 0.07,
            top: H * 0.12,
            alignSelf: "center",
          }}
        />

        {/* Icon circle */}
        <View
          style={{
            marginTop: insets.top + (isFirst ? 80 : 70),
            alignSelf: "center",
            width: isFirst ? 120 : 100,
            height: isFirst ? 120 : 100,
            borderRadius: isFirst ? 60 : 50,
            backgroundColor: `${slide.iconColor}18`,
            borderWidth: 1.5,
            borderColor: `${slide.iconColor}40`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isFirst ? (
            <Ionicons name={slide.icon} size={52} color={slide.iconColor} />
          ) : (
            <Ionicons name={slide.icon} size={isFirst ? 52 : 44} color={slide.iconColor} />
          )}
        </View>

        {/* Texts */}
        <View style={{ marginTop: 32, alignItems: isFirst || isLast ? "center" : "flex-start" }}>
          <Text
            style={{
              fontSize: isFirst ? FONT.sizes["5xl"] + 4 : FONT.sizes["4xl"],
              fontFamily: FONT_FAMILY.black,
              color: "#F5F5F5",
              textAlign: isFirst || isLast ? "center" : "left",
              lineHeight: isFirst ? 48 : 42,
              marginBottom: 16,
            }}
          >
            {slide.title}
          </Text>
          <Text
            style={{
              fontSize: FONT.sizes.base,
              fontFamily: FONT_FAMILY.regular,
              color: "#A0A0A0",
              textAlign: isFirst || isLast ? "center" : "left",
              lineHeight: 24,
              marginBottom: slide.tips.length ? 32 : 0,
            }}
          >
            {slide.subtitle}
          </Text>
        </View>

        {/* Tips */}
        {slide.tips.length > 0 && (
          <View style={{ gap: 12 }}>
            {slide.tips.map((tip, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                <Text
                  style={{
                    fontSize: FONT.sizes.sm,
                    fontFamily: FONT_FAMILY.medium,
                    color: "#D0D0D0",
                    lineHeight: 20,
                  }}
                >
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Last slide accent */}
        {isLast && (
          <View style={{ marginTop: 32, alignItems: "center" }}>
            <LinearGradient
              colors={[PALETTE.fuchsia, PALETTE.sarcelle]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 40,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
                Dumbeez
              </Text>
            </LinearGradient>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { complete: completeOnboarding } = useOnboardingStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLast = activeIndex === SLIDES.length - 1;

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveIndex(index);
  }, []);

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      finish();
    } else {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#080F0F" }}>
      <StatusBar barStyle="light-content" />

      {/* Skip */}
      {!isLast && (
        <Pressable
          onPress={finish}
          hitSlop={12}
          style={{
            position: "absolute",
            top: insets.top + 12,
            right: 24,
            zIndex: 10,
          }}
        >
          <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: "#606060" }}>
            Passer
          </Text>
        </Pressable>
      )}

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => <SlideItem slide={item} insets={insets} />}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
        scrollEventThrottle={16}
      />

      {/* Bottom bar */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 24,
          left: 28,
          right: 28,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Dots */}
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === activeIndex ? PALETTE.sarcelle : "#2C2C2C",
              }}
            />
          ))}
        </View>

        {/* CTA */}
        <Pressable onPress={goNext}>
          <LinearGradient
            colors={isLast ? [PALETTE.fuchsia, "#C4005F"] : [PALETTE.sarcelle, "#28A5A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 24,
            }}
          >
            <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
              {isLast ? "C'est parti !" : "Suivant"}
            </Text>
            <Ionicons name={isLast ? "rocket" : "arrow-forward"} size={18} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
