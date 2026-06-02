"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Video, 
  History, 
  Settings as SettingsIcon, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Sparkles, 
  FileText,
  HelpCircle,
  PlusCircle
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();

  // Inicializar o tema com base no LocalStorage ou preferência do sistema
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const menuItems = [
    { name: "Novo Trabalho", href: "/jobs/new", icon: PlusCircle },
    { name: "Histórico", href: "/history", icon: History },
    { name: "Configurações", href: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-500 rounded-lg text-white">
            <Video size={20} className="animate-pulse-slow" />
          </div>
          <span className="font-sans font-bold text-lg tracking-tight bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Atigra Trans
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
            aria-label="Alternar Modo Escuro"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
            aria-label="Abrir Menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 glass dark:bg-neutral-950/80 border-r border-neutral-200 dark:border-neutral-800/50 flex flex-col z-50 transition-all duration-300 transform 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20"}`}
      >
        {/* Brand Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800/50">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-gradient-to-tr from-primary-500 to-secondary-400 rounded-xl text-white shadow-md shadow-primary-500/20 shrink-0">
              <Video size={22} />
            </div>
            {sidebarOpen && (
              <span className="font-sans font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary-500 to-secondary-400 bg-clip-text text-transparent transition-all duration-300">
                Atigra Trans
              </span>
            )}
          </Link>
          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className="hidden md:flex items-center justify-center p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              title="Recolher menu"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 group relative
                  ${isActive 
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/15" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"}`}
              >
                <item.icon size={20} className={`${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
                {sidebarOpen ? (
                  <span className="font-sans text-sm">{item.name}</span>
                ) : (
                  <span className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-md">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar Control */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800/50 space-y-3">
          {/* Theme Toggle Desktop */}
          <button
            onClick={toggleDarkMode}
            className="w-full hidden md:flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all font-medium"
          >
            {darkMode ? (
              <>
                <Sun size={20} className="text-amber-500 animate-spin-slow" />
                {sidebarOpen && <span className="text-sm">Modo Claro</span>}
              </>
            ) : (
              <>
                <Moon size={20} className="text-primary-400" />
                {sidebarOpen && <span className="text-sm">Modo Escuro</span>}
              </>
            )}
          </button>

          {/* Toggle Expand Sidebar */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full hidden md:flex items-center justify-center p-3 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all"
              title="Expandir menu"
            >
              <Menu size={20} />
            </button>
          )}

          {sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 bg-neutral-100 dark:bg-neutral-900/60 rounded-xl">
              <div className="p-2 bg-secondary-500/10 text-secondary-500 rounded-lg shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-sans text-xs font-bold text-neutral-700 dark:text-neutral-300 truncate">Atigra Pro</p>
                <p className="font-sans text-[10px] text-neutral-400 truncate">Plano Gratuito</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen relative">
        <div className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
