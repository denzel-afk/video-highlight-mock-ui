import React, { useState } from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const UploadScreen = ({ navigation }: any) => {
  const [video, setVideo] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const pickVideo = async () => {
    // Placeholder for video picker logic
    // You can use expo-image-picker or similar in a real app
    alert("Video picker not implemented.");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0a0a0c",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <TouchableOpacity
        style={{
          backgroundColor: "#222",
          borderRadius: 16,
          paddingVertical: 32,
          paddingHorizontal: 40,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#444",
        }}
        onPress={pickVideo}
        disabled={uploading}
        activeOpacity={0.8}
      >
        <Ionicons
          name="cloud-upload-outline"
          size={48}
          color="#fff"
          style={{ marginBottom: 16 }}
        />
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 8,
          }}
        >
          {uploading ? "Uploading..." : "Upload Video"}
        </Text>
        <Text style={{ color: "#aaa", fontSize: 14, textAlign: "center" }}>
          Click to select a video file to upload and process highlights.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          marginTop: 32,
          backgroundColor: "#444",
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 24,
        }}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>Go to Highlights UI</Text>
      </TouchableOpacity>
      {video && (
        <View style={{ marginTop: 32 }}>
          {/* Placeholder for video preview */}
          <Text style={{ color: "#fff" }}>
            Video selected: {video.name || "..."}
          </Text>
        </View>
      )}
    </View>
  );
};

export default UploadScreen;
