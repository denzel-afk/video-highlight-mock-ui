import React from "react";
import { View, Text, StyleSheet } from "react-native";
import VideoPlayer from "../components/VideoPlayer";
import { Moment } from "../types";

interface VideoDetailScreenProps {
  route: {
    params: {
      moment: Moment;
    };
  };
}

const VideoDetailScreen: React.FC<VideoDetailScreenProps> = ({ route }) => {
  const { moment } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{moment.type}</Text>
      <VideoPlayer videoSource={{ uri: moment.videoUrl }} />
      <Text style={styles.description}>{moment.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginTop: 12,
  },
});

export default VideoDetailScreen;
