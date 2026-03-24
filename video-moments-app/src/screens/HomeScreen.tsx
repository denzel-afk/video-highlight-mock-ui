import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  PanResponder,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Moment } from "../types";

const { width, height } = Dimensions.get("window");

// ─── Glass Token System ──────────────────────────────────────────────────────
const GLASS = {
  // Surfaces
  overlayDark: "rgba(0,0,0,0.52)",
  overlayMid: "rgba(20,20,30,0.62)",
  overlayLight: "rgba(255,255,255,0.10)",
  // Borders
  borderWhite: "rgba(255,255,255,0.18)",
  borderWhiteBright: "rgba(255,255,255,0.32)",
  // Accent
  accentGlow: "rgba(120,200,255,0.55)",
  accentBorder: "rgba(140,210,255,0.70)",
  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.65)",
  textMuted: "rgba(255,255,255,0.40)",
};

// ─── Sample Data ─────────────────────────────────────────────────────────────
const sampleMoments: Moment[] = [
  {
    id: "1",
    type: "nature",
    thumbnail:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    description: "Beautiful sunset at the beach",
    videoUrl: "https://example.com/video1.mp4",
    timestamp: 0,
  },
  {
    id: "2",
    type: "event",
    thumbnail:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    description: "Birthday celebration with friends",
    videoUrl: "https://example.com/video2.mp4",
    timestamp: 0,
  },
  {
    id: "3",
    type: "nature",
    thumbnail:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
    description: "Mountain hiking adventure",
    videoUrl: "https://example.com/video3.mp4",
    timestamp: 0,
  },
  {
    id: "4",
    type: "event",
    thumbnail:
      "https://images.unsplash.com/photo-1511765224389-37f0e77cf0eb?w=800",
    description: "City lights at night",
    videoUrl: "https://example.com/video4.mp4",
    timestamp: 0,
  },
  {
    id: "5",
    type: "nature",
    thumbnail:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    description: "Forest pathway",
    videoUrl: "https://example.com/video5.mp4",
    timestamp: 0,
  },
  {
    id: "6",
    type: "event",
    thumbnail:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    description: "Lake view",
    videoUrl: "https://example.com/video6.mp4",
    timestamp: 0,
  },
];

// ─── Glass Pill Button ────────────────────────────────────────────────────────
const GlassPill = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.glassPill, style]}
  >
    {children}
  </TouchableOpacity>
);

// ─── Top Bar ──────────────────────────────────────────────────────────────────
const TopBar = () => (
  <View style={styles.topBar}>
    {/* Left: back */}
    <GlassPill onPress={() => {}}>
      <Ionicons name="chevron-back" size={20} color={GLASS.textPrimary} />
    </GlassPill>

    {/* Right: loop + more */}
    <View style={styles.topRight}>
      <GlassPill onPress={() => {}} style={{ marginRight: 8 }}>
        <Ionicons name="refresh-outline" size={18} color={GLASS.textPrimary} />
      </GlassPill>
      <GlassPill onPress={() => {}}>
        <Ionicons
          name="ellipsis-vertical"
          size={18}
          color={GLASS.textPrimary}
        />
      </GlassPill>
    </View>
  </View>
);

