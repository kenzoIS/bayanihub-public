'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'donations' | 'volunteers'>('donations');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donRes, volRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/donations'),
        fetch('http://localhost:3001/api/v1/volunteers')
      ]);

      if (donRes.ok) {
        const donJson = await donRes.json();
        setDonations(donJson.data || []);
      }
      if (volRes.ok) {
        const volJson = await volRes.json();
        setVolunteers(volJson.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Pressable style={styles.homeBtn} onPress={() => router.push('/')}>
          <Text style={styles.homeBtnText}>Return to Home</Text>
        </Pressable>
      </View>

      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'donations' && styles.activeTabBtn]} 
          onPress={() => setActiveTab('donations')}
        >
          <Text style={[styles.tabText, activeTab === 'donations' && styles.activeTabText]}>Donation Pledges</Text>
        </Pressable>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'volunteers' && styles.activeTabBtn]} 
          onPress={() => setActiveTab('volunteers')}
        >
          <Text style={[styles.tabText, activeTab === 'volunteers' && styles.activeTabText]}>Volunteer Registrations</Text>
        </Pressable>
        <Pressable style={styles.refreshBtn} onPress={fetchData}>
          <Text style={styles.tabText}>↻ Refresh</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#4273B8" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.cardContainer}>
            {activeTab === 'donations' && donations.map((d, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Pledge: {d.tracking_number}</Text>
                  <Text style={styles.badge}>{new Date(d.donated_at).toLocaleString()}</Text>
                </View>
                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Details:</Text> {d.message}</Text>
                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Items pledged:</Text></Text>
                <Text style={styles.listItem}>• {d.quantity} x {d.item_name}</Text>
                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Status:</Text> {d.status}</Text>
              </View>
            ))}

            {activeTab === 'volunteers' && volunteers.map((v, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{v.motivation}</Text>
                  <Text style={styles.badge}>{v.status}</Text>
                </View>
                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Submitted:</Text> {new Date(v.applied_at).toLocaleString()}</Text>
                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Time Slot:</Text> {v.availability}</Text>
                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Transport Mode:</Text> {v.skills?.transportMode || 'None'}</Text>
                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Medical Conditions:</Text> {v.skills?.qMedical ? 'Yes' : 'No'}</Text>
              </View>
            ))}

            {activeTab === 'donations' && donations.length === 0 && (
              <Text style={styles.emptyText}>No donations found.</Text>
            )}

            {activeTab === 'volunteers' && volunteers.length === 0 && (
              <Text style={styles.emptyText}>No volunteers found.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', height: '100vh', overflow: 'hidden' } as any,
  header: { backgroundColor: '#111827', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as any,
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  homeBtn: { backgroundColor: '#374151', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  homeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 20 } as any,
  tabBtn: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 3, borderColor: 'transparent' },
  activeTabBtn: { borderColor: '#4273B8' },
  tabText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  activeTabText: { color: '#4273B8' },
  refreshBtn: { marginLeft: 'auto', paddingVertical: 15, paddingHorizontal: 20 },
  content: { flex: 1 },
  contentContainer: { padding: 30, paddingBottom: 100 },
  cardContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 } as any,
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, width: 350, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderWidth: 1, borderColor: '#E5E7EB' } as any,
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' } as any,
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 10 },
  badge: { backgroundColor: '#D1FAE5', color: '#065F46', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '600' },
  infoText: { fontSize: 14, color: '#374151', marginBottom: 6 },
  listItem: { fontSize: 14, color: '#4B5563', paddingLeft: 10, marginBottom: 4 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', width: '100%', marginTop: 50 }
});
