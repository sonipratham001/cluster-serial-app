import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import BottomNavBar from '../components/BottomNavBar';

const videoData = [
  {
    id: '1',
    title: 'How BLDC Motors Work',
    thumbnail: 'https://img.youtube.com/vi/bCEiOnuODac/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=bCEiOnuODac',
  },
  {
    id: '2',
    title: 'Electric Vehicle Motor Explained',
    thumbnail: 'https://img.youtube.com/vi/1GcEHRLg_Pg/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=1GcEHRLg_Pg',
  },
  {
    id: '3',
    title: 'Lithium Battery Safety Tips',
    thumbnail: 'https://img.youtube.com/vi/Lx9tvYz1ngo/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=Lx9tvYz1ngo',
  },
];

const Youtube = () => {
  const openVideo = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <LinearGradient colors={['#0a0f1c', '#1f2937', '#111827']} style={styles.container}>
      <Text style={styles.header}>Tutorials & Demos</Text>

      <FlatList
        data={videoData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openVideo(item.url)}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            <Text style={styles.title}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />

      <BottomNavBar />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    color: '#facc15',
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  title: {
    padding: 12,
    fontSize: 16,
    color: '#f9fafb',
    fontWeight: '600',
  },
});

export default Youtube;