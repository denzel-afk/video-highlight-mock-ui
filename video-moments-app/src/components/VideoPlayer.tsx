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

  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={videoSource}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isPlaying}
        isLooping
      />
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
