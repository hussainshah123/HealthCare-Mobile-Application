import React from 'react';
import { useAuth } from '../store/AuthContext';
import { AuthNavigator } from '../modules/auth/AuthNavigator';
import { SplashScreen } from '../modules/auth/screens/SplashScreen';
import { UnsupportedRoleScreen } from '../modules/auth/screens/UnsupportedRoleScreen';
import { CustomerNavigator } from '../modules/customer/navigation/CustomerNavigator';
import { DoctorNavigator } from '../modules/doctor/navigation/DoctorNavigator';
import { RiderNavigator } from '../modules/rider/navigation/RiderNavigator';

/** Picks the auth stack or the role-specific app from `user.role`. */
export function RootNavigator() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return <SplashScreen />;
  }
  if (status === 'signedOut' || !user) {
    return <AuthNavigator />;
  }
  switch (user.role) {
    case 'CUSTOMER':
      return <CustomerNavigator />;
    case 'DOCTOR':
      return <DoctorNavigator />;
    case 'RIDER':
      return <RiderNavigator />;
    default:
      // PHARMACY / ADMIN use the web dashboard.
      return <UnsupportedRoleScreen />;
  }
}
