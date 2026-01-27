'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRefinery } from '@/store/refineryStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Button from '@/components/ui/Button';

// ═══════════════════════════════════════════════════════════════════════════
// ABUNDANT CUSTOMIZATION OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

const THEMES = {
  forge: {
    name: 'Forge',
    description: 'Dark, powerful, ember accents',
    icon: '🔥',
    preview: { bg: '#0D0D0D', accent: '#FF6B35', text: '#F5F5F0' },
  },
  executive: {
    name: 'Executive',
    description: 'Navy & gold, boardroom ready',
    icon: '💼',
    preview: { bg: '#0f172a', accent: '#D4A84B', text: '#f8fafc' },
  },
  midnight: {
    name: 'Midnight',
    description: 'Deep purple, mysterious elegance',
    icon: '🌙',
    preview: { bg: '#1e1b4b', accent: '#a78bfa', text: '#e2e8f0' },
  },
  steel: {
    name: 'Steel',
    description: 'Industrial, chrome accents',
    icon: '⚙️',
    preview: { bg: '#18181b', accent: '#71717a', text: '#fafafa' },
  },
  nature: {
    name: 'Nature',
    description: 'Forest green, organic feel',
    icon: '🌲',
    preview: { bg: '#14532d', accent: '#22c55e', text: '#f0fdf4' },
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep blue, calm & professional',
    icon: '🌊',
    preview: { bg: '#0c4a6e', accent: '#0ea5e9', text: '#f0f9ff' },
  },
  minimal: {
    name: 'Minimal Light',
    description: 'Clean white, subtle accents',
    icon: '✨',
    preview: { bg: '#ffffff', accent: '#3b82f6', text: '#1f2937' },
  },
  noir: {
    name: 'Noir',
    description: 'Pure black, stark contrast',
    icon: '🖤',
    preview: { bg: '#000000', accent: '#ffffff', text: '#ffffff' },
  },
};

const ACCENT_COLORS = [
  { name: 'Steel Gold', hex: '#D4A84B', group: 'brand' },
  { name: 'Ember Orange', hex: '#FF6B35', group: 'brand' },
  { name: 'Bright Gold', hex: '#E8C060', group: 'brand' },
  { name: 'Ocean Blue', hex: '#0ea5e9', group: 'cool' },
  { name: 'Royal Blue', hex: '#2563eb', group: 'cool' },
  { name: 'Deep Purple', hex: '#7c3aed', group: 'cool' },
  { name: 'Violet', hex: '#8b5cf6', group: 'cool' },
  { name: 'Teal', hex: '#14b8a6', group: 'cool' },
  { name: 'Emerald', hex: '#10b981', group: 'warm' },
  { name: 'Forest Green', hex: '#22c55e', group: 'warm' },
  { name: 'Fire Red', hex: '#ef4444', group: 'warm' },
  { name: 'Rose', hex: '#f43f5e', group: 'warm' },
  { name: 'Sunset Orange', hex: '#f97316', group: 'warm' },
  { name: 'Amber', hex: '#f59e0b', group: 'warm' },
  { name: 'Slate', hex: '#64748b', group: 'neutral' },
  { name: 'Zinc', hex: '#71717a', group: 'neutral' },
];

const FONTS = {
  modern: { name: 'Modern Sans', family: "'Inter', 'Segoe UI', sans-serif", weight: '400' },
  elegant: { name: 'Elegant Serif', family: "'Playfair Display', 'Georgia', serif", weight: '400' },
  bold: { name: 'Bold Impact', family: "'Anton', 'Arial Black', sans-serif", weight: '400' },
  clean: { name: 'Clean & Simple', family: "'Work Sans', 'Helvetica Neue', sans-serif", weight: '400' },
  classic: { name: 'Classic', family: "'Merriweather', 'Times New Roman', serif", weight: '400' },
  tech: { name: 'Tech/Code', family: "'JetBrains Mono', 'Fira Code', monospace", weight: '400' },
};

