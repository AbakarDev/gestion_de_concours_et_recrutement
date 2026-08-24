import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import DashboardScreen from '../screens/DashboardScreen';
import ApplicationsScreen from '../screens/ApplicationsScreen';
import ApplicationDetailScreen from '../screens/ApplicationDetailScreen';
import OffersScreen from '../screens/OffersScreen';
import OfferApplyScreen from '../screens/OfferApplyScreen';
import DossierScreen from '../screens/DossierScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();
const AppsStack = createNativeStackNavigator();
const OffersStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeDash" component={DashboardScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

function ApplicationsNavigator() {
  return (
    <AppsStack.Navigator screenOptions={{ headerShown: false }}>
      <AppsStack.Screen name="ApplicationsList" component={ApplicationsScreen} />
      <AppsStack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
    </AppsStack.Navigator>
  );
}

function OffersNavigator() {
  return (
    <OffersStack.Navigator screenOptions={{ headerShown: false }}>
      <OffersStack.Screen name="OffersList" component={OffersScreen} />
      <OffersStack.Screen name="OfferApply" component={OfferApplyScreen} />
    </OffersStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: colors.line,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Candidatures"
        component={ApplicationsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Offres"
        component={OffersNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Dossier"
        component={DossierScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
