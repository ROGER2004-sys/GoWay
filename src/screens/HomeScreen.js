import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur GoWay !</Text>
      
      {userData && (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Email : {userData.email}</Text>
          <Text style={styles.infoText}>Rôle : <Text style={styles.roleText}>{userData.role}</Text></Text>
          <Text style={styles.infoText}>Statut : Utilisateur Normal</Text>
        </View>
      )}

      <View style={styles.actionContainer}>
        <Text style={styles.subtitle}>
          Espace {userData?.role === 'conducteur' ? 'Conducteur' : 'Passager'}
        </Text>
        <Text style={styles.description}>
          {userData?.role === 'conducteur' 
            ? "Publiez vos trajets et trouvez des passagers." 
            : "Recherchez des trajets et réservez votre place."}
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  roleText: {
    fontWeight: 'bold',
    color: '#007AFF',
    textTransform: 'capitalize',
  },
  actionContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
