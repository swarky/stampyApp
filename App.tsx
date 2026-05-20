import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { initDb } from './src/db/database';
import Navigation from './src/navigation';

export default function App() {
  useEffect(() => {
    initDb();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Navigation />
    </>
  );
}
