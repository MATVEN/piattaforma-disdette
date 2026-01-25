/**
 * Navbar Component (C17 - Modern Glassmorphism Design)
 * Features: glassmorphism effect, smooth animations, dropdown menu, mobile responsive
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  User, 
  FileText, 
  Home, 
  Menu, 
  X,
  Plus
} from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect scroll for glass effect enhancement
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-indigo-900 shadow-xl"
      >
        {/* Accent bar gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
        
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo */}
            <Link
            href="/"
            className="group flex items-center"
            >
              <div className="relative">
                <img
                    src="/images/disdeasy-logo.png"
                    alt="DisdEasy Logo"
                    className="h-10 w-auto transition-transform group-hover:scale-105"
                  />
                  {/* Glow effect opzionale */}
                <div className="absolute inset-0 blur-md opacity-0 group-hover:opacity-30 transition-opacity bg-white/20 rounded-lg" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            {user ? (
              <div className="hidden md:flex items-center space-x-6">
                <NavLink href="/dashboard" icon={<Home className="h-4 w-4" />}>
                  Dashboard
                </NavLink>
                {/* CTA Button - Nuova Disdetta */}
                <Link
                  href="/new-disdetta"
                  className="flex items-center space-x-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glass transition-all hover:shadow-glass-hover hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuova Disdetta</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2 text-white border border-white/20 transition-all hover:bg-white/20 hover:border-white/30"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Profilo</span>
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white/90 backdrop-blur-xl shadow-card-hover ring-1 ring-black/5"
                      >
                        <div className="p-2">
                          <DropdownItem
                            href="/profileUser"
                            icon={<User className="h-4 w-4" />}
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            Il mio profilo
                          </DropdownItem>
                          <DropdownItem
                            onClick={handleLogout}
                            icon={<LogOut className="h-4 w-4" />}
                            className="text-danger-600 hover:bg-danger-50"
                          >
                            Logout
                          </DropdownItem>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:text-white hover:bg-white/10"
                >
                  Accedi
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-white shadow-glass transition-all hover:shadow-glass-hover hover:scale-105"
                >
                  Registrati
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-white/90 hover:bg-white/10 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 bottom-0 z-40 w-64 bg-indigo-900 shadow-2xl md:hidden border-l border-white/10"
            >
              <div className="flex flex-col p-4 space-y-2">
                {user ? (
                  <>
                    <MobileNavLink href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Home className="h-5 w-5" />
                      Dashboard
                    </MobileNavLink>
                    <Link
                      href="/new-disdetta"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 rounded-lg px-4 py-3 mx-2 bg-gradient-primary text-white font-semibold transition-all hover:scale-105"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Nuova Disdetta</span>
                    </Link>
                    <MobileNavLink href="/profileUser" onClick={() => setIsMobileMenuOpen(false)}>
                      <User className="h-5 w-5" />
                      Profilo
                    </MobileNavLink>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 rounded-lg px-4 py-3 text-danger-200 hover:bg-danger-900/20 transition-colors w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <MobileNavLink href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      Accedi
                    </MobileNavLink>
                    <MobileNavLink href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      Registrati
                    </MobileNavLink>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  );
}

// === Helper Components ===

function NavLink({ 
  href, 
  children, 
  icon 
}: { 
  href: string; 
  children: React.ReactNode; 
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-all hover:text-white hover:bg-white/10"
    >
      {icon && <span className="transition-transform group-hover:scale-110">{icon}</span>}
      <span>{children}</span>
    </Link>
  );
}

function DropdownItem({
  href,
  onClick,
  icon,
  children,
  className = '',
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const baseClass = `flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${className}`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={`${baseClass} text-gray-700 hover:bg-gray-100`}>
        {icon}
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClass} w-full text-left`}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center space-x-3 rounded-lg px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white transition-colors font-medium"
    >
      {children}
    </Link>
  );
}