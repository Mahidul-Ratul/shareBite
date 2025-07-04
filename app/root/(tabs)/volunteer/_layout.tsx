import React from 'react';
import { Slot } from 'expo-router';
import VolunteerBottomNavigation from './VolunteerBottomNavigation';

export default function VolunteerLayout() {
  return (
    <>
      <Slot />
      <VolunteerBottomNavigation />
    </>
  );
} 