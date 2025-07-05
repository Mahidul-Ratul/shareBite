import { Slot, usePathname } from 'expo-router';
import ReceiverBottomNavigation from './BottomNavigation';

export default function ReceiverLayout() {
  const pathname = usePathname();
  
  // Hide bottom navigation on signup page
  const shouldShowNavigation = !pathname.includes('/signup');

  return (
    <>
      <Slot />
      {shouldShowNavigation && <ReceiverBottomNavigation />}
    </>
  );
} 