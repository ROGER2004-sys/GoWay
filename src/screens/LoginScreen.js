import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Simple SVG-free icon placeholders using Unicode/emoji — swap with react-native-vector-icons if available
const COLORS = {
  dark: '#1A1A2E',
  navy: '#16213E',
  deepBlue: '#0F3460',
  accent: '#00A8FF',
  accentGreen: '#00C882',
  white: '#FFFFFF',
  bg: '#F7F8FA',
  border: '#E8ECF0',
  placeholder: '#BCC3CE',
  muted: '#9AA0AC',
  text: '#1A1A2E',
};

const STATS = [
  { value: '50K+', label: 'Chauffeurs' },
  { value: '4.8★', label: 'Note moyenne' },
  { value: '120+', label: 'Villes' },
];

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [driverCount, setDriverCount] = useState('...');
  const [passengerCount, setPassengerCount] = useState('...');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const driversQuery = query(collection(db, 'users'), where('role', '==', 'conducteur'));
        const driversSnapshot = await getCountFromServer(driversQuery);
        setDriverCount(driversSnapshot.data().count.toString());

        const passengersQuery = query(collection(db, 'users'), where('role', '==', 'passager'));
        const passengersSnapshot = await getCountFromServer(passengersQuery);
        setPassengerCount(passengersSnapshot.data().count.toString());
      } catch (error) {
        console.warn("Could not fetch real-time stats:", error);
        setDriverCount('50K+');
        setPassengerCount('10K+');
      }
    };
    fetchStats();
  }, []);

  const statsData = [
    { value: driverCount, label: 'Chauffeurs' },
    { value: passengerCount, label: 'Passagers' },
    { value: '120+', label: 'Villes' },
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Band ── */}
        <View style={styles.heroBand}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>⬡</Text>
            </View>
            <Text style={styles.logoName}>
              Go<Text style={styles.logoAccent}>Way</Text>
            </Text>
          </View>

          {/* Heading */}
          <Text style={styles.heroTitle}>Bon retour ! 👋</Text>
          <Text style={styles.heroSub}>Connectez-vous pour continuer</Text>

          {/* Stats badges */}
          <View style={styles.badgeRow}>
            {statsData.map((s) => (
              <View key={s.label} style={styles.badge}>
                <Text style={styles.badgeVal}>{s.value}</Text>
                <Text style={styles.badgeLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Form Body ── */}
        <View style={styles.formBody}>
          {/* Security tag */}
          <View style={styles.tag}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>Connexion sécurisée</Text>
          </View>

          {/* Email */}
          <Text style={styles.label}>ADRESSE EMAIL</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor={COLORS.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>MOT DE PASSE</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>Se connecter</Text>
                <View style={styles.btnArrow}>
                  <Text style={styles.btnArrowText}>→</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continuer avec</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google button */}
          <TouchableOpacity style={styles.btnGoogle} activeOpacity={0.85}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.btnGoogleText}>Continuer avec Google</Text>
          </TouchableOpacity>

          {/* Register link */}
          <TouchableOpacity
            style={styles.bottomLinkBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.bottomLink}>
              Pas encore de compte ?{' '}
              <Text style={styles.bottomLinkAccent}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scroll: {
    flexGrow: 1,
  },

  /* ── Hero Band ── */
  heroBand: {
    backgroundColor: COLORS.dark,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
  },
  logoIcon: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    fontSize: 20,
    color: COLORS.white,
  },
  logoName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  logoAccent: {
    color: COLORS.accent,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  badgeVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  badgeLbl: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },

  /* ── Form ── */
  formBody: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 168, 255, 0.1)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 16,
    paddingLeft: 14,
    paddingRight: 4,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 8,
    opacity: 0.55,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 10,
  },
  eyeIcon: {
    fontSize: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  btnPrimary: {
    backgroundColor: COLORS.dark,
    borderRadius: 13,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  btnArrow: {
    width: 22,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArrowText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '500',
  },
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingVertical: 13,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4285F4',
  },
  btnGoogleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bottomLinkBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  bottomLink: {
    fontSize: 13,
    color: COLORS.muted,
  },
  bottomLinkAccent: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});