// ─── Video Controls Overlay ───────────────────────────────────────────────────
const VideoControls = ({
  isVideo,
  currentTime = "00:01",
  duration = "00:10",
}: {
  isVideo: boolean;
  currentTime?: string;
  duration?: string;
}) => {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  if (!isVideo) return null;

  return (
    <View style={styles.videoControlsWrap}>
      {/* Play button - circular glass */}
      <TouchableOpacity
        onPress={() => setPlaying((p) => !p)}
        style={styles.videoPlayBtn}
        activeOpacity={0.75}
      >
        <Ionicons
          name={playing ? "pause" : "play"}
          size={16}
          color="#fff"
          style={{ marginLeft: playing ? 0 : 2 }}
        />
      </TouchableOpacity>

      {/* Timestamp */}
      <Text style={styles.videoTimestamp}>
        {currentTime} / {duration}
      </Text>

      {/* Mute button - circular glass */}
      <TouchableOpacity
        onPress={() => setMuted((m) => !m)}
        style={styles.videoPlayBtn}
        activeOpacity={0.75}
      >
        <Ionicons
          name={muted ? "volume-mute" : "volume-high"}
          size={16}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
};

// ─── Thumbnail Strip ──────────────────────────────────────────────────────────
const ThumbnailStrip = ({
  moments,
  selectedIndex,
  onSelect,
}: {
  moments: Moment[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) => (
  <View style={styles.filmstripWrap}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filmstripContent}
    >
      {moments.map((m, i) => {
        const active = i === selectedIndex;
        return (
          <TouchableOpacity
            key={m.id}
            onPress={() => onSelect(i)}
            activeOpacity={0.8}
            style={[styles.thumbItem, active && styles.thumbItemActive]}
          >
            <Image
              source={{ uri: m.thumbnail }}
              style={styles.thumbImg}
              resizeMode="cover"
            />
            {/* Active glow overlay */}
            {active && <View style={styles.thumbActiveOverlay} />}
            {/* Video badge */}
            {m.videoUrl && (
              <View style={styles.thumbVideoBadge}>
                <Ionicons name="play" size={8} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

// ─── Action Bar ───────────────────────────────────────────────────────────────
const ACTIONS = [
  { icon: "heart-outline", label: "Like" },
  { icon: "create-outline", label: "Edit" },
  { icon: "information-circle-outline", label: "Info" },
  { icon: "share-social-outline", label: "Share" },
  { icon: "trash-outline", label: "Delete" },
] as const;

const ActionBar = () => {
  const [liked, setLiked] = useState(false);
  return (
    <View style={styles.actionBar}>
      {ACTIONS.map(({ icon, label }) => {
        const isHeart = label === "Like";
        return (
          <TouchableOpacity
            key={label}
            style={styles.actionBtn}
            onPress={() => isHeart && setLiked((l) => !l)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isHeart && liked ? "heart" : (icon as any)}
              size={22}
              color={isHeart && liked ? "#ff5c87" : GLASS.textPrimary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedMoment = sampleMoments[selectedIndex];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
    onPanResponderRelease: (_, { dx }) => {
      if (dx > 50 && selectedIndex > 0) setSelectedIndex((i) => i - 1);
      else if (dx < -50 && selectedIndex < sampleMoments.length - 1)
        setSelectedIndex((i) => i + 1);
    },
  });

  return (
    <View style={styles.root}>
      {/* Simulated Huawei device frame centered in the screen */}
      <View style={styles.deviceWrap} pointerEvents="box-none">
        <View style={styles.deviceFrame}>
          {/* Punch-hole camera (visual only) */}
          <View style={styles.punchHoleRing}>
            <View style={styles.punchHole} />
          </View>

          {/* Inner screen where the app UI lives */}
          <View style={styles.innerScreen} {...panResponder.panHandlers}>
            <StatusBar
              barStyle="light-content"
              translucent
              backgroundColor="transparent"
            />

            {/* Full-bleed background photo inside device */}
            <Image
              source={{ uri: selectedMoment.thumbnail }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />

            {/* Dim gradient scrim - top & bottom */}
            <LinearGradient
              colors={[
                "rgba(0,0,0,0.55)",
                "transparent",
                "transparent",
                "rgba(0,0,0,0.72)",
              ]}
              locations={[0, 0.25, 0.6, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            {/* Huawei-style status row: left network, center time, right battery */}
            <View style={styles.statusRow} pointerEvents="none">
              <View style={styles.statusLeft}>
                <Text style={styles.statusText}>5G</Text>
              </View>
              <View style={styles.statusCenter}>
                <Text style={styles.statusText}>09:41</Text>
              </View>
              <View style={styles.statusRight}>
                <Ionicons
                  name="battery-half"
                  size={18}
                  color={GLASS.textPrimary}
                />
              </View>
            </View>

            {/* ── Top bar ── */}
            <SafeAreaView style={styles.safeTop}>
              <TopBar />
              {/* Counter pill */}
              <View style={styles.counterPill}>
                <Text style={styles.counterText}>
                  {selectedIndex + 1} / {sampleMoments.length}
                </Text>
              </View>
            </SafeAreaView>

            {/* Empty flexible area so the inner content sizes correctly */}
            <View style={styles.swipeArea} />

            {/* ── Bottom sheet: video controls + filmstrip + actions ── */}
            <View style={styles.bottomSheet}>
              {/* Video controls pill */}
              <VideoControls isVideo={selectedMoment.type === "event"} />

              {/* Thumbnail filmstrip */}
              <ThumbnailStrip
                moments={sampleMoments}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />

              {/* Action icons */}
              <ActionBar />

              {/* Modern gesture indicator */}
              <SafeAreaView>
                <View style={styles.gestureWrap} pointerEvents="none">
                  <View style={styles.gestureBar} />
                </View>
              </SafeAreaView>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Layout constants ────────────────────────────────────────────────────────
const THUMB_SIZE = 56;
// target phone aspect ratio (approx modern phone ~19.5:9)
const DEVICE_ASPECT = 19.5 / 9;
const DEVICE_WIDTH = Math.min(width * 0.92, 420);
const DEVICE_HEIGHT = Math.min(
  DEVICE_WIDTH * DEVICE_ASPECT,
  height * 0.88,
  920,
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },

  // ── Device frame (Huawei-like) ──
  deviceWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    backgroundColor: "transparent",
  },
  deviceFrame: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    borderRadius: 38,
    backgroundColor: "rgba(10,10,12,0.95)",
    padding: 10,
    alignItems: "stretch",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    borderWidth: 2,
    // subtle blue accent border to match the glass accent
    borderColor: "rgba(120,200,255,0.12)",
  },
  punchHoleRing: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  punchHole: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0b0b0b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  innerScreen: {
    flex: 1,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  // ── Simulated system status row ──
  statusRow: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    zIndex: 30,
    justifyContent: "space-between",
    pointerEvents: "none",
  },
  statusLeft: {
    width: 60,
    alignItems: "flex-start",
    paddingLeft: 6,
  },
  statusCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  statusRight: {
    width: 60,
    alignItems: "flex-end",
    paddingRight: 6,
  },
  statusText: {
    color: GLASS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Top area ──
  safeTop: {
    position: "absolute",
    top: 36,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  glassPill: {
    backgroundColor: GLASS.overlayDark,
    borderWidth: 1,
    borderColor: GLASS.borderWhite,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    // iOS frosted feel via shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  counterPill: {
    alignSelf: "flex-end",
    marginRight: 14,
    marginTop: 6,
    backgroundColor: GLASS.overlayDark,
    borderWidth: 1,
    borderColor: GLASS.borderWhite,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  counterText: {
    color: GLASS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // ── Swipe area ──
  swipeArea: {
    flex: 1,
  },

  // ── Bottom sheet ──
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GLASS.overlayMid,
    borderTopWidth: 1,
    borderTopColor: GLASS.borderWhite,
    // Backdrop blur not universally supported, so we fake it with a semi-opaque dark
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },

  // ── Video controls ──
  videoControlsWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 2,
    backgroundColor: GLASS.overlayDark,
    borderWidth: 1,
    borderColor: GLASS.borderWhite,
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  videoPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GLASS.overlayLight,
    borderWidth: 1,
    borderColor: GLASS.borderWhiteBright,
    alignItems: "center",
    justifyContent: "center",
  },
  videoTimestamp: {
    color: GLASS.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.8,
    minWidth: 90,
    textAlign: "center",
  },

  // ── Filmstrip ──
  filmstripWrap: {
    marginTop: 12,
    paddingBottom: 4,
  },
  filmstripContent: {
    paddingHorizontal: 12,
    gap: 6,
    alignItems: "center",
  },
  thumbItem: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: GLASS.borderWhite,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  thumbItemActive: {
    borderColor: GLASS.accentBorder,
    // Glow effect via shadow
    shadowColor: "#8CD8FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  thumbActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GLASS.accentGlow,
    borderRadius: 8,
  },
  thumbVideoBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GLASS.borderWhite,
  },

  // ── Action bar ──
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: GLASS.borderWhite,
    marginTop: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GLASS.overlayLight,
    borderWidth: 1,
    borderColor: GLASS.borderWhite,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  // ── Nav bar ──
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: GLASS.borderWhite,
  },
  navBtn: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  navCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  // modern gesture indicator
  gestureWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  gestureBar: {
    width: 80,
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
});

export default HomeScreen;