const LAYOUTS = {
  centered: { name: 'Centered', description: 'Classic centered layout', icon: '⬜' },
  sidebar: { name: 'Sidebar', description: 'Info sidebar + content', icon: '◧' },
  cards: { name: 'Cards', description: 'Modular card sections', icon: '▦' },
  timeline: { name: 'Timeline', description: 'Vertical timeline flow', icon: '│' },
};

const EFFECTS = {
  particles: { name: 'Floating Particles', description: 'Subtle animated particles' },
  gradient: { name: 'Gradient Background', description: 'Smooth color transitions' },
  glow: { name: 'Glow Effects', description: 'Neon glow on accents' },
  glass: { name: 'Glassmorphism', description: 'Frosted glass panels' },
  shadows: { name: 'Deep Shadows', description: '3D depth with shadows' },
  noise: { name: 'Subtle Texture', description: 'Paper/grain texture overlay' },
};

const HEADER_STYLES = {
  full: { name: 'Full Width Hero', description: 'Large header spanning full width' },
  compact: { name: 'Compact', description: 'Smaller, professional header' },
  split: { name: 'Split', description: 'Photo left, info right' },
  minimal: { name: 'Minimal', description: 'Just name and title' },
};

const SECTION_STYLES = {
  cards: { name: 'Cards', description: 'Each section in a card' },
  dividers: { name: 'Dividers', description: 'Horizontal line separators' },
  floating: { name: 'Floating', description: 'Elevated with shadows' },
  flat: { name: 'Flat', description: 'Clean, no borders' },
};

