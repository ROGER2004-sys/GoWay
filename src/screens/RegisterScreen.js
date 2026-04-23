import React, { useState, useEffect, useRef } from 'react';
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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getCountFromServer } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const COLORS = {
  dark: '#1A1A2E',
  navy: '#16213E',
  deepBlue: '#0F3460',
  accent: '#00A8FF',
  accentGreen: '#00C882',
  accentOrange: '#FF6B35',
  white: '#FFFFFF',
  bg: '#F7F8FA',
  border: '#E8ECF0',
  placeholder: '#BCC3CE',
  muted: '#9AA0AC',
  text: '#1A1A2E',
};

// Password strength logic
function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0–4
}

const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'];
const STRENGTH_COLORS = ['', '#E24B4A', '#F5A623', '#00C882', '#00A8FF'];

const STEPS = ['Infos', 'Compte', 'Vérif.'];

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(0); // 0, 1, 2
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('passager'); // 'passager' or 'conducteur'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
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
        console.warn("Stats fetch failed:", error);
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

  const strength = getPasswordStrength(password);

  const handleNext = () => {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!email.trim() || !password || !confirmPassword) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }
      if (strength < 2) {
        Alert.alert('Erreur', 'Votre mot de passe est trop faible');
        return;
      }
      setStep(2);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      console.log("Attempting to create user with email:", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created in Auth:", user.uid);

      // Update Auth profile
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Save user data to Firestore
      console.log("Saving user data to Firestore for role:", role);
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role: role,
        isAdmin: false,
        createdAt: serverTimestamp(),
      });
      console.log("Firestore document created successfully");

      Alert.alert('Succès', 'Votre compte a été créé avec succès !');
      // AppNavigator will handle redirect automatically via onAuthStateChanged
    } catch (error) {
      console.error("Registration error:", error);
      let message = 'Une erreur est survenue';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Cet email est déjà utilisé';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Adresse email invalide';
      } else if (error.code === 'auth/weak-password') {
        message = 'Mot de passe trop faible (min. 6 caractères)';
      } else if (error.message) {
        message = `Erreur: ${error.message}`;
      }
      Alert.alert('Erreur', message);
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
            <TouchableOpacity
              onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}
              style={styles.backBtn}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>⬡</Text>
            </View>
            <Text style={styles.logoName}>
              Go<Text style={styles.logoAccent}>Way</Text>
            </Text>
          </View>

          {/* Heading */}
          <Text style={styles.heroTitle}>Créer un compte 🚀</Text>
          <Text style={styles.heroSub}>Rejoignez des milliers d'utilisateurs</Text>

          {/* Stats badges */}
          <View style={styles.badgeRow}>
            {statsData.map((s) => (
              <View key={s.label} style={styles.badge}>
                <Text style={styles.badgeVal}>{s.value}</Text>
                <Text style={styles.badgeLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      i <= step && styles.stepCircleActive,
                      i < step && styles.stepCircleDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNum,
                        i <= step && styles.stepNumActive,
                      ]}
                    >
                      {i < step ? '✓' : i + 1}
                    </Text>
                  </View>
                  <Text
                    style={[styles.stepLabel, i <= step && styles.stepLabelActive]}
                  >
                    {s}
                  </Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View
                    style={[styles.stepLine, i < step && styles.stepLineActive]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Form Body ── */}
        <View style={styles.formBody}>
          {/* Tag */}
          <View style={styles.tag}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>
              {step === 0
                ? 'Étape 1 sur 3 — Informations personnelles'
                : step === 1
                  ? 'Étape 2 sur 3 — Créer votre compte'
                  : 'Étape 3 sur 3 — Vérification'}
            </Text>
          </View>

          {/* ─── STEP 0 — Personal Info ─── */}
          {step === 0 && (
            <>
              <View style={styles.nameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>PRÉNOM</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Prénom"
                      placeholderTextColor={COLORS.placeholder}
                      value={firstName}
                      onChangeText={setFirstName}
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>NOM</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nom"
                      placeholderTextColor={COLORS.placeholder}
                      value={lastName}
                      onChangeText={setLastName}
                      returnKeyType="next"
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.label}>TÉLÉPHONE</Text>
              <View style={styles.inputWrap}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>🇲🇦 +212</Text>
                </View>
                <View style={styles.phoneDivider} />
                <TextInput
                  style={[styles.input, { paddingLeft: 10 }]}
                  placeholder="6XX XX XX XX"
                  placeholderTextColor={COLORS.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
              </View>
              <Text style={styles.label}>VOUS ÊTES ?</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'passager' && styles.roleBtnActive]}
                  onPress={() => setRole('passager')}
                >
                  <Text style={[styles.roleEmoji, role === 'passager' && styles.roleTextActive]}>🚶</Text>
                  <Text style={[styles.roleLabel, role === 'passager' && styles.roleTextActive]}>Passager</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'conducteur' && styles.roleBtnActive]}
                  onPress={() => setRole('conducteur')}
                >
                  <Text style={[styles.roleEmoji, role === 'conducteur' && styles.roleTextActive]}>🚗</Text>
                  <Text style={[styles.roleLabel, role === 'conducteur' && styles.roleTextActive]}>Conducteur</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ─── STEP 1 — Account ─── */}
          {step === 1 && (
            <>
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

              <Text style={styles.label}>MOT DE PASSE</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Créer un mot de passe"
                  placeholderTextColor={COLORS.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>

              {/* Password strength */}
              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          i <= strength && {
                            backgroundColor: STRENGTH_COLORS[strength],
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: STRENGTH_COLORS[strength] },
                    ]}
                  >
                    {STRENGTH_LABELS[strength]}
                  </Text>
                </View>
              )}

              <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>
              <View
                style={[
                  styles.inputWrap,
                  confirmPassword.length > 0 &&
                  password !== confirmPassword && { borderColor: '#E24B4A' },
                  confirmPassword.length > 0 &&
                  password === confirmPassword && {
                    borderColor: COLORS.accentGreen,
                  },
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Répéter le mot de passe"
                  placeholderTextColor={COLORS.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorText}>
                  Les mots de passe ne correspondent pas
                </Text>
              )}
            </>
          )}

          {/* ─── STEP 2 — Confirm ─── */}
          {step === 2 && (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmEmoji}>🎉</Text>
              <Text style={styles.confirmTitle}>Presque prêt !</Text>
              <Text style={styles.confirmSub}>
                Vérifiez vos informations avant de valider
              </Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Nom complet</Text>
                  <Text style={styles.summaryVal}>
                    {firstName} {lastName}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Téléphone</Text>
                  <Text style={styles.summaryVal}>+212 {phone}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Rôle</Text>
                  <Text style={styles.summaryVal}>
                    {role === 'conducteur' ? 'Conducteur 🚗' : 'Passager 🚶'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── CTA Button ── */}
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={step < 2 ? handleNext : handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>
                  {step < 2 ? 'Continuer' : "Créer mon compte"}
                </Text>
                <View style={styles.btnArrow}>
                  <Text style={styles.btnArrowText}>→</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Terms */}
          {step === 1 && (
            <Text style={styles.terms}>
              En continuant, vous acceptez nos{' '}
              <Text style={styles.termsLink}>Conditions d'utilisation</Text> et notre{' '}
              <Text style={styles.termsLink}>Politique de confidentialité</Text>
            </Text>
          )}

          {/* Login link */}
          <TouchableOpacity
            style={styles.bottomLinkBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.bottomLink}>
              Déjà un compte ?{' '}
              <Text style={styles.bottomLinkAccent}>Se connecter</Text>
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
    paddingBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
  },
  backBtn: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  backIcon: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '700',
  },
  logoIcon: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: { fontSize: 18, color: COLORS.white },
  logoName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  logoAccent: { color: COLORS.accent },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 5,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
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

  /* Step indicator */
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  stepCircleDone: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  stepNumActive: { color: COLORS.white },
  stepLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.3,
  },
  stepLabelActive: { color: 'rgba(255,255,255,0.9)' },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 14,
    marginHorizontal: 6,
  },
  stepLineActive: { backgroundColor: COLORS.accentGreen },

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
    marginBottom: 22,
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
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
    overflow: 'hidden',
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.55,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  eyeBtn: { padding: 10 },
  eyeIcon: { fontSize: 13 },

  phonePrefix: {
    paddingVertical: 13,
    paddingRight: 8,
  },
  phonePrefixText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneDivider: {
    width: 1,
    height: 22,
    backgroundColor: COLORS.border,
    marginRight: 4,
  },

  /* Role selection */
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  roleBtnActive: {
    backgroundColor: 'rgba(0, 168, 255, 0.1)',
    borderColor: COLORS.accent,
  },
  roleEmoji: {
    fontSize: 16,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  roleTextActive: {
    color: COLORS.accent,
  },

  /* Strength */
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -10,
    marginBottom: 16,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 52,
    textAlign: 'right',
  },

  errorText: {
    fontSize: 11,
    color: '#E24B4A',
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 4,
  },

  /* Confirm step */
  confirmBox: {
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  confirmSub: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  summaryKey: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },

  /* Buttons */
  btnPrimary: {
    backgroundColor: COLORS.dark,
    borderRadius: 13,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.65 },
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
  terms: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 14,
  },
  termsLink: {
    color: COLORS.accent,
    fontWeight: '600',
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
