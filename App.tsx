import './src/i18n';
import React from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './src/types';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import BusinessListScreen from './src/screens/BusinessListScreen';
import BusinessDetailScreen from './src/screens/BusinessDetailScreen';
import ProfileScreen from "./src/screens/ProfileScreen";
import ComplaintScreen from "./src/screens/ComplaintScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { AuthProvider, useAuth } from './src/context/AuthContext';


const Stack = createStackNavigator<RootStackParamList>();

// Main App Navigation Component
const AppNavigation: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#ffad00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Home" : "Login"}
        screenOptions={{
          title: 'ARABUL',
          headerStyle: { backgroundColor: '#ffad00' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {isAuthenticated ? (
          // Authenticated screens
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="BusinessList" component={BusinessListScreen} />
            <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Complaint" component={ComplaintScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
          </>
        ) : (
          // Unauthenticated screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      
      {/* Status bar background for Android edge-to-edge */}
      {Platform.OS === 'android' && (
        <View 
          style={{
            height: Constants.statusBarHeight,
            backgroundColor: '#ffad00',
          }} 
        />
      )}

      <AppNavigation />
    </AuthProvider>
  );
}
