import React from 'react';
import { Slot, usePathname } from 'expo-router';
import VolunteerBottomNavigation from './VolunteerBottomNavigation';

export default function VolunteerLayout() {
  const pathname = usePathname();
  
  // Hide bottom navigation on signup page
  const shouldShowNavigation = !pathname.includes('/signup');

  return (
    <>
      <Slot />
      {shouldShowNavigation && <VolunteerBottomNavigation />}
    </>
  );
} 