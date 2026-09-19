import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Platform, Text } from 'react-native';
import { mobileLogin } from '../../src/api'; import { useSession } from '../../src/session'; import { Button, ErrorText, Field, Screen, Title } from '../../src/ui';
export default function Login() { const { completeAuth } = useSession(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit() { setLoading(true); setError(''); try { const auth = await mobileLogin({ email, password, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID', deviceName: Platform.OS }); await completeAuth(auth); router.replace('/(app)/(tabs)/home'); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in.'); } finally { setLoading(false); } }
  return <Screen><Title>Health Companion</Title><Text>Your care, in one place.</Text><Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry /><ErrorText message={error} /><Button title={loading ? 'Signing in…' : 'Sign in'} disabled={loading} onPress={submit} /><Link href="/(auth)/register">Create a patient account</Link></Screen>; }
