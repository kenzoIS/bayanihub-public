import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PageTransition } from '@/components/ui/PageTransition';
import {
  Bell, User, LayoutDashboard,
  Play, Activity, Clock, LogOut
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/activate-mission', label: 'Activate Mission', icon: Play },
  { href: '/volunteer-summary', label: 'Volunteer Summary', icon: Activity },
  { href: '/shifts', label: 'Review Shift Hours', icon: Clock },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMiddleText = () => {
    const navItem = NAV_ITEMS.find((n) => n.href === pathname);
    return navItem?.label ?? 'Site Manager Dashboard';
  };

  const handleLogout = async () => {
    // Clear cookies/session (Assuming simple implementation)
    document.cookie = "supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/login');
  };

  const middleText = getMiddleText();

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--color-gray-50)'
    }}>
      {/* Header - Full Width with Logo and Navigation */}
      <header style={{ 
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)',
        padding: '12px 40px',
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left - Logo that navigates to home */}
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: '8px',
              borderRadius: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-gray-50)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                position: 'relative',
                flexShrink: 0
              }}>
                <Image
                  src="/images/bayanihub_logo.png"
                  alt="Bayanihub Logo"
                  fill
                  style={{
                    objectFit: 'contain'
                  }}
                  priority
                />
              </div>
              <span style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#5C6ED5',
                letterSpacing: '-0.02em'
              }}>
                BayaniHub
              </span>
            </div>
          </Link>

          {/* Center - Dynamic Page Title */}
          {middleText && (
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '18px',
              fontWeight: 500,
              color: '#374151',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap'
            }}>
              {middleText}
            </div>
          )}

          {/* Right - Notification and Profile Icons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Notification Dropdown */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Bell size={20} />
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#EF4444',
                  borderRadius: '50%',
                  border: '2px solid white',
                  animation: 'pulse 2s infinite',
                }}></span>
              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '320px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                  zIndex: 100
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#111827' }}>
                    Notifications
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
                         onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                         onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>New Mission Created</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>Evacuation drive has been activated.</div>
                    </div>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
                         onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                         onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Shift Pending Approval</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>Marco logged out from Medic Team.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <User size={20} />
              </button>

              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '200px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                  zIndex: 100
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>Site Manager</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>admin@bayanihub.org</div>
                  </div>
                  <div style={{ padding: '8px' }}>
                    <button 
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        fontWeight: 500,
                        fontSize: '14px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)',
        padding: '0 40px',
        width: '100%',
        position: 'sticky',
        top: '61px',
        zIndex: 40,
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
        }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-gray-500)',
                  borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  borderRadius: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--color-gray-50)';
                    e.currentTarget.style.color = 'var(--color-primary-dark)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-gray-500)';
                  }
                }}>
                  <Icon size={14} />
                  {label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Main Content */}
      <main style={{ 
        padding: '32px 40px',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          width: '100%'
        }}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
};