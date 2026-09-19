import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../src/session';
export default function Index() { const { ready, signedIn } = useSession(); if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>; return <Redirect href={signedIn ? '/(app)/(tabs)/home' : '/(auth)/login'} />; }
