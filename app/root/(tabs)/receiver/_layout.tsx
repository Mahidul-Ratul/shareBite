import { Slot } from 'expo-router';
import ReceiverBottomNavigation from './BottomNavigation';

export default function ReceiverLayout() {
  return (
    <>
      <Slot />
      <ReceiverBottomNavigation />
    </>
  );
} 