import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function AdminScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
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

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <Text style={styles.userEmail}>{item.email}</Text>
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: item.role === 'conducteur' ? '#E3F2FD' : '#F3E5F5' }]}>
          <Text style={[styles.tagText, { color: item.role === 'conducteur' ? '#1976D2' : '#7B1FA2' }]}>
            {item.role}
          </Text>
        </View>
        {item.isAdmin && (
          <View style={[styles.tag, { backgroundColor: '#FFF3E0' }]}>
            <Text style={[styles.tagText, { color: '#E65100' }]}>Admin</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Administrateur</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Quitter</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Liste des Utilisateurs ({users.length})</Text>
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  logoutBtnText: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});
