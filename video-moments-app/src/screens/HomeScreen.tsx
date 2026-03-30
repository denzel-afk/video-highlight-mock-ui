import React, { useState, useRef, useEffect, useCallback } from "react";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";

// --- Highlight UI constants and types ---
const GAP = 16;
const PHONE_HEIGHT = 750;
const PHONE_WIDTH = 350;
const INNER_RADIUS = 18;
const s = (base: number) => Math.round((PHONE_WIDTH / 260) * base);

const GLASS = {
  overlayMid: "rgba(15,15,25,0.82)",
  overlayLight: "rgba(255,255,255,0.09)",
  borderWhite: "rgba(255,255,255,0.14)",
  textMuted: "rgba(255,255,255,0.55)",
};

const fmt = (secValue: number) => {
  const safe = Math.max(0, secValue || 0);
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(safe % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
};

type Category = "event" | "nature" | "emotion";

const CAT: Record<Category, { label: string; icon: string; accent: string }> = {
  event: { label: "Event", icon: "calendar-outline", accent: "#FFB347" },
  nature: { label: "Nature", icon: "leaf-outline", accent: "#6EE77A" },
  emotion: { label: "Emotion", icon: "heart-outline", accent: "#FF6FA1" },
};

type Highlight = {
  id: string;
  category: Category;
  start: number;
  end: number;
};

const HIGHLIGHTS: Highlight[] = [
  { id: "e1", category: "event", start: 5, end: 9 },
  { id: "e2", category: "event", start: 33, end: 37 },
  { id: "n1", category: "nature", start: 13, end: 17 },
  { id: "n2", category: "nature", start: 44, end: 48 },
  { id: "m1", category: "emotion", start: 21, end: 26 },
  { id: "m2", category: "emotion", start: 50, end: 54 },
];

const HomeScreen = () => {
  const [video, setVideo] = useState<any>(
    require("../data/birthday_surprise.mp4"),
  );
  const [uploading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const loadingAnim = useRef(new Animated.Value(0)).current;

  const pickVideo = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "video/mp4",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.assets && res.assets[0]?.uri) {
        setShowLoading(true);

        Animated.timing(loadingAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          setShowLoading(false);
          setVideo({ uri: res.assets[0].uri });
          setShouldAutoPlay(true);

          Animated.timing(loadingAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }, 5000);
      }
    } catch (e) {
      alert("Failed to pick video.");
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={pickVideo}
        disabled={uploading || showLoading}
        activeOpacity={0.8}
      >
        <Ionicons
          name="cloud-upload-outline"
          size={48}
          color="#fff"
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.uploadTitle}>
          {showLoading
            ? "Processing..."
            : uploading
            ? "Uploading..."
            : "Upload Video"}
        </Text>
        <Text style={styles.uploadSubtitle}>
          Click to select a video file to upload and process highlights.
        </Text>
      </TouchableOpacity>

      <View style={styles.row}>
        {(["event", "nature", "emotion"] as Category[]).map((cat) => (
          <PhoneScreen
            key={cat}
            category={cat}
            videoSource={video}
            shouldAutoPlay={shouldAutoPlay}
            setShouldAutoPlay={setShouldAutoPlay}
          />
        ))}
      </View>

      {showLoading && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            opacity: loadingAnim,
          }}
        >
          <BlurView
            intensity={80}
            tint="dark"
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    scale: loadingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1.08],
                    }),
                  },
                ],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={64}
                color="#fff"
                style={{ marginBottom: 24 }}
              />
              <Text style={styles.processingTitle}>Processing Video...</Text>
              <Text style={styles.processingText}>
                Please wait while we process your video.
              </Text>
            </Animated.View>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
};

