'use client';

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* NAVIGATION BAR */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          <Pressable 
            onPress={() => router.push('/')} 
            style={({ hovered }: any) => [styles.logoContainer, styles.animated, hovered && { transform: [{ scale: 1.02 }] }]}
          >
            <Image source={{ uri: '/logo_b.png' }} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.brandName}>BayaniHub</Text>
          </Pressable>
          <View style={styles.navLinks}>
            <Pressable onPress={() => router.push('/')}>
              {({ hovered }: any) => <Text style={[styles.navLink, styles.animated, hovered && { color: '#4273B8' }]}>Home</Text>}
            </Pressable>
            <Pressable onPress={() => router.push('/about')}>
              {({ hovered }: any) => <Text style={[styles.navLink, styles.animated, styles.activeLink, hovered && { color: '#4273B8' }]}>About Us</Text>}
            </Pressable>
            <Pressable onPress={() => router.push('/applications')}>
              {({ hovered }: any) => <Text style={[styles.navLink, styles.animated, hovered && { color: '#4273B8' }]}>Applications</Text>}
            </Pressable>
            <Pressable onPress={() => router.push('/mission')}>
              {({ hovered }: any) => <Text style={[styles.navLink, styles.animated, hovered && { color: '#4273B8' }]}>Mission</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.navRight}>
          <Pressable style={({ hovered }: any) => [styles.iconButton, styles.animated, hovered && { transform: [{ scale: 1.1 }] }]}>
            <Image source={{ uri: '/icon-bell.png' }} style={styles.navIcon} resizeMode="contain" />
          </Pressable>
          <View style={styles.userProfile}>
            <Image source={{ uri: '/icon-user.png' }} style={styles.navIcon} resizeMode="contain" />
            <View>
              <Text style={styles.userName}>User</Text>
              <Text style={styles.userRole}>Role</Text>
            </View>
          </View>
        </View>
      </View>

      {/* PAGE BODY */}
      <View style={styles.pageBody}>
        <ScrollView 
          style={{ flex: 1, width: '100%' }} 
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 60, paddingTop: 40, paddingHorizontal: 20 }} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* MAIN CONTENT AREA */}
          <View style={styles.contentWrapper}>
            
            <View style={styles.headerSection}>
              <Text style={styles.mainTitle}>About BayaniHub</Text>
              <Text style={styles.mainSubtitle}>Empowering individuals to be heroes in their communities.</Text>
            </View>

            <View style={styles.gridRow}>
              <View style={[styles.infoCard, { borderTopColor: '#4273B8' }]}>
                <Text style={styles.cardHeader}>Who We Are</Text>
                <Text style={styles.cardText}>
                  We are a dedicated community response network designed to bridge the gap between urgent needs and available resources. From the site to sites across the region, we ensure that help is directed exactly where it is needed most.
                </Text>
              </View>

              <View style={[styles.infoCard, { borderTopColor: '#4273B8' }]}>
                <Text style={styles.cardHeader}>Our Vision</Text>
                <Text style={styles.cardText}>
                  We believe every individual has the power to be a hero. Our platform streamlines the process of giving, whether you are donating essential goods or providing professional medical and logistical support.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>How We Work</Text>

            <View style={styles.gridRow}>
              <View style={styles.stepCard}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
                  <Text style={styles.stepTitle}>Professional Vetting</Text>
                </View>
                <Text style={styles.cardText}>
                  To maintain the highest standards of safety and service, all our professional volunteers undergo a thorough vetting process.
                </Text>
                <View style={styles.bulletList}>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}><Text style={styles.boldText}>Medical:</Text> Verification of licenses for all on-site personnel.</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}><Text style={styles.boldText}>Logistics:</Text> Confirmation of driver credentials and insurance.</Text>
                  </View>
                </View>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
                  <Text style={styles.stepTitle}>Resource Management</Text>
                </View>
                <Text style={styles.cardText}>
                  Our system actively tracks and manages needs to prevent bottlenecks and ensure maximum operational efficiency.
                </Text>
                <View style={styles.bulletList}>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>Tracks site capacity in real-time.</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>Identifies High Need areas immediately.</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>Prevents over-saturation at specific sites.</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Pressable 
                style={(state: any) => [styles.returnButton, styles.animated, state.hovered && styles.btnHover, state.pressed && styles.btnPress]} 
                onPress={() => router.push('/')}
              >
                <Text style={styles.returnButtonText}>Return to Dashboard</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', height: '100vh', overflow: 'hidden' } as any,
  
  navBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 40, 
    height: 90, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    zIndex: 10 
  } as any,
  
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 40 } as any,
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 } as any,
  logoImage: { width: 45, height: 45 },
  brandName: { fontSize: 24, fontWeight: '400', color: '#111827', letterSpacing: -0.5 },
  navLinks: { flexDirection: 'row', gap: 40 } as any,
  
  // Base link is weight 600
  navLink: { fontSize: 16, color: '#4B5563', fontWeight: '600' },
  
  // FIXED: Active link only changes color, keeping the 600 weight so it matches!
  activeLink: { color: '#4273B8' }, 
  
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 25 } as any,
  iconButton: { padding: 8 },
  navIcon: { width: 28, height: 28, opacity: 0.7 },
  userProfile: { flexDirection: 'row', alignItems: 'center', gap: 12 } as any,
  userName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  userRole: { fontSize: 12, color: '#6B7280' },
  animated: { transition: 'all 0.2s ease-in-out' } as any,
  btnHover: { transform: [{ scale: 1.03 }], opacity: 0.95 } as any,
  btnPress: { transform: [{ scale: 0.97 }], opacity: 0.8 } as any,
  pageBody: { flex: 1, backgroundColor: '#F9FAFB' } as any,
  contentWrapper: { width: '100%', maxWidth: 1100, display: 'flex', flexDirection: 'column' } as any,
  headerSection: { alignItems: 'center', marginBottom: 40 },
  mainTitle: { fontSize: 32, fontWeight: '500', color: '#111827', letterSpacing: -0.5 },
  mainSubtitle: { fontSize: 16, color: '#6B7280', marginTop: 10, fontWeight: '500' },
  gridRow: { flexDirection: 'row', gap: 24, marginBottom: 30 } as any,
  infoCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 32, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', borderTopWidth: 4 } as any,
  stepCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 32, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' } as any,
  cardHeader: { fontSize: 20, fontWeight: '500', color: '#111827', marginBottom: 15 },
  cardText: { fontSize: 14, color: '#4B5563', lineHeight: 24 },
  sectionTitle: { fontSize: 22, fontWeight: '500', color: '#111827', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#E5E7EB', width: '100%', marginVertical: 10 },
  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 } as any,
  stepBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  stepBadgeText: { color: '#4273B8', fontWeight: 'bold', fontSize: 16 },
  stepTitle: { fontSize: 18, fontWeight: '500', color: '#111827' },
  bulletList: { marginTop: 20, flexDirection: 'column', gap: 12 } as any,
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start' } as any,
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4273B8', marginTop: 8, marginRight: 12 },
  bulletText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 22 },
  boldText: { fontWeight: 'bold', color: '#111827' },
  cardFooter: { paddingTop: 20, marginTop: 10, alignItems: 'flex-end' },
  returnButton: { backgroundColor: '#4273B8', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8 },
  returnButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});
