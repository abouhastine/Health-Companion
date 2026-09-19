import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '../src/session';
const queryClient = new QueryClient();
export default function RootLayout() { return <QueryClientProvider client={queryClient}><SessionProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }} /></SessionProvider></QueryClientProvider>; }
