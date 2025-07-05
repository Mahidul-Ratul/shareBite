import React from 'react';
import { Slot, usePathname } from 'expo-router';
import DonorBottomNavigation from './DonorBottomNavigation';

export default function DonorLayout() {
  const pathname = usePathname();
  
  // Hide bottom navigation on signup page
  const shouldShowNavigation = !pathname.includes('/signup');

  return (
    <>
      <Slot />
      {shouldShowNavigation && <DonorBottomNavigation />}
    </>
  );
} 