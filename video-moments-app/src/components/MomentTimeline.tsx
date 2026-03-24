import React from 'react';
import { View, FlatList } from 'react-native';
import MomentCard from './MomentCard';
import { Moment } from '../types';

interface MomentTimelineProps {
  moments: Moment[];
}

const MomentTimeline: React.FC<MomentTimelineProps> = ({ moments }) => {
  const renderItem = ({ item }: { item: Moment }) => (
    <MomentCard moment={item} />
  );

  return (
    <View>
      <FlatList
        data={moments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

export default MomentTimeline;