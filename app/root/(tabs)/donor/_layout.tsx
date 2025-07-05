import React from 'react';
import { Slot } from 'expo-router';
import DonorBottomNavigation from './DonorBottomNavigation';

export default function DonorLayout() {
  return (
    <>
      <Slot />
      <DonorBottomNavigation />
    </>
  );
} 