const PhoneScreen = ({
  category,
  videoSource,
  shouldAutoPlay,
  setShouldAutoPlay,
}: {
  category: Category;
  videoSource: any;
  shouldAutoPlay?: boolean;
  setShouldAutoPlay?: (v: boolean) => void;
}) => {
  const videoRef = useRef<Video>(null);
  const prevHLId = useRef<string | null>(null);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const sweepAnim = useRef(new Animated.Value(-1)).current;

  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeTranslateY = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;

  const headScale = useRef(new Animated.Value(1)).current;
  const homeIndicatorOpacity = useRef(new Animated.Value(1)).current;

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted] = useState(true);

  const trackWidthRef = useRef(PHONE_WIDTH - s(20));
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  const initialScrubX = useRef(0);
  const initialScrubProgress = useRef(0);

  const { accent, label, icon } = CAT[category];
  const catHL = HIGHLIGHTS.filter((h) => h.category === category);
  const activeHL =
    catHL.find((h) => position >= h.start && position <= h.end) ?? null;

  const progress = duration > 0 ? position / duration : 0;
  const displayProgress = isScrubbing ? scrubProgress : progress;
  const safeDuration = duration > 0 ? duration : 1;

  useEffect(() => {
    const first = catHL[0];
    if (!first) return;

    const t = setTimeout(async () => {
      // Wait for video to be ready
      const status = await videoRef.current?.getStatusAsync();
      if (!status?.isLoaded) {
        // If not loaded yet, wait a bit more
        setTimeout(async () => {
          await videoRef.current?.setPositionAsync(
            Math.max(0, (first.start - 1) * 1000),
          );
          await videoRef.current?.playAsync();
          setIsPlaying(true);
        }, 500);
      } else {
        // Video is loaded, seek and play immediately
        await videoRef.current?.setPositionAsync(
          Math.max(0, (first.start - 1) * 1000),
        );
        await videoRef.current?.playAsync();
        setIsPlaying(true);
      }

      // Reset shouldAutoPlay flag after upload
      if (shouldAutoPlay) {
        setShouldAutoPlay?.(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [videoSource, catHL, shouldAutoPlay, setShouldAutoPlay]);

  useEffect(() => {
    if (activeHL && activeHL.id !== prevHLId.current) {
      prevHLId.current = activeHL.id;

      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: false,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]).start();

      sweepAnim.setValue(-1);
      Animated.timing(sweepAnim, {
        toValue: 1.2,
        duration: 850,
        useNativeDriver: true,
      }).start();

      badgeOpacity.setValue(0);
      badgeTranslateY.setValue(PHONE_HEIGHT * 0.32);
      badgeScale.setValue(1.08);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(badgeOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.spring(badgeScale, {
            toValue: 1,
            tension: 90,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(420),
        Animated.parallel([
          Animated.spring(badgeTranslateY, {
            toValue: 0,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.timing(badgeScale, {
            toValue: 0.75,
            duration: 260,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }

    if (!activeHL) {
      prevHLId.current = null;
      Animated.timing(badgeOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [
    activeHL,
    badgeOpacity,
    badgeScale,
    badgeTranslateY,
    flashAnim,
    glowAnim,
    sweepAnim,
  ]);

  useEffect(() => {
    Animated.timing(homeIndicatorOpacity, {
      toValue: isScrubbing ? 1 : isPlaying ? 0.18 : 1,
      duration: isScrubbing ? 120 : isPlaying ? 450 : 250,
      useNativeDriver: true,
    }).start();
  }, [isScrubbing, isPlaying, homeIndicatorOpacity]);

  const onStatus = useCallback((st: AVPlaybackStatus) => {
    if (!st.isLoaded) return;

    setPosition(st.positionMillis / 1000);
    const newDuration = (st.durationMillis ?? 0) / 1000;
    setDuration(newDuration);
    durationRef.current = newDuration;
    setIsPlaying(st.isPlaying);

    if (st.didJustFinish) {
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current?.playAsync();
      setIsPlaying(true);
    }
  };

  const seekAndPlay = async (seconds: number) => {
    if (durationRef.current <= 0) return;
    const clampedSeconds = Math.max(0, Math.min(seconds, durationRef.current));
    await videoRef.current?.setPositionAsync(clampedSeconds * 1000);
    await videoRef.current?.playAsync();
    setIsPlaying(true);
  };

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  };

  const ratioFromLocationX = (locationX: number) => {
    const w = trackWidthRef.current;
    if (w <= 1) return 0;
    return Math.max(0, Math.min(locationX / w, 1));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => durationRef.current > 1, // Only allow scrubbing if video is loaded
      onMoveShouldSetPanResponder: () => durationRef.current > 1,

      onPanResponderGrant: (evt) => {
        if (durationRef.current <= 1) return; // Safety check
        const ratio = ratioFromLocationX(evt.nativeEvent.locationX);
        setIsScrubbing(true);
        setScrubProgress(ratio);
        initialScrubX.current = evt.nativeEvent.locationX;
        initialScrubProgress.current = ratio;

        // Pause video while scrubbing
        videoRef.current?.pauseAsync();

        Animated.spring(headScale, {
          toValue: 1.18,
          tension: 120,
          friction: 9,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderMove: (evt, gestureState) => {
        if (durationRef.current <= 1) return; // Safety check
        // Calculate new position based on initial position + gesture movement
        const newX = initialScrubX.current + gestureState.dx;
        const ratio = ratioFromLocationX(newX);
        setScrubProgress(ratio);

        // Update video position in real-time while scrubbing
        const seconds = ratio * durationRef.current;
        videoRef.current?.setPositionAsync(
          Math.max(0, Math.min(seconds * 1000, durationRef.current * 1000)),
        );
      },

      onPanResponderRelease: async (evt, gestureState) => {
        if (durationRef.current <= 1) return; // Safety check
        const newX = initialScrubX.current + gestureState.dx;
        const ratio = ratioFromLocationX(newX);
        const seconds = ratio * durationRef.current;

        setScrubProgress(ratio);
        setIsScrubbing(false);

        Animated.spring(headScale, {
          toValue: 1,
          tension: 120,
          friction: 9,
          useNativeDriver: true,
        }).start();

        // Seek to final position and play
        await videoRef.current?.setPositionAsync(
          Math.max(0, Math.min(seconds * 1000, durationRef.current * 1000)),
        );
        await videoRef.current?.playAsync();
        setIsPlaying(true);
      },

      onPanResponderTerminate: async (evt, gestureState) => {
        if (durationRef.current <= 1) return; // Safety check
        const newX = initialScrubX.current + gestureState.dx;
        const ratio = ratioFromLocationX(newX);
        const seconds = ratio * durationRef.current;

        setScrubProgress(ratio);
        setIsScrubbing(false);

        Animated.spring(headScale, {
          toValue: 1,
          tension: 120,
          friction: 9,
          useNativeDriver: true,
        }).start();

        // Seek to final position and play
        await videoRef.current?.setPositionAsync(
          Math.max(0, Math.min(seconds * 1000, durationRef.current * 1000)),
        );
        await videoRef.current?.playAsync();
        setIsPlaying(true);
      },
    }),
  ).current;

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.12)", accent],
  });

  const shadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 28],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.95],
  });

  return (
    <Animated.View
      style={[
        styles.deviceFrame,
        {
          borderColor,
          shadowColor: accent,
          shadowRadius,
          shadowOpacity,
        },
      ]}
    >
      <View style={styles.punchHole} />

      <View style={styles.innerScreen}>
        <Video
          ref={videoRef}
          source={videoSource}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={onStatus}
          shouldPlay={shouldAutoPlay}
          isLooping={false}
          isMuted={isMuted}
        />

        <LinearGradient
          colors={["rgba(0,0,0,0.30)", "transparent", "rgba(0,0,0,0.78)"]}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: accent,
              opacity: flashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.22],
              }),
            },
          ]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.sweepWrap,
            {
              transform: [
                {
                  translateX: sweepAnim.interpolate({
                    inputRange: [-1, 1.2],
                    outputRange: [-PHONE_WIDTH * 1.2, PHONE_WIDTH * 1.2],
                  }),
                },
                { rotate: "-18deg" },
              ],
              opacity: sweepAnim.interpolate({
                inputRange: [-1, -0.6, 0, 0.8, 1.2],
                outputRange: [0, 0, 0.22, 0.08, 0],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.18)",
              "rgba(255,255,255,0.38)",
              "rgba(255,255,255,0.18)",
              "rgba(255,255,255,0)",
            ]}
            locations={[0, 0.25, 0.5, 0.75, 1]}
            style={styles.sweepBand}
          />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.badgeAnchor,
            {
              opacity: badgeOpacity,
              transform: [
                { translateY: badgeTranslateY },
                { scale: badgeScale },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.76)", "rgba(20,20,28,0.62)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.centerBadge, { borderColor: accent }]}
          >
            <View
              style={[
                styles.centerBadgeIconWrap,
                { backgroundColor: `${accent}20` },
              ]}
            >
              <Ionicons name={icon as any} size={s(15)} color={accent} />
            </View>

            <View>
              <Text
                style={[
                  styles.centerBadgeTitle,
                  { color: accent, fontSize: s(12) },
                ]}
              >
                {label} Highlight
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.statusBar} pointerEvents="none">
          <Text style={[styles.statusTime, { fontSize: s(9) }]}>09:41</Text>
          <View style={styles.statusIcons}>
            <Ionicons name="wifi" size={s(10)} color="rgba(255,255,255,0.85)" />
            <Ionicons
              name="battery-half"
              size={s(11)}
              color="rgba(255,255,255,0.85)"
            />
          </View>
        </View>

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topIconBtn} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={s(13)} color="#fff" />
          </TouchableOpacity>

          <Text style={[styles.videoDate, { fontSize: s(9) }]}>
            ★ Fri, 27 Mar 2026
          </Text>

          <TouchableOpacity style={styles.topIconBtn} activeOpacity={0.75}>
            <Ionicons name="ellipsis-horizontal" size={s(13)} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={togglePlay}
            activeOpacity={1}
          >
            {!isPlaying && (
              <View style={styles.playBtnWrap} pointerEvents="none">
                <View style={styles.playBtn}>
                  <Ionicons
                    name="play"
                    size={s(16)}
                    color="#fff"
                    style={{ marginLeft: s(2) }}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <View
            style={styles.trackTouch}
            onLayout={onTrackLayout}
            {...panResponder.panHandlers}
          >
            <View style={styles.track}>
              <View style={styles.trackBg} />

              <View
                style={[
                  styles.fill,
                  {
                    width: `${displayProgress * 100}%`,
                    backgroundColor: "rgba(255,255,255,0.90)",
                  },
                ]}
              />

              {HIGHLIGHTS.map((h) => {
                const segAccent = CAT[h.category].accent;
                const l = (h.start / safeDuration) * 100;
                const w = ((h.end - h.start) / safeDuration) * 100;
                const curr = h === activeHL;
                const thisCat = h.category === category;

                return (
                  <View
                    key={h.id}
                    style={[
                      styles.seg,
                      {
                        left: `${l}%`,
                        width: `${w}%`,
                        backgroundColor: segAccent,
                        opacity: curr ? 1 : thisCat ? 0.65 : 0.15,
                        height: curr ? 6 : 4,
                        bottom: curr ? 0 : 1,
                        borderRadius: 2,
                      },
                    ]}
                  />
                );
              })}

              <Animated.View
                style={[
                  styles.playhead,
                  {
                    left: `${displayProgress * 100}%`,
                    backgroundColor: "#fff",
                    transform: [{ scale: headScale }],
                  },
                ]}
              />
            </View>
          </View>

          <Text
            style={[styles.timeTxt, { fontSize: s(9), textAlign: "center" }]}
          >
            {fmt(isScrubbing ? scrubProgress * duration : position)} /{" "}
            {fmt(duration)}
          </Text>

          <View style={styles.actionRow}>
            {(
              [
                "heart-outline",
                "create-outline",
                "share-social-outline",
                "trash-outline",
              ] as const
            ).map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[
                  styles.actionBtn,
                  {
                    width: s(34),
                    height: s(34),
                    borderRadius: s(17),
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={ic}
                  size={s(15)}
                  color="rgba(255,255,255,0.80)"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.homeIndicatorWrap,
            {
              opacity: homeIndicatorOpacity,
            },
          ]}
        >
          <View style={styles.homeIndicator} />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0c",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadButton: {
    backgroundColor: "#222",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 32,
  },
  uploadTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  uploadSubtitle: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
  },
  processingTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  processingText: {
    color: "#fff",
    fontSize: 16,
  },

  row: {
    flexDirection: "row",
    gap: GAP,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  deviceFrame: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderRadius: 24,
    backgroundColor: "#111",
    padding: 6,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
  },

  punchHole: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    width: s(9),
    height: s(9),
    borderRadius: s(5),
    backgroundColor: "#060606",
    zIndex: 50,
  },

  innerScreen: {
    flex: 1,
    borderRadius: INNER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  statusBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(10),
    paddingVertical: s(5),
    zIndex: 41,
  },
  statusTime: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  statusIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
  },

  topBar: {
    position: "absolute",
    top: s(22),
    left: s(8),
    right: s(8),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 40,
  },
  videoDate: {
    color: "rgba(255,255,255,0.80)",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  topIconBtn: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    backgroundColor: "rgba(0,0,0,0.34)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  sweepWrap: {
    position: "absolute",
    top: -PHONE_HEIGHT * 0.15,
    left: -PHONE_WIDTH * 0.5,
    width: PHONE_WIDTH * 0.5,
    height: PHONE_HEIGHT * 1.3,
    zIndex: 12,
  },
  sweepBand: {
    flex: 1,
    borderRadius: PHONE_WIDTH * 0.25,
  },

  badgeAnchor: {
    position: "absolute",
    top: s(46),
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 30,
  },
  centerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    paddingHorizontal: s(12),
    paddingVertical: s(9),
    borderRadius: s(14),
    borderWidth: 1,
    minWidth: PHONE_WIDTH * 0.56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  centerBadgeIconWrap: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    alignItems: "center",
    justifyContent: "center",
  },
  centerBadgeTitle: {
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  playBtnWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.30)",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GLASS.overlayMid,
    borderTopWidth: 1,
    borderTopColor: GLASS.borderWhite,
    paddingHorizontal: s(10),
    paddingTop: s(8),
    paddingBottom: s(10),
    gap: s(7),
    zIndex: 15,
  },

  trackTouch: {
    paddingVertical: s(8),
    justifyContent: "center",
  },
  track: {
    height: 6,
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  trackBg: {
    ...StyleSheet.absoluteFillObject,
    height: 3,
    top: 1.5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 1.5,
    height: 3,
    borderRadius: 999,
  },
  seg: {
    position: "absolute",
  },
  playhead: {
    position: "absolute",
    top: (6 - s(12)) / 2,
    width: s(12),
    height: s(12),
    borderRadius: s(6),
    marginLeft: -s(6),
    borderWidth: 1.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 2,
  },

  timeTxt: {
    color: GLASS.textMuted,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: GLASS.borderWhite,
    paddingTop: s(7),
    paddingBottom: s(2),
  },
  actionBtn: {
    backgroundColor: GLASS.overlayLight,
    borderWidth: 1,
    borderColor: GLASS.borderWhite,
    alignItems: "center",
    justifyContent: "center",
  },

  homeIndicatorWrap: {
    position: "absolute",
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  homeIndicator: {
    width: s(60),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});

export default HomeScreen;
