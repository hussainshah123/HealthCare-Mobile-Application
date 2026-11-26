import React from 'react';
import { headerOptions, tabBarOptions } from '../../../app/navStyles';
import { renderBubbleTabBar } from '../../../components/BubbleTabBar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { tabIconFor } from '../../../components/TabIcon';
import {
  backdropLayout,
  stackBackdropLayout,
} from '../../../components/MedicalBackdrop';
import type { CustomerStackParamList, CustomerTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { HomeHeaderActions } from '../components/HomeHeaderActions';
import { DoctorsScreen } from '../screens/DoctorsScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MedicineListScreen } from '../screens/MedicineListScreen';
import { MedicineDetailScreen } from '../screens/MedicineDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { UploadPrescriptionScreen } from '../screens/UploadPrescriptionScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { LiveTrackingScreen } from '../screens/LiveTrackingScreen';
import { DoctorDetailScreen } from '../screens/DoctorDetailScreen';
import { BookAppointmentScreen } from '../screens/BookAppointmentScreen';
import { ConsultationScreen } from '../screens/ConsultationScreen';
import { CallScreen } from '../screens/CallScreen';
import { MyPrescriptionsScreen } from '../screens/MyPrescriptionsScreen';
import { AddressesScreen } from '../screens/AddressesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<CustomerStackParamList>();

function CustomerTabs() {
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
        name="Home"
        component={HomeScreen}
        options={{ title: 'Pharmacy', headerRight: HomeHeaderActions }}
      />
      <Tab.Screen name="Doctors" component={DoctorsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function CustomerNavigator() {
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
        component={CustomerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MedicineList"
        component={MedicineListScreen}
        options={({ route }) => ({ title: route.params.title ?? 'Medicines' })}
      />
      <Stack.Screen
        name="MedicineDetail"
        component={MedicineDetailScreen}
        options={{ title: 'Medicine' }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'My cart' }}
      />
      <Stack.Screen
        name="UploadPrescription"
        component={UploadPrescriptionScreen}
        options={{ title: 'Upload prescription' }}
      />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order' }}
      />
      <Stack.Screen
        name="LiveTracking"
        component={LiveTrackingScreen}
        options={{ title: 'Track delivery' }}
      />
      <Stack.Screen
        name="DoctorDetail"
        component={DoctorDetailScreen}
        options={{ title: 'Doctor' }}
      />
      <Stack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={{ title: 'Book appointment' }}
      />
      <Stack.Screen
        name="Consultation"
        component={ConsultationScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen
        name="Call"
        component={CallScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="MyPrescriptions"
        component={MyPrescriptionsScreen}
        options={{ title: 'My prescriptions' }}
      />
      <Stack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ title: 'My addresses' }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
