import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Moment } from "../types";

interface MomentCardProps {
  moment: Moment;
}

const MomentCard: React.FC<MomentCardProps> = ({ moment }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: moment.thumbnail }} style={styles.thumbnail} />
      <Text style={styles.title}>{moment.type}</Text>
      <Text style={styles.description}>{moment.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: "hidden",
    margin: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  thumbnail: {
    width: "100%",
    height: 150,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 10,
  },
  description: {
    fontSize: 14,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});

export default MomentCard;
