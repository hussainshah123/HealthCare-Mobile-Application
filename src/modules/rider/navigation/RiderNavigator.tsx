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
import { ActiveDeliveryProvider } from '../hooks/ActiveDeliveryContext';
import type { RiderStackParamList, RiderTabParamList } from './types';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AvailableDeliveriesScreen } from '../screens/AvailableDeliveriesScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ActiveDeliveryScreen } from '../screens/ActiveDeliveryScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator<RiderTabParamList>();
const Stack = createNativeStackNavigator<RiderStackParamList>();

function RiderTabs() {
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
      <Tab.Screen
        name="Available"
        component={AvailableDeliveriesScreen}
        options={{ title: 'Available orders' }}
      />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RiderNavigator() {
  return (
    <ActiveDeliveryProvider>
      <Stack.Navigator
        screenLayout={stackBackdropLayout}
        screenOptions={{
          ...headerOptions,
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen
          name="Tabs"
          component={RiderTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ActiveDelivery"
          component={ActiveDeliveryScreen}
          options={{ title: 'Active delivery' }}
        />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </ActiveDeliveryProvider>
  );
}
