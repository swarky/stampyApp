import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { initDb, initFavourites } from './src/db/database';
import Navigation from './src/navigation';

export default function App() {
  useEffect(() => {
    initDb();
    initFavourites();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Navigation />
    </>
  );
}
