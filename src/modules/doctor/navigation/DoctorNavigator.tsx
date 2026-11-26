import React from 'react';
import { headerOptions, tabBarOptions } from '../../../app/navStyles';
import { renderBubbleTabBar } from '../../../components/BubbleTabBar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  NotificationsHeaderButton,
  backdropLayout,
  stackBackdropLayout,
  tabIconFor,
} from '../../../components';
import type { DoctorStackParamList, DoctorTabParamList } from './types';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { AvailabilityScreen } from '../screens/AvailabilityScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ConsultationScreen } from '../screens/ConsultationScreen';
import { CallScreen } from '../screens/CallScreen';
import { WritePrescriptionScreen } from '../screens/WritePrescriptionScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator<DoctorTabParamList>();
const Stack = createNativeStackNavigator<DoctorStackParamList>();

function DoctorTabs() {
  return (
    <Tab.Navigator
      tabBar={renderBubbleTabBar}
      screenLayout={backdropLayout}
      screenOptions={({ route }) => ({
        ...tabBarOptions,
        tabBarIcon: tabIconFor(route.name),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerRight: NotificationsHeaderButton }}
      />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Availability" component={AvailabilityScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function DoctorNavigator() {
  return (
    <Stack.Navigator
      screenLayout={stackBackdropLayout}
      screenOptions={{
        ...headerOptions,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={DoctorTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Consultation"
        component={ConsultationScreen}
        options={({ route }) => ({ title: route.params.patientName })}
      />
      <Stack.Screen
        name="Call"
        component={CallScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="WritePrescription"
        component={WritePrescriptionScreen}
        options={{ title: 'Write prescription' }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
