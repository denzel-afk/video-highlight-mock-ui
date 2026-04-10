import React, { useRef } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

interface VideoPlayerProps {
  videoSource: any;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoSource }) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [containerSize, setContainerSize] = React.useState({
    width: 0,
    height: 0,
  });
  const [naturalSize, setNaturalSize] = React.useState({ width: 0, height: 0 });

  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const onStatus = (st: AVPlaybackStatus) => {
    const anySt = st as any;
    const foundWidth =
      anySt.naturalSize?.width ??
      anySt.naturalSize?.naturalWidth ??
      anySt.naturalSize?.w;
    const foundHeight =
      anySt.naturalSize?.height ??
      anySt.naturalSize?.naturalHeight ??
      anySt.naturalSize?.h;
    if (foundWidth && foundHeight) {
      setNaturalSize({ width: foundWidth, height: foundHeight });
    }
  };

  // Compute fitted dimensions to preserve aspect ratio and fit inside container
  const renderVideo = () => {
    const cw = containerSize.width || undefined;
    const ch = containerSize.height || undefined;
    const nw = naturalSize.width || 16;
    const nh = naturalSize.height || 9;

    // If we don't know container yet, render a fluid video
    if (!cw || !ch || !naturalSize.width || !naturalSize.height) {
      return (
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isLooping
          onPlaybackStatusUpdate={onStatus}
        />
      );
    }

    const containerRatio = cw / ch;
    const videoRatio = nw / nh;
    let vw = cw;
    let vh = ch;

    if (videoRatio > containerRatio) {
      vw = cw;
      vh = Math.round(cw / videoRatio);
    } else {
      vh = ch;
      vw = Math.round(ch * videoRatio);
    }

    return (
      <View style={{ width: vw, height: vh, backgroundColor: "#000" }}>
        <Video
          ref={videoRef}
          source={videoSource}
          style={{ width: "100%", height: "100%" }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isLooping
          onPlaybackStatusUpdate={onStatus}
        />
      </View>
    );
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
      }}
    >
      {renderVideo()}
      <TouchableOpacity style={styles.button} onPress={handlePlayPause}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  button: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    padding: 10,
  },
});

export default VideoPlayer;
