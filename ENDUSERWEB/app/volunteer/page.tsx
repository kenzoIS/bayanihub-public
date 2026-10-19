'use client';

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function VolunteerPage() {
  const router = useRouter();
  const { token, user, logout, isReady } = useAuth();

  // --- NEW: Track if they came from the Pledge page ---
  const [cameFromPledge, setCameFromPledge] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('fromPledge') === 'true') {
      setCameFromPledge(true);
    }
  }, []);

  // --- STEP STATE ---
  const [step, setStep] = useState(1);

  // --- FORM STATES (Step 2) ---
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState('Select Site Location');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('Select Time Slot');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const [checkboxes, setCheckboxes] = useState({
    background: false,
    documents: false,
    age: false,
  });

  // --- NEW: Dynamic Sites & File Upload ---
  const [volunteerCampaigns, setVolunteerCampaigns] = useState<any[]>([]);
  const fileInputRef = useRef<any>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/v1/forms/campaigns/volunteer');
        const data = await res.json();
        setVolunteerCampaigns(data.data || []);
      } catch (err) {
        console.error('Error fetching site locations:', err);
      }
    };
    fetchCampaigns();
  }, []);

  // --- AUTO-CHECK LOGIC FOR FIELD ROLE ---
  useEffect(() => {
    if (selectedRole === 'field') {
      setCheckboxes(prev => ({ ...prev, documents: true }));
    }
  }, [selectedRole]);

  // --- FORM STATES (Step 3: Questionnaire) ---
  const [qDisaster, setQDisaster] = useState<boolean | null>(null);
  const [qRugged, setQRugged] = useState<boolean | null>(null);
  const [qMedical, setQMedical] = useState<boolean | null>(null);
  const [qVaccines, setQVaccines] = useState<boolean | null>(null);
  const [qLift, setQLift] = useState<boolean | null>(null);
  const [qTransport, setQTransport] = useState<boolean | null>(null);
  const [transportMode, setTransportMode] = useState('');
  
  const [conductChecks, setConductChecks] = useState({
    conduct: false,
    confidential: false,
    safety: false,
  });

  const [showErrors, setShowErrors] = useState(false);

  const timeSlots = [
    "Morning (8:00 AM - 12:00 PM)", "Afternoon (1:00 PM - 5:00 PM)", "Evening (5:00 PM - 8:00 PM)"
  ];

  // --- VALIDATION LOGIC ---
  const isSiteValid = selectedSite !== 'Select Site Location';
  const isTimeValid = selectedTime !== 'Select Time Slot';
  const isRoleValid = selectedRole !== null;
  const isCheckboxesValid = checkboxes.background && (checkboxes.documents || resumeFile) && checkboxes.age;
  
  const handleNextToStep3 = () => {
    if (isSiteValid && isTimeValid && isRoleValid && isCheckboxesValid) {
      setShowErrors(false);
      setStep(3);
    } else {
      setShowErrors(true);
    }
  };

  const isStep3Valid = 
    qDisaster !== null && qRugged !== null && qMedical !== null && 
    qVaccines !== null && qLift !== null && qTransport !== null && 
    transportMode.trim() !== '' && 
    conductChecks.conduct && conductChecks.confidential && conductChecks.safety;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFinal = async () => {
    if (!token) {
      alert('You must be logged in to submit an application.');
      return;
    }

    if (isStep3Valid) {
      try {
        setIsSubmitting(true);
        const fd = new FormData();
        fd.append('center_id', selectedCampaignId || '');
        fd.append('center_name', selectedSite);
        fd.append('time_slot', selectedTime);
        fd.append('role', selectedRole || '');
        
        // Exact mobile fields
        fd.append('disaster_experience', String(qDisaster));
        fd.append('rugged_environment', String(qRugged));
        fd.append('medical_conditions', String(qMedical));
        fd.append('vaccinations_current', String(qVaccines));
        fd.append('can_lift_25lbs', String(qLift));
        fd.append('has_transportation', String(qTransport));
        fd.append('transportation_mode', transportMode);
        fd.append('background_check_agreed', String(conductChecks.conduct)); // Map to backend expected
        fd.append('documents_agreed', String(conductChecks.confidential));
        fd.append('age_verified', String(checkboxes.age));

        if (resumeFile) {
          fd.append('resume', resumeFile);
        }

        const response = await fetch('http://localhost:3001/api/v1/forms/volunteer', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}` 
          },
          body: fd,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to submit application');
        }

        setShowErrors(false);
        setStep(4);
      } catch (error: any) {
        alert(`Failed to submit application: ${error.message}`);
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setShowErrors(true);
    }
  };

  const toggleCheckbox = (key: keyof typeof checkboxes) => {
    setCheckboxes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleConductCheck = (key: keyof typeof conductChecks) => {
    setConductChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- UI COMPONENTS ---
  const TrackerCard = ({ currentStep }: { currentStep: number }) => (
    <View style={styles.trackerContainer}>
      <Text style={styles.trackerHeader}>Registration Status Tracker</Text>
      <View style={styles.trackerBarRow}>
        <View style={[styles.trackerBar, currentStep >= 1 ? styles.trackerBarActive : {}]} />
        <View style={[styles.trackerBar, currentStep >= 2 ? styles.trackerBarActive : {}]} />
        <View style={[styles.trackerBar, currentStep >= 3 ? styles.trackerBarActive : {}]} />
        <View style={[styles.trackerBar, currentStep >= 4 ? styles.trackerBarActive : {}]} />
      </View>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '12px' }}>
        <div style={{ flex: 1 }}>
          <Text style={[styles.trackerLabelText, currentStep === 1 && styles.trackerLabelActive]}>[1] View Detailed Role Requirements:</Text>
          <Text style={styles.trackerLabelSubText}>({currentStep > 1 ? 'Completed' : 'Current Step'})</Text>
        </div>
        <div style={{ flex: 1 }}>
          <Text style={[styles.trackerLabelText, currentStep === 2 && styles.trackerLabelActive]}>[2] Role Selection & Document Upload:</Text>
          <Text style={styles.trackerLabelSubText}>({currentStep > 2 ? 'Completed' : currentStep === 2 ? 'Current Step' : 'Upcoming'})</Text>
        </div>
        <div style={{ flex: 1 }}>
          <Text style={[styles.trackerLabelText, currentStep === 3 && styles.trackerLabelActive]}>[3] General Screening Questionnaire:</Text>
          <Text style={styles.trackerLabelSubText}>({currentStep > 3 ? 'Completed' : currentStep === 3 ? 'Current Step' : 'Upcoming'})</Text>
        </div>
        <div style={{ flex: 1 }}>
          <Text style={[styles.trackerLabelText, currentStep === 4 && styles.trackerLabelActive]}>[4] Admin Review & Badge Issuance:</Text>
          <Text style={styles.trackerLabelSubText}>({currentStep === 4 ? 'Current Step' : 'Upcoming'})</Text>
        </div>
      </div>
    </View>
  );

  const YesNoPills = ({ state, setState, hasError }: { state: boolean | null, setState: (val: boolean) => void, hasError?: boolean }) => (
    <View style={styles.pillGroup}>
      <Pressable 
        style={[styles.pillBtn, state === true && styles.pillBtnActive, hasError && state === null && styles.errorBorder]} 
        onPress={() => setState(true)}
      >
        <Text style={[styles.pillText, state === true && styles.pillTextActive]}>YES</Text>
      </Pressable>
      <Pressable 
        style={[styles.pillBtn, state === false && styles.pillBtnActive, hasError && state === null && styles.errorBorder]} 
        onPress={() => setState(false)}
      >
        <Text style={[styles.pillText, state === false && styles.pillTextActive]}>NO</Text>
      </Pressable>
    </View>
  );

  if (!isReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* NAVIGATION BAR */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          <Pressable onPress={() => router.push('/dashboard')} style={styles.logoContainer}>
            <Image source={{ uri: '/logo_b.png' }} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.brandName}>BayaniHub</Text>
          </Pressable>
          <View style={styles.navLinks}>
            <Pressable onPress={() => router.push('/dashboard')}><Text style={styles.navLink}>Home</Text></Pressable>
            <Pressable onPress={() => router.push('/about')}><Text style={styles.navLink}>About Us</Text></Pressable>
            <Pressable onPress={() => router.push('/applications')}><Text style={styles.navLink}>Applications</Text></Pressable>
            <Pressable onPress={() => router.push('/mission')}><Text style={styles.navLink}>Mission</Text></Pressable>
          </View>
        </View>
        <View style={styles.navRight}>
          <Pressable style={styles.iconButton}><Image source={{ uri: '/icon-bell.png' }} style={styles.navIcon} resizeMode="contain" /></Pressable>
          <View style={{ position: 'relative' }}>
            <Pressable 
              style={styles.userProfile} 
              onPress={() => setShowUserMenu(!showUserMenu)}
            >
              <Image source={{ uri: '/icon-user.png' }} style={styles.navIcon} resizeMode="contain" />
              <View>
                <Text style={styles.userName}>{user?.profile?.first_name} {user?.profile?.last_name}</Text>
              </View>
            </Pressable>

            {showUserMenu && (
              <View style={styles.userMenu}>
                <Pressable
                  onPress={() => {
                    setShowUserMenu(false);
                    logout();
                    router.replace('/login');
                  }}
                  style={({ hovered }: any) => [
                    { padding: 10 },
                    hovered && { backgroundColor: '#F3F4F6' }
                  ]}
                >
                  <Text style={{ color: '#EF4444', fontWeight: '500' }}>Logout</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* PAGE BODY */}
      <ScrollView 
        style={styles.pageBody} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWhiteCard}>
          
          {/* ========================================================= */}
          {/* GLOBAL PROGRESS TRACKER AT THE TOP                        */}
          {/* ========================================================= */}
          <View style={{ marginBottom: 30 }}>
            <TrackerCard currentStep={step} />
          </View>

          {/* ========================================================= */}
          {/* STEP 1: DETAILED ROLE REQUIREMENTS                        */}
          {/* ========================================================= */}
          {step === 1 && (
            <View style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.pageTitle}>Detailed Role Requirements</Text>
                
                <Text style={styles.sectionHeaderTitle}>1. Common Requirements for All Roles</Text>
                <Text style={styles.bodyText}>General Screening and on-site briefing are mandatory before your first shift. Final documentation will be verified on-site.</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bodyText}>• Complete online General Screening</Text>
                  <Text style={styles.bodyText}>• Mandatory on-site volunteer briefing</Text>
                </View>

                <Text style={[styles.sectionHeaderTitle, { marginTop: 30 }]}>2. Specific Role Requirements</Text>
                
                {/* ROLES SIDE-BY-SIDE TO SAVE VERTICAL SPACE */}
                <View style={styles.roleListGroup}>
                  <View style={styles.roleItemColumn}>
                    <View style={styles.roleIconWrapper}>
                      <Image source={{ uri: '/medic_logo.png' }} style={styles.roleIconImg} resizeMode="contain" />
                      <Text style={styles.roleTitle}>Medic</Text>
                    </View>
                    <Text style={[styles.bodyText, { textAlign: 'center' }]}>Provide primary medical care, triage, and support to disaster-affected individuals. Valid Medical or Nursing License (mandatory). Bring personal stethoscope/BP cuff if available.</Text>
                  </View>
                  
                  <View style={styles.roleItemColumn}>
                    <View style={styles.roleIconWrapper}>
                      <Image source={{ uri: '/logistics_logo.png' }} style={styles.roleIconImg} resizeMode="contain" />
                      <Text style={styles.roleTitle}>Logistics</Text>
                    </View>
                    <Text style={[styles.bodyText, { textAlign: 'center' }]}>Manage and track supply distribution, move resources, support transport. Valid Professional Driver's License (mandatory for vehicle operators). Physically capable of lifting 25+ lbs.</Text>
                  </View>
                  
                  <View style={styles.roleItemColumn}>
                    <View style={styles.roleIconWrapper}>
                      <Image source={{ uri: '/field_logo.png' }} style={styles.roleIconImg} resizeMode="contain" />
                      <Text style={styles.roleTitle}>Field</Text>
                    </View>
                    <Text style={[styles.bodyText, { textAlign: 'center' }]}>Manage crowd flow, assist with group needs, coordinate community outreach, perform data entry. Strong communication and interpersonal skills. Ability to handle large groups.</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.bottomAnchorBox, { alignItems: 'flex-end', marginTop: 40 }]}>
                <Pressable style={(state: any) => [styles.blueButton, state.hovered && styles.btnHover]} onPress={() => setStep(2)}>
                  <Text style={styles.blueButtonText}>Done Reading</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 2: REGISTRATION FORM                                 */}
          {/* ========================================================= */}
          {step === 2 && (
            <View style={styles.twoColumnGrid}>
              
              {/* Left Column: Form Inputs */}
              <View style={[styles.leftColumnOutline, { zIndex: 50, flex: 1.5 }]}>
                <View>
                  <Text style={[styles.pageTitle, { marginBottom: 25 }]}>Role Selection & Document Upload</Text>

                  {/* SIDE-BY-SIDE DROPDOWNS TO SAVE SPACE */}
                  <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30, zIndex: 100 }}>
                    <View style={{ flex: 1, position: 'relative', zIndex: 100 }}>
                      <Text style={styles.inputLabel}>Select Site Location</Text>
                      <Pressable style={[styles.dropdownBox, showErrors && !isSiteValid && styles.errorBorder]} onPress={() => { setIsSiteDropdownOpen(!isSiteDropdownOpen); setIsTimeDropdownOpen(false); }}>
                        <Text style={[styles.dropdownBoxText, !isSiteValid && {color: '#9CA3AF'}]}>{selectedSite !== 'Select Site Location' ? selectedSite : '"Select Site Location"'}</Text>
                        <Image source={{ uri: '/chevron-down.png' }} style={styles.dropdownIcon} />
                      </Pressable>
                      {showErrors && !isSiteValid && <Text style={styles.errorText}>• Site Location is required.</Text>}
                      {isSiteDropdownOpen && (
                        <View style={styles.dropdownMenuList}>
                          <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
                            {volunteerCampaigns.map((camp, index) => (
                              <Pressable key={index} style={styles.dropdownMenuItem} onPress={() => { setSelectedSite(camp.name); setSelectedCampaignId(camp.id); setIsSiteDropdownOpen(false); }}>
                                <Text style={styles.dropdownMenuItemText}>{camp.name}</Text>
                              </Pressable>
                            ))}
                            {volunteerCampaigns.length === 0 && (
                              <View style={styles.dropdownMenuItem}><Text style={styles.dropdownMenuItemText}>No sites available</Text></View>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1, position: 'relative', zIndex: 90 }}>
                      <Text style={styles.inputLabel}>Select Time Slot</Text>
                      <Pressable style={[styles.dropdownBox, showErrors && !isTimeValid && styles.errorBorder]} onPress={() => { setIsTimeDropdownOpen(!isTimeDropdownOpen); setIsSiteDropdownOpen(false); }}>
                        <Text style={[styles.dropdownBoxText, !isTimeValid && {color: '#9CA3AF'}]}>{selectedTime !== 'Select Time Slot' ? selectedTime : '"Select Time Slot"'}</Text>
                        <Image source={{ uri: '/chevron-down.png' }} style={styles.dropdownIcon} />
                      </Pressable>
                      {showErrors && !isTimeValid && <Text style={styles.errorText}>• Time Slot is required.</Text>}
                      {isTimeDropdownOpen && (
                        <View style={styles.dropdownMenuList}>
                          <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={true}>
                            {timeSlots.map((time, index) => (
                              <Pressable key={index} style={styles.dropdownMenuItem} onPress={() => { setSelectedTime(time); setIsTimeDropdownOpen(false); }}>
                                <Text style={styles.dropdownMenuItemText}>{time}</Text>
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Select Your Role</Text>
                  <View style={styles.roleSelectionGroup}>
                    <Pressable style={[styles.roleSelectBox, selectedRole === 'medic' && styles.roleSelectBoxActive, showErrors && !isRoleValid && styles.errorBorder]} onPress={() => setSelectedRole('medic')}>
                      <Image source={{ uri: '/medic_logo.png' }} style={styles.roleSelectImg} resizeMode="contain" />
                      <Text style={[styles.roleSelectBoxText, selectedRole === 'medic' && styles.roleSelectBoxTextActive]}>Medic</Text>
                    </Pressable>
                    <Pressable style={[styles.roleSelectBox, selectedRole === 'logistics' && styles.roleSelectBoxActive, showErrors && !isRoleValid && styles.errorBorder]} onPress={() => setSelectedRole('logistics')}>
                      <Image source={{ uri: '/logistics_logo.png' }} style={styles.roleSelectImg} resizeMode="contain" />
                      <Text style={[styles.roleSelectBoxText, selectedRole === 'logistics' && styles.roleSelectBoxTextActive]}>Logistics</Text>
                    </Pressable>
                    <Pressable style={[styles.roleSelectBox, selectedRole === 'field' && styles.roleSelectBoxActive, showErrors && !isRoleValid && styles.errorBorder]} onPress={() => setSelectedRole('field')}>
                      <Image source={{ uri: '/field_logo.png' }} style={styles.roleSelectImg} resizeMode="contain" />
                      <Text style={[styles.roleSelectBoxText, selectedRole === 'field' && styles.roleSelectBoxTextActive]}>Field</Text>
                    </Pressable>
                  </View>
                  {showErrors && !isRoleValid && <Text style={[styles.errorText, {marginTop: -10, marginBottom: 20}]}>• Role selection is required.</Text>}

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Required Document:</Text>
                  <View style={styles.documentUploadGroup}>
                    {selectedRole === null && <Text style={{color: '#9CA3AF', fontSize: 14}}>Select a role to view documents.</Text>}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                    {selectedRole === 'medic' && (
                      <View style={styles.uploadContainer}>
                        <View style={styles.uploadInfoRow}>
                          <Image source={{ uri: '/file.svg' }} style={styles.fileIcon} />
                          <Text style={styles.uploadInfoText}>{resumeFile ? resumeFile.name : 'Upload Medical License (e.g., MD, RN)'}</Text>
                        </View>
                        <Pressable style={styles.smallBlueBtn} onPress={() => fileInputRef.current?.click()}><Text style={styles.smallBlueBtnText}>Upload</Text></Pressable>
                      </View>
                    )}
                    {selectedRole === 'logistics' && (
                      <View style={styles.uploadContainer}>
                        <View style={styles.uploadInfoRow}>
                          <Image source={{ uri: '/file.svg' }} style={styles.fileIcon} />
                          <Text style={styles.uploadInfoText}>{resumeFile ? resumeFile.name : "Upload Valid Driver's License"}</Text>
                        </View>
                        <Pressable style={styles.smallBlueBtn} onPress={() => fileInputRef.current?.click()}><Text style={styles.smallBlueBtnText}>Upload</Text></Pressable>
                      </View>
                    )}
                    {selectedRole === 'field' && (
                      <View style={[styles.uploadContainer, { borderColor: '#10B981', backgroundColor: '#F0FDF4' }]}>
                        <Text style={{color: '#10B981', fontWeight: 'bold', fontSize: 14, flex: 1}}>No documents required for Field role.</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Checkboxes anchored slightly lower */}
                <View style={[styles.bottomAnchorBox, { marginTop: 20 }]}>
                  <Text style={[styles.sectionHeaderTitle, { marginBottom: 15 }]}>Checkbox for Vetting</Text>
                  <View style={styles.checkboxContainer}>
                    <Pressable onPress={() => toggleCheckbox('background')} style={styles.checkboxWrapper}>
                      <View style={[styles.checkboxOutline, checkboxes.background && styles.checkboxOutlineActive, showErrors && !checkboxes.background && styles.errorBorder]}>
                        {checkboxes.background && <Text style={styles.checkmarkIcon}>✓</Text>}
                      </View>
                      <Text style={[styles.checkboxText, showErrors && !checkboxes.background && {color: '#EF4444'}]}>I agree to a background check (required for Selected roles).</Text>
                    </Pressable>

                    <Pressable onPress={() => toggleCheckbox('documents')} style={styles.checkboxWrapper}>
                      <View style={[styles.checkboxOutline, checkboxes.documents && styles.checkboxOutlineActive, showErrors && !checkboxes.documents && styles.errorBorder]}>
                        {checkboxes.documents && <Text style={styles.checkmarkIcon}>✓</Text>}
                      </View>
                      <Text style={[styles.checkboxText, showErrors && !checkboxes.documents && {color: '#EF4444'}]}>
                        {selectedRole === 'field' ? 'I acknowledge requirements.' : (resumeFile ? 'Document attached.' : 'I have uploaded all required documents.')}
                      </Text>
                    </Pressable>

                    <Pressable onPress={() => toggleCheckbox('age')} style={styles.checkboxWrapper}>
                      <View style={[styles.checkboxOutline, checkboxes.age && styles.checkboxOutlineActive, showErrors && !checkboxes.age && styles.errorBorder]}>
                        {checkboxes.age && <Text style={styles.checkmarkIcon}>✓</Text>}
                      </View>
                      <Text style={[styles.checkboxText, showErrors && !checkboxes.age && {color: '#EF4444'}]}>I confirm I am over 18 years old.</Text>
                    </Pressable>
                  </View>
                  
                  {showErrors && (!isSiteValid || !isTimeValid || !isRoleValid || !isCheckboxesValid) && (
                    <Text style={[styles.errorText, {marginTop: 20}]}>• Please check all required fields.</Text>
                  )}
                </View>
              </View>

              {/* Right Column: Capacity Checker & Next Button */}
              <View style={[styles.rightColumnOutline, { flex: 1, justifyContent: 'space-between' }]}>
                <View>
                  <View style={[styles.trackerContainer, { marginTop: 30 }]}>
                    <Text style={styles.trackerHeader}>Capacity Checker</Text>
                    <View style={styles.capacityInfoRow}>
                      <Text style={styles.capacityLabelText}>Real-Time Capacity:</Text>
                      <View style={styles.siteIndicator}><Text style={styles.siteIndicatorText}>{selectedSite !== 'Select Site Location' ? selectedSite : 'No site'}</Text></View>
                      {selectedSite !== 'Select Site Location' && (
                        <>
                          <Text style={{marginHorizontal: 8, color: '#9CA3AF'}}>-</Text>
                          <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>Moderate</Text></View>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.bottomAnchorBox}>
                  <Pressable style={(state: any) => [styles.blueButtonFull, state.hovered && styles.btnHover]} onPress={handleNextToStep3}>
                    <Text style={styles.blueButtonText}>Next Step: General Screening</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 3: SELF-ASSESSMENT QUESTIONNAIRE                     */}
          {/* ========================================================= */}
          {step === 3 && (
            <View style={styles.twoColumnGrid}>
              
              {/* Left Column */}
              <View style={[styles.leftColumnOutline, { flex: 1.2 }]}>
                <View>
                  <Text style={[styles.pageTitle, { marginBottom: 25 }]}>Self-Assessment Questionnaire</Text>

                  <Text style={styles.sectionHeaderTitle}>Basic Background</Text>
                  <View style={[styles.questionRow, { paddingRight: 30 }]}>
                    <Text style={styles.questionText}>Have you previously volunteered in disaster response?</Text>
                    <YesNoPills state={qDisaster} setState={setQDisaster} hasError={showErrors} />
                  </View>
                  <View style={[styles.questionRow, { paddingRight: 30 }]}>
                    <Text style={styles.questionText}>Are you comfortable working in rugged or stressful environments?</Text>
                    <YesNoPills state={qRugged} setState={setQRugged} hasError={showErrors} />
                  </View>

                  <View style={styles.healthGreenBox}>
                    <Text style={styles.sectionHeaderTitle}>Health & Safety Self-Assessment</Text>
                    <Text style={styles.italicSubText}>This section helps us match you to appropriate roles. All responses are confidential.</Text>
                    
                    <View style={styles.questionRow}>
                      <Text style={styles.questionText}>Do you have any <Text style={{fontWeight:'700'}}>medical conditions requiring immediate attention or physical restrictions?</Text></Text>
                      <YesNoPills state={qMedical} setState={setQMedical} hasError={showErrors} />
                    </View>
                    <View style={styles.questionRow}>
                      <Text style={styles.questionText}>Are you up-to-date on essential <Text style={{fontWeight:'700'}}>vaccinations</Text> (e.g., Flu)?</Text>
                      <YesNoPills state={qVaccines} setState={setQVaccines} hasError={showErrors} />
                    </View>
                    <View style={styles.questionRow}>
                      <Text style={styles.questionText}>Are you physically able to lift and carry items up to 25 lbs (11 kg)?</Text>
                      <YesNoPills state={qLift} setState={setQLift} hasError={showErrors} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Right Column */}
              <View style={[styles.rightColumnOutline, { flex: 1 }]}>
                <View>
                  <Text style={[styles.sectionHeaderTitle]}>Availability & Logistics</Text>
                  <View style={[styles.questionRow, { paddingRight: 30 }]}>
                    <Text style={styles.questionText}>Do you have <Text style={{fontWeight:'700'}}>personal transportation</Text> to a disaster site?</Text>
                    <YesNoPills state={qTransport} setState={setQTransport} hasError={showErrors} />
                  </View>
                  <Text style={[styles.questionText, {marginBottom: 10}]}>What is your typical mode of transportation?</Text>
                  <TextInput 
                    style={[styles.textInputBox, showErrors && transportMode.trim() === '' && styles.errorBorder]}
                    placeholder='"Type of Transportation"'
                    placeholderTextColor="#9CA3AF"
                    value={transportMode}
                    onChangeText={setTransportMode}
                  />

                  <View style={{ marginTop: 30 }}>
                    <Text style={styles.sectionHeaderTitle}>Volunteer Conduct & Confidentiality</Text>
                    
                    <View style={styles.conductCardsGroup}>
                      <Pressable onPress={() => toggleConductCheck('conduct')} style={styles.conductCardStyle}>
                        <View style={[styles.checkboxOutline, conductChecks.conduct && styles.checkboxOutlineActive, showErrors && !conductChecks.conduct && styles.errorBorder, {marginTop: 2}]}>
                          {conductChecks.conduct && <Text style={styles.checkmarkIcon}>✓</Text>}
                        </View>
                        <Text style={[styles.conductCardText, showErrors && !conductChecks.conduct && {color: '#EF4444'}]}>Do you agree to abide by the BayaniHub Volunteer Code of Conduct and treat aid recipients with dignity? (Mandatory)</Text>
                      </Pressable>

                      <Pressable onPress={() => toggleConductCheck('confidential')} style={styles.conductCardStyle}>
                        <View style={[styles.checkboxOutline, conductChecks.confidential && styles.checkboxOutlineActive, showErrors && !conductChecks.confidential && styles.errorBorder, {marginTop: 2}]}>
                          {conductChecks.confidential && <Text style={styles.checkmarkIcon}>✓</Text>}
                        </View>
                        <Text style={[styles.conductCardText, showErrors && !conductChecks.confidential && {color: '#EF4444'}]}>Do you agree to maintain the strict confidentiality of all private information you access? (Mandatory)</Text>
                      </Pressable>

                      <Pressable onPress={() => toggleConductCheck('safety')} style={styles.conductCardStyle}>
                        <View style={[styles.checkboxOutline, conductChecks.safety && styles.checkboxOutlineActive, showErrors && !conductChecks.safety && styles.errorBorder, {marginTop: 2}]}>
                          {conductChecks.safety && <Text style={styles.checkmarkIcon}>✓</Text>}
                        </View>
                        <Text style={[styles.conductCardText, showErrors && !conductChecks.safety && {color: '#EF4444'}]}>Do you understand and agree to follow all safety protocols and guidelines provided for each site? (Mandatory)</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Action Buttons Anchored to Bottom */}
                <View style={styles.bottomAnchorBox}>
                  <Text style={styles.bottomWarningText}>Your contribution is valuable. Please complete all fields.</Text>
                  <View style={styles.bottomActionRow}>
                    <Pressable style={(state: any) => [styles.grayButton, state.hovered && {backgroundColor: '#E5E7EB'}]} onPress={() => setStep(2)}>
                      <Text style={styles.grayButtonText}>Back</Text>
                    </Pressable>
                    <Pressable style={(state: any) => [styles.blueButtonFlex, state.hovered && styles.btnHover]} onPress={handleSubmitFinal}>
                      <Text style={styles.blueButtonText}>Submit Assessment</Text>
                    </Pressable>
                  </View>
                  {showErrors && !isStep3Valid && <Text style={[styles.errorText, {marginTop: 15, textAlign: 'right'}]}>• Please complete all required fields.</Text>}
                </View>
              </View>

            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 4: SUCCESS CONFIRMATION                              */}
          {/* ========================================================= */}
          {step === 4 && (
            <View style={styles.singleColumnContainer}>
              <View style={styles.successBox}>
                <View style={styles.successHeader}>
                  <Text style={styles.successHeaderText}>Application Successfully Received!</Text>
                </View>
                
                <View style={styles.successBody}>
                  <View style={styles.successCheckCircle}><Text style={styles.successCheckMark}>✓</Text></View>
                  
                  <Text style={styles.successTitle}>Thank You, Hero!</Text>
                  <Text style={styles.successDesc}>
                    Your Volunteer Application has been successfully routed to our Admin Team for final processing and document verification.
                  </Text>

                  <Text style={styles.successDetail}><Text style={{fontWeight: 'bold'}}>Next Steps: </Text> Document Verification. Please allow 24-48 hours.</Text>
                  <Text style={styles.successDetail}>Your status is currently: <Text style={{fontWeight: 'bold'}}>[Document Processing]</Text></Text>
                  <Text style={styles.successDetail}><Text style={{fontWeight: 'bold'}}>Summary:</Text> {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : ''} Role ({selectedTime})</Text>

                  {/* DONOR PROMPT: Conditional logic based on where they came from */}
                  {!cameFromPledge ? (
                    <View style={styles.donorPromptBox}>
                      <Text style={styles.donorPromptTitle}>Do you want to be a Donor?</Text>
                      <View style={styles.donorPromptBtns}>
                        <Pressable style={styles.yesDonorBtn} onPress={() => {
                          if (typeof window !== 'undefined') sessionStorage.setItem('fromVolunteer', 'true');
                          router.push('/pledge');
                        }}><Text style={styles.yesDonorBtnText}>Yes, I want to be a donor</Text></Pressable>
                        <Pressable style={styles.noDonorBtn} onPress={() => router.push('/')}><Text style={styles.noDonorBtnText}>No, Return to Homepage</Text></Pressable>
                      </View>
                    </View>
                  ) : (
                    // If they came from Pledge, skip the prompt and just show a return button
                    <View style={[styles.donorPromptBox, { borderTopWidth: 0, paddingTop: 10 }]}>
                      <Pressable 
                        style={(state: any) => [styles.blueButtonFull, styles.animated, state.hovered && styles.btnHover, { maxWidth: 300 }]} 
                        onPress={() => {
                          if (typeof window !== 'undefined') sessionStorage.removeItem('fromPledge');
                          router.push('/');
                        }}
                      >
                        <Text style={styles.blueButtonText}>Return to Homepage</Text>
                      </Pressable>
                    </View>
                  )}

                </View>
              </View>

            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', height: '100vh', overflow: 'hidden' } as any,
  
  // NAVBAR
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, height: 90, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', zIndex: 10 } as any,
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 40 } as any,
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoImage: { width: 45, height: 45 },
  brandName: { fontSize: 24, fontWeight: '400', color: '#111827', letterSpacing: -0.5 },
  navLinks: { flexDirection: 'row', gap: 40 } as any,
  navLink: { fontSize: 16, color: '#4B5563', fontWeight: '600' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 25 } as any,
  iconButton: { padding: 8 },
  navIcon: { width: 28, height: 28, opacity: 0.7 },
  userProfile: { flexDirection: 'row', alignItems: 'center', gap: 12 } as any,
  userName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  userRole: { fontSize: 12, color: '#6B7280' },

  // BODY & SCROLL
  pageBody: { flex: 1, backgroundColor: '#F9FAFB' } as any,
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },

  // WIDER WHITE CONTAINER
  mainWhiteCard: { 
    flex: 1,
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    paddingHorizontal: 50,
    paddingVertical: 35, // Reduced slightly to save vertical height
    width: '95%', 
    maxWidth: 1400, // Widened from 1300 to give everything more room
    minHeight: 750,
    boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column'
  } as any,

  twoColumnGrid: { flexDirection: 'row', gap: 40, flex: 1, width: '100%' } as any,
  leftColumnOutline: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  rightColumnOutline: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  singleColumnContainer: { display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 900, alignSelf: 'center', gap: 24 } as any,
  
  bottomAnchorBox: { marginTop: 30 },

  errorBorder: { borderColor: '#EF4444', borderWidth: 1 },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 6, fontWeight: '600' },

  pageTitle: { fontSize: 26, fontWeight: '500', color: '#111827', marginBottom: 20 },
  sectionHeaderTitle: { fontSize: 17, fontWeight: '500', color: '#111827', marginBottom: 15 },
  bodyText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  
  // TRACKER CARD
  trackerContainer: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 20, backgroundColor: '#FFFFFF' },
  trackerHeader: { fontSize: 18, fontWeight: '500', color: '#111827', marginBottom: 15 },
  trackerBarRow: { flexDirection: 'row', gap: 10, marginBottom: 15 } as any,
  trackerBar: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 4 },
  trackerBarActive: { backgroundColor: '#4273B8' },
  trackerLabelsRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' } as any,
  trackerLabelBox: { flex: 1 },
  trackerLabelText: { fontSize: 11, color: '#9CA3AF', lineHeight: 16 },
  trackerLabelActive: { color: '#111827', fontWeight: '700' },
  trackerLabelSubText: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  pillGroup: { flexDirection: 'row', gap: 12 } as any,
  pillBtn: { width: 75, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB', borderRadius: 25, borderWidth: 1, borderColor: 'transparent' },
  pillBtnActive: { backgroundColor: '#4273B8' }, 
  pillText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
  pillTextActive: { color: '#FFFFFF' }, 

  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 } as any,
  questionText: { fontSize: 15, color: '#111827', flex: 1, paddingRight: 25, lineHeight: 22 },
  
  healthGreenBox: { backgroundColor: '#EAF5EA', padding: 30, borderRadius: 12, marginTop: 10 },
  italicSubText: { fontSize: 14, color: '#4B5563', marginBottom: 20, fontStyle: 'italic' },
  
  textInputBox: { backgroundColor: '#F3F4F6', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', fontSize: 15, color: '#111827', width: '100%', maxWidth: 400 },

  conductCardsGroup: { flexDirection: 'column', gap: 12 },
  conductCardStyle: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 18 } as any,
  conductCardText: { fontSize: 13, color: '#374151', flex: 1, lineHeight: 20 },

  checkboxOutline: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#4B5563', marginRight: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: '#FFF' },
  checkboxOutlineActive: { backgroundColor: '#111827', borderColor: '#111827' },
  checkmarkIcon: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

  bottomWarningText: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  bottomActionRow: { flexDirection: 'row', gap: 15, width: '100%' } as any,
  grayButton: { flex: 1, backgroundColor: '#E5E7EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  grayButtonText: { color: '#111827', fontSize: 15, fontWeight: '700' },
  blueButtonFlex: { flex: 2, backgroundColor: '#4273B8', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  blueButtonFull: { backgroundColor: '#4273B8', paddingVertical: 14, borderRadius: 8, alignItems: 'center', width: '100%' },
  blueButton: { backgroundColor: '#4273B8', paddingVertical: 14, borderRadius: 8, alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 40 },
  blueButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  animated: { transition: 'all 0.2s ease-in-out' } as any,
  btnHover: { opacity: 0.9, transform: [{scale: 0.99}] } as any,
  
  bulletList: { paddingLeft: 15, marginTop: 15 },
  
  roleListGroup: { marginTop: 20, flexDirection: 'row', gap: 20, justifyContent: 'space-between' } as any,
  roleItemColumn: { flex: 1, flexDirection: 'column', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 25, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' } as any,
  roleIconWrapper: { alignItems: 'center', marginBottom: 15 },
  roleIconImg: { width: 50, height: 50, marginBottom: 10 },
  roleTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 10, color: '#111827' },
  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' } as any,
  dropdownBoxText: { fontSize: 14, color: '#111827' },
  dropdownIcon: { width: 14, height: 14, opacity: 0.6 },
  dropdownMenuList: { position: 'absolute', top: 68, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', overflow: 'hidden', zIndex: 1000, boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' } as any,
  dropdownMenuItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownMenuItemText: { fontSize: 14, color: '#374151' },

  roleSelectionGroup: { flexDirection: 'row', gap: 15, marginBottom: 20 } as any,
  roleSelectBox: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 15, alignItems: 'center' },
  roleSelectBoxActive: { borderColor: '#4273B8', borderWidth: 2, backgroundColor: '#F0F5FF' },
  roleSelectImg: { width: 35, height: 35, marginBottom: 8 },
  roleSelectBoxText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
  roleSelectBoxTextActive: { color: '#4273B8' },

  documentUploadGroup: { flexDirection: 'column', gap: 10 } as any,
  uploadContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB' } as any,
  uploadInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1 } as any,
  fileIcon: { width: 16, height: 16, marginRight: 10, opacity: 0.6 },
  uploadInfoText: { fontSize: 13, color: '#4B5563' },
  smallBlueBtn: { backgroundColor: '#4273B8', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
  smallBlueBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  checkboxContainer: { flexDirection: 'column', gap: 15 } as any,
  checkboxWrapper: { flexDirection: 'row', alignItems: 'center' } as any,
  checkboxText: { fontSize: 14, color: '#374151', flex: 1 },

  capacityInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 } as any,
  capacityLabelText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  siteIndicator: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginLeft: 12 },
  siteIndicatorText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  badgeGreen: { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeGreenText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  successBox: { alignSelf: 'center', width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', marginTop: 10, borderWidth: 1, borderColor: '#E5E7EB' } as any,
  successHeader: { backgroundColor: '#4273B8', paddingVertical: 20, alignItems: 'center' },
  successHeaderText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  successBody: { padding: 40, alignItems: 'center', flexDirection: 'column' } as any,
  successCheckCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0FDF4', borderWidth: 3, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 20 } as any,
  successCheckMark: { color: '#10B981', fontSize: 35, fontWeight: 'bold', marginTop: -2 },
  successTitle: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  successDesc: { fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 24, maxWidth: 650, marginBottom: 30 },
  successDetail: { fontSize: 15, color: '#374151', textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  
  donorPromptBox: { marginTop: 40, width: '100%', alignItems: 'center', borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 30 },
  donorPromptTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 20 },
  donorPromptBtns: { flexDirection: 'row', gap: 15 } as any,
  yesDonorBtn: { backgroundColor: '#10B981', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8, alignItems: 'center' },
  yesDonorBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  noDonorBtn: { backgroundColor: '#F3F4F6', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
  noDonorBtnText: { color: '#374151', fontSize: 15, fontWeight: 'bold' },
  userMenu: { 
    position: 'absolute', 
    top: 50, 
    right: 0, 
    backgroundColor: 'white', 
    borderRadius: 8, 
    padding: 5, 
    zIndex: 1000, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    elevation: 10, 
    width: 150 
  } as any,
});