export default function PortfolioStage() {
  const { state, updatePortfolioOption, nextStage, prevStage } = useRefinery();
  const { portfolioOptions, forgePayload } = state;
  
  // Local state
  const [customColor, setCustomColor] = useState(portfolioOptions.accent_color || '#D4A84B');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'theme' | 'colors' | 'typography' | 'layout' | 'effects' | 'extras'>('theme');

  // Get current selections with defaults
  const currentTheme = portfolioOptions.theme || 'forge';
  const currentAccent = portfolioOptions.accent_color || '#D4A84B';
  const currentFont = portfolioOptions.font_style || 'modern';
  const currentLayout = portfolioOptions.layout_style || 'centered';
  const currentHeaderStyle = portfolioOptions.header_style || 'full';
  const currentSectionStyle = portfolioOptions.section_style || 'cards';
  
  // Effects toggles
  const effects = {
    particles: portfolioOptions.effect_particles ?? true,
    gradient: portfolioOptions.effect_gradient ?? true,
    glow: portfolioOptions.effect_glow ?? true,
    glass: portfolioOptions.effect_glass ?? true,
    shadows: portfolioOptions.effect_shadows ?? true,
    noise: portfolioOptions.effect_noise ?? false,
  };

  const toggleEffect = (effect: string) => {
    updatePortfolioOption(`effect_${effect}` as any, !effects[effect as keyof typeof effects]);
  };

  // Generate tagline preview
  const getTaglinePreview = () => {
    const name = forgePayload?.profile?.full_name?.split(' ')[0] || 'Professional';
    const role = forgePayload?.intake?.target_role || 'your field';
    const style = portfolioOptions.tagline_style || 'professional';
    
    switch (style) {
      case 'bold':
        return `${role} Expert • Results-Driven • Ready to Deliver`;
      case 'friendly':
        return `Hey, I'm ${name}! Passionate about ${role.toLowerCase()} and making an impact.`;
      case 'minimal':
        return role;
      default:
        return `Experienced ${role.toLowerCase()} professional dedicated to excellence`;
    }
  };

  const themeData = THEMES[currentTheme as keyof typeof THEMES] || THEMES.forge;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D] via-[#1A1A1A] to-[#0D0D0D]">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(212, 168, 75, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, rgba(212, 168, 75, 0.05) 0%, transparent 50%)`
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 py-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Image 
                src="/logo.png" 
                alt="Steel Man Resumes" 
                width={40} 
                height={40}
                className="opacity-80"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-headline text-steelGold mb-2">
              DESIGN YOUR PORTFOLIO
            </h1>
            <p className="text-paperWhite/70 text-sm max-w-xl mx-auto">
              Create a stunning web portfolio that showcases your skills. Every option you choose will be reflected in your downloadable HTML file.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-1 mb-6 flex-wrap">
            {[
              { id: 'theme', label: 'Theme', icon: '🎨' },
              { id: 'colors', label: 'Colors', icon: '🎯' },
              { id: 'typography', label: 'Typography', icon: '✍️' },
              { id: 'layout', label: 'Layout', icon: '📐' },
              { id: 'effects', label: 'Effects', icon: '✨' },
              { id: 'extras', label: 'Extras', icon: '🎁' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.id 
                    ? 'bg-steelGold text-forgeBlack' 
                    : 'bg-white/5 text-paperWhite/70 hover:bg-white/10 hover:text-paperWhite'}
                `}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            
            {/* Left: Options (3 cols) */}
            <div className="lg:col-span-3 space-y-5">
              
              {/* THEME TAB */}
              {activeTab === 'theme' && (
                <GlassPanel className="p-5">
                  <h3 className="text-lg font-headline text-steelGold mb-4">Choose Your Theme</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(THEMES).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => updatePortfolioOption('theme', key)}
                        className={`
                          p-3 rounded-lg border text-left transition-all group
                          ${currentTheme === key 
                            ? 'border-steelGold bg-steelGold/20' 
                            : 'border-white/10 bg-white/5 hover:border-steelGold/50'}
                        `}
                      >
                        {/* Theme preview swatch */}
                        <div 
                          className="w-full h-12 rounded-md mb-2 flex items-center justify-center text-xl transition-transform group-hover:scale-105"
                          style={{ 
                            backgroundColor: theme.preview.bg,
                            border: `2px solid ${theme.preview.accent}`
                          }}
                        >
                          {theme.icon}
                        </div>
                        <div className="text-paperWhite font-semibold text-sm">{theme.name}</div>
                        <div className="text-industrialGray text-xs">{theme.description}</div>
                      </button>
                    ))}
                  </div>
                </GlassPanel>
              )}

              {/* COLORS TAB */}
              {activeTab === 'colors' && (
                <GlassPanel className="p-5">
                  <h3 className="text-lg font-headline text-steelGold mb-4">Accent Color</h3>
                  
                  {/* Brand Colors */}
                  <div className="mb-4">
                    <p className="text-xs text-steelGold mb-2 uppercase tracking-wider">Steel Man Brand</p>
                    <div className="flex gap-2 flex-wrap">
                      {ACCENT_COLORS.filter(c => c.group === 'brand').map((color) => (
                        <button
                          key={color.hex}
                          onClick={() => {
                            updatePortfolioOption('accent_color', color.hex);
                            setCustomColor(color.hex);
                          }}
                          className={`
                            w-12 h-12 rounded-lg border-2 transition-all relative group
                            ${currentAccent === color.hex 
                              ? 'border-white scale-110 shadow-lg' 
                              : 'border-transparent hover:scale-105'}
                          `}
                          style={{ backgroundColor: color.hex, boxShadow: currentAccent === color.hex ? `0 0 20px ${color.hex}` : 'none' }}
                          title={color.name}
                        >
                          {currentAccent === color.hex && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-lg">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cool Colors */}
                  <div className="mb-4">
                    <p className="text-xs text-industrialGray mb-2 uppercase tracking-wider">Cool Tones</p>
                    <div className="flex gap-2 flex-wrap">
                      {ACCENT_COLORS.filter(c => c.group === 'cool').map((color) => (
                        <button
                          key={color.hex}
                          onClick={() => {
                            updatePortfolioOption('accent_color', color.hex);
                            setCustomColor(color.hex);
                          }}
                          className={`
                            w-10 h-10 rounded-lg border-2 transition-all
                            ${currentAccent === color.hex 
                              ? 'border-white scale-110' 
                              : 'border-transparent hover:scale-105'}
                          `}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Warm Colors */}
                  <div className="mb-4">
                    <p className="text-xs text-industrialGray mb-2 uppercase tracking-wider">Warm Tones</p>
                    <div className="flex gap-2 flex-wrap">
                      {ACCENT_COLORS.filter(c => c.group === 'warm').map((color) => (
                        <button
                          key={color.hex}
                          onClick={() => {
                            updatePortfolioOption('accent_color', color.hex);
                            setCustomColor(color.hex);
                          }}
                          className={`
                            w-10 h-10 rounded-lg border-2 transition-all
                            ${currentAccent === color.hex 
                              ? 'border-white scale-110' 
                              : 'border-transparent hover:scale-105'}
                          `}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Neutral Colors */}
                  <div className="mb-4">
                    <p className="text-xs text-industrialGray mb-2 uppercase tracking-wider">Neutral</p>
                    <div className="flex gap-2 flex-wrap">
                      {ACCENT_COLORS.filter(c => c.group === 'neutral').map((color) => (
                        <button
                          key={color.hex}
                          onClick={() => {
                            updatePortfolioOption('accent_color', color.hex);
                            setCustomColor(color.hex);
                          }}
                          className={`
                            w-10 h-10 rounded-lg border-2 transition-all
                            ${currentAccent === color.hex 
                              ? 'border-white scale-110' 
                              : 'border-transparent hover:scale-105'}
                          `}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Custom Color */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowCustomPicker(!showCustomPicker)}
                        className="text-sm text-steelGold hover:underline"
                      >
                        {showCustomPicker ? '▼ Hide custom picker' : '► Custom color...'}
                      </button>
                    </div>
                    {showCustomPicker && (
                      <div className="flex items-center gap-3 mt-3 p-3 bg-white/5 rounded-lg">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => {
                            setCustomColor(e.target.value);
                            updatePortfolioOption('accent_color', e.target.value);
                          }}
                          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20"
                        />
                        <div>
                          <input
                            type="text"
                            value={customColor}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                setCustomColor(val);
                                if (val.length === 7) {
                                  updatePortfolioOption('accent_color', val);
                                }
                              }
                            }}
                            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm font-mono text-paperWhite w-24"
                          />
                          <p className="text-xs text-industrialGray mt-1">Enter hex code</p>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              )}

              {/* TYPOGRAPHY TAB */}
              {activeTab === 'typography' && (
                <div className="space-y-5">
                  <GlassPanel className="p-5">
                    <h3 className="text-lg font-headline text-steelGold mb-4">Font Style</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(FONTS).map(([key, font]) => (
                        <button
                          key={key}
                          onClick={() => updatePortfolioOption('font_style', key)}
                          className={`
                            p-4 rounded-lg border text-left transition-all
                            ${currentFont === key 
                              ? 'border-steelGold bg-steelGold/20' 
                              : 'border-white/10 bg-white/5 hover:border-steelGold/50'}
                          `}
                        >
                          <div 
                            className="text-xl mb-1 text-paperWhite"
                            style={{ fontFamily: font.family }}
                          >
                            Aa
                          </div>
                          <div className="text-paperWhite font-semibold text-sm">{font.name}</div>
                        </button>
                      ))}
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-5">
                    <h3 className="text-lg font-headline text-steelGold mb-4">Tagline Style</h3>
                    <div className="space-y-2">
                      {[
                        { key: 'professional', name: 'Professional', desc: 'Formal and polished', icon: '💼' },
                        { key: 'bold', name: 'Bold', desc: 'Confident and direct', icon: '💪' },
                        { key: 'friendly', name: 'Friendly', desc: 'Warm and approachable', icon: '😊' },
                        { key: 'minimal', name: 'Minimal', desc: 'Just the essentials', icon: '✨' },
                      ].map((style) => (
                        <button
                          key={style.key}
                          onClick={() => updatePortfolioOption('tagline_style', style.key)}
                          className={`
                            w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3
                            ${portfolioOptions.tagline_style === style.key || (!portfolioOptions.tagline_style && style.key === 'professional')
                              ? 'border-steelGold bg-steelGold/20' 
                              : 'border-white/10 bg-white/5 hover:border-steelGold/50'}
                          `}
                        >
                          <span className="text-xl">{style.icon}</span>
                          <div>
                            <div className="text-paperWhite font-semibold text-sm">{style.name}</div>
                            <div className="text-industrialGray text-xs">{style.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </GlassPanel>
                </div>
              )}

              {/* LAYOUT TAB */}
              {activeTab === 'layout' && (
                <div className="space-y-5">
                  <GlassPanel className="p-5">
                    <h3 className="text-lg font-headline text-steelGold mb-4">Page Layout</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(LAYOUTS).map(([key, layout]) => (
                        <button
                          key={key}
                          onClick={() => updatePortfolioOption('layout_style', key)}
                          className={`
                            p-4 rounded-lg border text-left transition-all
                            ${currentLayout === key 
                              ? 'border-steelGold bg-steelGold/20' 
                              : 'border-white/10 bg-white/5 hover:border-steelGold/50'}
                          `}
                        >
                          <div className="text-3xl mb-2 text-center text-paperWhite/60">{layout.icon}</div>
                          <div className="text-paperWhite font-semibold text-sm text-center">{layout.name}</div>
                          <div className="text-industrialGray text-xs text-center">{layout.description}</div>
                        </button>
                      ))}
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-5">
                    <h3 className="text-lg font-headline text-steelGold mb-4">Header Style</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(HEADER_STYLES).map(([key, style]) => (
                        <button
                          key={key}
                          onClick={() => updatePortfolioOption('header_style', key)}
                          className={`
                            p-3 rounded-lg border text-left transition-all
                            ${currentHeaderStyle === key 
                              ? 'border-steelGold bg-steelGold/20' 
                              : 'border-white/10 bg-white/5 hover:border-steelGold/50'}
                          `}
                        >
                          <div className="text-paperWhite font-semibold text-sm">{style.name}</div>
                          <div className="text-industrialGray text-xs">{style.description}</div>
                        </button>
                      ))}
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-5">
                    <h3 className="text-lg font-headline text-steelGold mb-4">Section Style</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(SECTION_STYLES).map(([key, style]) => (
                        <button
                          key={key}
                          onClick={() => updatePortfolioOption('section_style', key)}
                          className={`
                            p-3 rounded-lg border text-left transition-all
                            ${currentSectionStyle === key 
                              ? 'border-steelGold bg-steelGold/20' 
                              : 'border-white/10 bg-white/5 hover:border-steelGold/50'}
                          `}
                        >
                          <div className="text-paperWhite font-semibold text-sm">{style.name}</div>
                          <div className="text-industrialGray text-xs">{style.description}</div>
                        </button>
                      ))}
                    </div>
                  </GlassPanel>
                </div>
              )}

              {/* EFFECTS TAB */}
              {activeTab === 'effects' && (
                <GlassPanel className="p-5">
                  <h3 className="text-lg font-headline text-steelGold mb-2">Visual Effects</h3>
                  <p className="text-xs text-industrialGray mb-4">Toggle effects to customize your portfolio's visual style</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(EFFECTS).map(([key, effect]) => (
                      <button
                        key={key}
                        onClick={() => toggleEffect(key)}
                        className={`
                          p-4 rounded-lg border text-left transition-all
                          ${effects[key as keyof typeof effects]
                            ? 'border-steelGold bg-steelGold/20' 
                            : 'border-white/10 bg-white/5 hover:border-steelGold/50'}
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-paperWhite font-semibold text-sm">{effect.name}</span>
                          <span className={`text-lg ${effects[key as keyof typeof effects] ? 'text-steelGold' : 'text-industrialGray'}`}>
                            {effects[key as keyof typeof effects] ? '✓' : '○'}
                          </span>
                        </div>
                        <div className="text-industrialGray text-xs">{effect.description}</div>
                      </button>
                    ))}
                  </div>
                </GlassPanel>
              )}

              {/* EXTRAS TAB */}
              {activeTab === 'extras' && (
                <GlassPanel className="p-5">
                  <h3 className="text-lg font-headline text-steelGold mb-4">Bonus Materials</h3>
                  <p className="text-xs text-industrialGray mb-4">Select additional resources to include with your package</p>
                  <div className="space-y-3">
                    {[
                      { key: 'extras_job_tracker', label: 'Job Application Tracker', desc: 'Excel spreadsheet to track applications', icon: '📊' },
                      { key: 'extras_quick_start', label: 'Quick Start Guide', desc: 'Your first 48 hours action plan', icon: '🚀' },
                      { key: 'extras_salary_negotiation', label: 'Salary Negotiation Guide', desc: 'Scripts and strategies for more pay', icon: '💰' },
                      { key: 'extras_interview_prep', label: 'Interview Prep Sheet', desc: 'Common questions & STAR answers', icon: '🎤' },
                    ].map((extra) => (
                      <button
                        key={extra.key}
                        onClick={() => updatePortfolioOption(extra.key as any, !portfolioOptions[extra.key as keyof typeof portfolioOptions])}
                        className={`
                          w-full p-4 rounded-lg border text-left transition-all flex items-center gap-4
                          ${portfolioOptions[extra.key as keyof typeof portfolioOptions]
                            ? 'border-steelGold bg-steelGold/20' 
                            : 'border-white/10 bg-white/5 hover:border-steelGold/50'}
                        `}
                      >
                        <span className="text-2xl">{extra.icon}</span>
                        <div className="flex-1">
                          <div className="text-paperWhite font-semibold">{extra.label}</div>
                          <div className="text-industrialGray text-xs">{extra.desc}</div>
                        </div>
                        <span className={`text-xl ${portfolioOptions[extra.key as keyof typeof portfolioOptions] ? 'text-steelGold' : 'text-industrialGray'}`}>
                          {portfolioOptions[extra.key as keyof typeof portfolioOptions] ? '✓' : '○'}
                        </span>
                      </button>
                    ))}
                  </div>
                </GlassPanel>
              )}
            </div>

            {/* Right: Live Preview (2 cols) */}
            <div className="lg:col-span-2">
              <div className="sticky top-6">
                <GlassPanel className="p-4">
                  <h3 className="text-sm font-headline text-steelGold mb-3 flex items-center gap-2">
                    <span>👁️</span> LIVE PREVIEW
                  </h3>
                  
                  {/* Mini portfolio preview */}
                  <div 
                    className="rounded-lg overflow-hidden border border-white/20 shadow-2xl"
                    style={{ 
                      fontFamily: FONTS[currentFont as keyof typeof FONTS]?.family || FONTS.modern.family,
                    }}
                  >
                    {/* Header Preview */}
                    <div 
                      className="p-5 text-center relative overflow-hidden"
                      style={{ 
                        backgroundColor: themeData.preview.bg,
                        color: themeData.preview.text
                      }}
                    >
                      {/* Gradient overlay if enabled */}
                      {effects.gradient && (
                        <div 
                          className="absolute inset-0 opacity-50"
                          style={{
                            background: `radial-gradient(circle at 30% 20%, ${currentAccent}33 0%, transparent 50%),
                                        radial-gradient(circle at 70% 80%, ${currentAccent}22 0%, transparent 50%)`
                          }}
                        />
                      )}
                      
                      {/* Particles simulation if enabled */}
                      {effects.particles && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-1 h-1 rounded-full animate-pulse"
                              style={{
                                backgroundColor: currentAccent,
                                left: `${15 + i * 15}%`,
                                top: `${20 + (i % 3) * 25}%`,
                                opacity: 0.4 + (i * 0.1),
                                animationDelay: `${i * 0.3}s`
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="relative z-10">
                        {/* Avatar */}
                        <div 
                          className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold ${effects.glow ? 'shadow-lg' : ''}`}
                          style={{ 
                            backgroundColor: currentAccent,
                            color: themeData.preview.bg,
                            boxShadow: effects.glow ? `0 0 25px ${currentAccent}` : 'none'
                          }}
                        >
                          {forgePayload?.profile?.full_name?.charAt(0) || 'Y'}
                        </div>
                        
                        {/* Name */}
                        <h4 
                          className="text-lg font-bold mb-1"
                          style={{ 
                            textShadow: effects.glow ? `0 0 10px ${currentAccent}` : 'none' 
                          }}
                        >
                          {forgePayload?.profile?.full_name || 'Your Name'}
                        </h4>
                        
                        {/* Role badge */}
                        <div 
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
                          style={{ 
                            backgroundColor: currentAccent,
                            color: themeData.preview.bg
                          }}
                        >
                          {forgePayload?.intake?.target_role || 'Target Role'}
                        </div>
                      </div>
                    </div>

                    {/* Tagline */}
                    <div 
                      className={`p-3 border-t text-center ${effects.glass ? 'backdrop-blur-sm bg-white/5' : ''}`}
                      style={{ borderColor: `${currentAccent}33` }}
                    >
                      <p 
                        className="text-xs italic"
                        style={{ color: themeData.preview.text, opacity: 0.8 }}
                      >
                        "{getTaglinePreview()}"
                      </p>
                    </div>

                    {/* Content sections preview */}
                    <div 
                      className="p-4 space-y-3"
                      style={{ backgroundColor: themeData.preview.bg }}
                    >
                      {/* Skills section */}
                      <div 
                        className={`p-3 rounded-lg ${effects.glass ? 'backdrop-blur-sm' : ''} ${effects.shadows ? 'shadow-lg' : ''}`}
                        style={{ 
                          backgroundColor: `${themeData.preview.text}08`,
                          border: currentSectionStyle === 'cards' ? `1px solid ${currentAccent}33` : 'none',
                          borderLeft: currentSectionStyle === 'dividers' ? `3px solid ${currentAccent}` : undefined
                        }}
                      >
                        <div 
                          className="text-xs font-bold mb-2 uppercase tracking-wider"
                          style={{ color: currentAccent }}
                        >
                          Skills
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {['Skill 1', 'Skill 2', 'Skill 3'].map((skill, i) => (
                            <span 
                              key={i}
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ 
                                backgroundColor: `${currentAccent}22`,
                                color: themeData.preview.text
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Experience section */}
                      <div 
                        className={`p-3 rounded-lg ${effects.glass ? 'backdrop-blur-sm' : ''} ${effects.shadows ? 'shadow-lg' : ''}`}
                        style={{ 
                          backgroundColor: `${themeData.preview.text}08`,
                          border: currentSectionStyle === 'cards' ? `1px solid ${currentAccent}33` : 'none',
                          borderLeft: currentSectionStyle === 'dividers' ? `3px solid ${currentAccent}` : undefined
                        }}
                      >
                        <div 
                          className="text-xs font-bold mb-2 uppercase tracking-wider"
                          style={{ color: currentAccent }}
                        >
                          Experience
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 rounded" style={{ backgroundColor: `${themeData.preview.text}20`, width: '80%' }} />
                          <div className="h-2 rounded" style={{ backgroundColor: `${themeData.preview.text}15`, width: '60%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div 
                      className="p-3 text-center text-xs font-semibold"
                      style={{ backgroundColor: currentAccent, color: themeData.preview.bg }}
                    >
                      Contact Me →
                    </div>
                  </div>

                  {/* Preview note */}
                  <p className="text-xs text-industrialGray text-center mt-3">
                    Your portfolio will include all your work history, skills, education, and contact information.
                  </p>

                  {/* Current selections summary */}
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-steelGold font-semibold mb-2">Current Selections:</p>
                    <div className="text-xs text-industrialGray space-y-1">
                      <div>Theme: <span className="text-paperWhite">{THEMES[currentTheme as keyof typeof THEMES]?.name}</span></div>
                      <div>Font: <span className="text-paperWhite">{FONTS[currentFont as keyof typeof FONTS]?.name}</span></div>
                      <div>Layout: <span className="text-paperWhite">{LAYOUTS[currentLayout as keyof typeof LAYOUTS]?.name}</span></div>
                      <div className="flex items-center gap-1">
                        Accent: 
                        <span 
                          className="inline-block w-3 h-3 rounded"
                          style={{ backgroundColor: currentAccent }}
                        />
                        <span className="text-paperWhite font-mono">{currentAccent}</span>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button 
              variant="ghost" 
              onClick={prevStage}
              className="text-paperWhite/60 hover:text-paperWhite"
            >
              ← Back
            </Button>
            <Button 
              variant="primary" 
              onClick={nextStage}
              className="btn-gold px-8"
            >
              Continue to Payment →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
