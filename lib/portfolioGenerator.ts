// ═══════════════════════════════════════════════════════════════════════════
// PORTFOLIO HTML GENERATOR - STUNNING VISUAL OUTPUT
// Matches SMR Forge/Refinery aesthetic with full customization
// ═══════════════════════════════════════════════════════════════════════════

import type { ForgePayloadV1 } from '@/lib/types';
import type { PortfolioOptions } from '@/store/refineryStore';

// Theme definitions matching PortfolioStage
const THEMES: Record<string, { bg: string; bgSecondary: string; text: string; textMuted: string; defaultAccent: string }> = {
  forge: {
    bg: '#0D0D0D',
    bgSecondary: '#1A1A1A',
    text: '#F5F5F0',
    textMuted: '#A0A0A0',
    defaultAccent: '#FF6B35',
  },
  executive: {
    bg: '#0f172a',
    bgSecondary: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    defaultAccent: '#D4A84B',
  },
  midnight: {
    bg: '#1e1b4b',
    bgSecondary: '#312e81',
    text: '#e2e8f0',
    textMuted: '#a5b4fc',
    defaultAccent: '#a78bfa',
  },
  steel: {
    bg: '#18181b',
    bgSecondary: '#27272a',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    defaultAccent: '#71717a',
  },
  nature: {
    bg: '#14532d',
    bgSecondary: '#166534',
    text: '#f0fdf4',
    textMuted: '#86efac',
    defaultAccent: '#22c55e',
  },
  ocean: {
    bg: '#0c4a6e',
    bgSecondary: '#075985',
    text: '#f0f9ff',
    textMuted: '#7dd3fc',
    defaultAccent: '#0ea5e9',
  },
  minimal: {
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    text: '#1f2937',
    textMuted: '#6b7280',
    defaultAccent: '#3b82f6',
  },
  noir: {
    bg: '#000000',
    bgSecondary: '#0a0a0a',
    text: '#ffffff',
    textMuted: '#a3a3a3',
    defaultAccent: '#ffffff',
  },
};

const FONTS: Record<string, string> = {
  modern: "'Inter', 'Segoe UI', -apple-system, sans-serif",
  elegant: "'Playfair Display', 'Georgia', serif",
  bold: "'Anton', 'Arial Black', sans-serif",
  clean: "'Work Sans', 'Helvetica Neue', sans-serif",
  classic: "'Merriweather', 'Times New Roman', serif",
  tech: "'JetBrains Mono', 'Fira Code', monospace",
};

export function createPortfolioHTML(payload: ForgePayloadV1, options: PortfolioOptions): string {
  // Extract user data
  const name = payload.profile?.full_name || 'Your Name';
  const firstName = name.split(' ')[0];
  const email = payload.profile?.email || '';
  const phone = payload.profile?.phone || '';
  const location = `${payload.profile?.city || ''}, ${payload.profile?.state || ''}`.replace(/^, |, $/g, '');
  const targetRole = payload.intake?.target_role || 'Professional';
  const summary = payload.narrative?.summary?.professional || payload.narrative?.elevator_pitch_30s || '';
  const hardSkills = payload.skills?.skills?.hard || [];
  const softSkills = payload.skills?.skills?.soft || [];
  const allSkills = [...hardSkills, ...softSkills].slice(0, 12);
  const workHistory = payload.work_history || [];
  const education = payload.education || [];
  const certifications = payload.certifications_raw || [];

  // Get options with defaults
  const theme = options.theme || 'forge';
  const accentColor = options.accent_color || THEMES[theme]?.defaultAccent || '#D4A84B';
  const fontStyle = options.font_style || 'modern';
  const taglineStyle = options.tagline_style || 'professional';
  const layoutStyle = options.layout_style || 'centered';
  const headerStyle = options.header_style || 'full';
  const sectionStyle = options.section_style || 'cards';
  
  // Effects
  const particles = options.effect_particles ?? true;
  const gradient = options.effect_gradient ?? true;
  const glow = options.effect_glow ?? true;
  const glass = options.effect_glass ?? true;
  const shadows = options.effect_shadows ?? true;
  const noise = options.effect_noise ?? false;

  const themeColors = THEMES[theme] || THEMES.forge;
  const fontFamily = FONTS[fontStyle] || FONTS.modern;
  const isLightTheme = theme === 'minimal';

  // Generate tagline based on style
  const getTagline = () => {
    switch (taglineStyle) {
      case 'bold':
        return `${targetRole} Expert • Results-Driven • Ready to Deliver`;
      case 'friendly':
        return `Hey, I'm ${firstName}! Passionate about ${targetRole.toLowerCase()} and making an impact.`;
      case 'minimal':
        return targetRole;
      default:
        return `Experienced ${targetRole.toLowerCase()} professional dedicated to excellence`;
    }
  };

  // CSS for effects
  const getEffectStyles = () => {
    let styles = '';
    
    if (particles) {
      styles += `
        .particles-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: ${accentColor};
          opacity: 0;
          animation: float-particle 8s infinite ease-in-out;
        }
        @keyframes float-particle {
          0%, 100% { opacity: 0; transform: translateY(100vh) scale(0); }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-100px) scale(1); }
        }
      `;
    }

    if (glow) {
      styles += `
        .glow { text-shadow: 0 0 20px ${accentColor}66; }
        .glow-box { box-shadow: 0 0 30px ${accentColor}44; }
      `;
    }

    if (glass) {
      styles += `
        .glass {
          background: ${isLightTheme ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.05)'};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
        }
      `;
    }

    if (shadows) {
      styles += `
        .deep-shadow {
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
      `;
    }

    if (noise) {
      styles += `
        .noise::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }
      `;
    }

    return styles;
  };

  // Section styling based on option
  const getSectionClass = () => {
    switch (sectionStyle) {
      case 'cards':
        return `background: ${themeColors.bgSecondary}; border-radius: 16px; border: 1px solid ${accentColor}33; ${shadows ? 'box-shadow: 0 10px 40px rgba(0,0,0,0.3);' : ''}`;
      case 'dividers':
        return `border-left: 4px solid ${accentColor}; padding-left: 24px; background: transparent;`;
      case 'floating':
        return `background: ${themeColors.bgSecondary}; border-radius: 12px; transform: translateY(0); transition: transform 0.3s; ${shadows ? 'box-shadow: 0 20px 60px rgba(0,0,0,0.4);' : ''}`;
      default:
        return `background: transparent;`;
    }
  };

  // Generate particles HTML
  const particlesHTML = particles ? `
    <div class="particles-container">
      ${Array.from({ length: 20 }, (_, i) => `
        <div class="particle" style="
          left: ${Math.random() * 100}%;
          animation-delay: ${Math.random() * 8}s;
          animation-duration: ${6 + Math.random() * 4}s;
        "></div>
      `).join('')}
    </div>
  ` : '';

  // Generate gradient overlay
  const gradientOverlay = gradient ? `
    <div style="
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 20% 20%, ${accentColor}22 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, ${accentColor}11 0%, transparent 50%);
      pointer-events: none;
    "></div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} | ${targetRole}</title>
  <meta name="description" content="${summary.slice(0, 160)}">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Work+Sans:wght@300;400;500;600;700&family=Merriweather:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <style>
    /* ═══════════════════════════════════════════════════════════════════════
       CSS RESET & BASE
       ═══════════════════════════════════════════════════════════════════════ */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    
    html { scroll-behavior: smooth; }
    
    body {
      font-family: ${fontFamily};
      background: ${themeColors.bg};
      color: ${themeColors.text};
      line-height: 1.7;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       CUSTOM PROPERTIES
       ═══════════════════════════════════════════════════════════════════════ */
    :root {
      --bg: ${themeColors.bg};
      --bg-secondary: ${themeColors.bgSecondary};
      --text: ${themeColors.text};
      --text-muted: ${themeColors.textMuted};
      --accent: ${accentColor};
    }

    /* ═══════════════════════════════════════════════════════════════════════
       EFFECT STYLES
       ═══════════════════════════════════════════════════════════════════════ */
    ${getEffectStyles()}

    /* ═══════════════════════════════════════════════════════════════════════
       LAYOUT
       ═══════════════════════════════════════════════════════════════════════ */
    .container {
      max-width: ${layoutStyle === 'sidebar' ? '1400px' : '1000px'};
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       HEADER
       ═══════════════════════════════════════════════════════════════════════ */
    header {
      position: relative;
      ${headerStyle === 'full' ? 'min-height: 70vh; display: flex; align-items: center; justify-content: center;' : ''}
      ${headerStyle === 'compact' ? 'padding: 60px 0;' : ''}
      ${headerStyle === 'minimal' ? 'padding: 40px 0;' : ''}
      text-align: center;
      overflow: hidden;
    }

    .header-content {
      position: relative;
      z-index: 10;
    }

    .avatar {
      width: ${headerStyle === 'full' ? '140px' : '100px'};
      height: ${headerStyle === 'full' ? '140px' : '100px'};
      border-radius: 50%;
      background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${headerStyle === 'full' ? '56px' : '40px'};
      font-weight: bold;
      color: ${themeColors.bg};
      margin: 0 auto 24px;
      ${glow ? `box-shadow: 0 0 60px ${accentColor}66;` : ''}
      border: 4px solid ${accentColor}33;
    }

    h1 {
      font-family: ${fontStyle === 'bold' ? "'Anton', sans-serif" : fontFamily};
      font-size: ${headerStyle === 'full' ? '4rem' : '2.5rem'};
      font-weight: 700;
      letter-spacing: ${fontStyle === 'bold' ? '0.05em' : '-0.02em'};
      margin-bottom: 16px;
      ${fontStyle === 'bold' ? 'text-transform: uppercase;' : ''}
      ${glow ? `text-shadow: 0 0 40px ${accentColor}44;` : ''}
    }

    .role-badge {
      display: inline-block;
      background: ${accentColor};
      color: ${themeColors.bg};
      padding: 12px 32px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 1rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 20px;
      ${glow ? `box-shadow: 0 0 30px ${accentColor}66;` : ''}
    }

    .tagline {
      font-size: 1.2rem;
      color: ${themeColors.textMuted};
      max-width: 600px;
      margin: 0 auto 32px;
      font-style: ${taglineStyle === 'professional' ? 'italic' : 'normal'};
    }

    .contact-links {
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .contact-links a {
      color: ${themeColors.text};
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      background: ${glass ? `${themeColors.bgSecondary}88` : themeColors.bgSecondary};
      ${glass ? 'backdrop-filter: blur(8px);' : ''}
      transition: all 0.3s ease;
      border: 1px solid ${accentColor}22;
    }

    .contact-links a:hover {
      transform: translateY(-3px);
      background: ${accentColor}22;
      border-color: ${accentColor}44;
      ${glow ? `box-shadow: 0 10px 30px ${accentColor}33;` : ''}
    }

    /* ═══════════════════════════════════════════════════════════════════════
       MAIN CONTENT
       ═══════════════════════════════════════════════════════════════════════ */
    main {
      padding: 80px 0;
      ${layoutStyle === 'sidebar' ? 'display: grid; grid-template-columns: 300px 1fr; gap: 40px;' : ''}
    }

    section {
      ${getSectionClass()}
      padding: 40px;
      margin-bottom: 40px;
      position: relative;
      ${noise ? 'overflow: hidden;' : ''}
    }

    section:hover {
      ${sectionStyle === 'floating' ? 'transform: translateY(-5px);' : ''}
    }

    h2 {
      font-family: ${fontStyle === 'bold' ? "'Anton', sans-serif" : fontFamily};
      color: ${accentColor};
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid ${accentColor}44;
      ${fontStyle === 'bold' ? 'text-transform: uppercase; letter-spacing: 0.1em;' : ''}
    }

    /* ═══════════════════════════════════════════════════════════════════════
       ABOUT / SUMMARY
       ═══════════════════════════════════════════════════════════════════════ */
    .summary-text {
      font-size: 1.1rem;
      line-height: 1.9;
      color: ${themeColors.text};
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SKILLS
       ═══════════════════════════════════════════════════════════════════════ */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }

    .skill-tag {
      background: ${accentColor}18;
      color: ${themeColors.text};
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      text-align: center;
      border: 1px solid ${accentColor}33;
      transition: all 0.3s ease;
    }

    .skill-tag:hover {
      background: ${accentColor}33;
      transform: translateY(-2px);
      ${shadows ? `box-shadow: 0 8px 20px ${accentColor}22;` : ''}
    }

    /* ═══════════════════════════════════════════════════════════════════════
       EXPERIENCE
       ═══════════════════════════════════════════════════════════════════════ */
    .job {
      padding: 24px 0;
      border-bottom: 1px solid ${accentColor}22;
    }

    .job:last-child {
      border-bottom: none;
    }

    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .job-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: ${themeColors.text};
      margin-bottom: 4px;
    }

    .job-company {
      color: ${accentColor};
      font-weight: 500;
      font-size: 1rem;
    }

    .job-dates {
      color: ${themeColors.textMuted};
      font-size: 0.9rem;
      background: ${themeColors.bgSecondary};
      padding: 6px 14px;
      border-radius: 20px;
    }

    .job-bullets {
      list-style: none;
    }

    .job-bullets li {
      position: relative;
      padding-left: 24px;
      margin-bottom: 10px;
      color: ${themeColors.textMuted};
    }

    .job-bullets li::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-weight: bold;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       EDUCATION & CERTIFICATIONS
       ═══════════════════════════════════════════════════════════════════════ */
    .edu-item, .cert-item {
      padding: 16px 0;
      border-bottom: 1px solid ${accentColor}15;
    }

    .edu-item:last-child, .cert-item:last-child {
      border-bottom: none;
    }

    .edu-title, .cert-title {
      font-weight: 600;
      color: ${themeColors.text};
      font-size: 1.05rem;
    }

    .edu-institution {
      color: ${accentColor};
      font-size: 0.95rem;
    }

    .edu-year {
      color: ${themeColors.textMuted};
      font-size: 0.85rem;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       FOOTER
       ═══════════════════════════════════════════════════════════════════════ */
    footer {
      text-align: center;
      padding: 60px 24px;
      background: ${accentColor};
      color: ${themeColors.bg};
      position: relative;
      overflow: hidden;
    }

    footer::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 0%, ${themeColors.bg}22 100%);
    }

    .footer-content {
      position: relative;
      z-index: 10;
    }

    .cta-button {
      display: inline-block;
      background: ${themeColors.bg};
      color: ${accentColor};
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: 700;
      text-decoration: none;
      font-size: 1.1rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      transition: all 0.3s ease;
      ${shadows ? `box-shadow: 0 10px 30px ${themeColors.bg}44;` : ''}
    }

    .cta-button:hover {
      transform: translateY(-3px) scale(1.02);
      ${shadows ? `box-shadow: 0 15px 40px ${themeColors.bg}55;` : ''}
    }

    .footer-brand {
      margin-top: 32px;
      font-size: 0.85rem;
      opacity: 0.8;
    }

    .footer-brand a {
      color: inherit;
      text-decoration: underline;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      h1 { font-size: 2.5rem; }
      header { min-height: auto; padding: 60px 0; }
      main { display: block !important; }
      section { padding: 24px; margin-bottom: 24px; }
      .job-header { flex-direction: column; }
      .contact-links { flex-direction: column; align-items: center; }
    }

    /* ═══════════════════════════════════════════════════════════════════════
       PRINT STYLES
       ═══════════════════════════════════════════════════════════════════════ */
    @media print {
      body { background: white; color: black; }
      header { min-height: auto; padding: 40px 0; }
      .particles-container { display: none; }
      section { box-shadow: none; border: 1px solid #ddd; }
      footer { background: #333; }
    }
  </style>
</head>
<body class="${noise ? 'noise' : ''}">
  
  <!-- HEADER -->
  <header>
    ${gradientOverlay}
    ${particlesHTML}
    
    <div class="header-content">
      <div class="avatar ${glow ? 'glow-box' : ''}">${firstName.charAt(0)}</div>
      <h1 class="${glow ? 'glow' : ''}">${name}</h1>
      <div class="role-badge">${targetRole}</div>
      <p class="tagline">${getTagline()}</p>
      
      <div class="contact-links">
        ${email ? `<a href="mailto:${email}">📧 ${email}</a>` : ''}
        ${phone ? `<a href="tel:${phone.replace(/\D/g, '')}">📱 ${phone}</a>` : ''}
        ${location ? `<a href="https://maps.google.com/?q=${encodeURIComponent(location)}" target="_blank">📍 ${location}</a>` : ''}
      </div>
    </div>
  </header>

  <!-- MAIN CONTENT -->
  <main class="container">
    
    <!-- About -->
    ${summary ? `
    <section class="${glass ? 'glass' : ''} ${shadows ? 'deep-shadow' : ''} ${noise ? 'noise' : ''}">
      <h2>About Me</h2>
      <p class="summary-text">${summary}</p>
    </section>
    ` : ''}

    <!-- Skills -->
    ${allSkills.length > 0 ? `
    <section class="${glass ? 'glass' : ''} ${shadows ? 'deep-shadow' : ''} ${noise ? 'noise' : ''}">
      <h2>Core Skills</h2>
      <div class="skills-grid">
        ${allSkills.map(skill => `<div class="skill-tag">${skill}</div>`).join('')}
      </div>
    </section>
    ` : ''}

    <!-- Experience -->
    ${workHistory.length > 0 ? `
    <section class="${glass ? 'glass' : ''} ${shadows ? 'deep-shadow' : ''} ${noise ? 'noise' : ''}">
      <h2>Professional Experience</h2>
      ${workHistory.map(job => `
        <div class="job">
          <div class="job-header">
            <div>
              <div class="job-title">${job.title}</div>
              <div class="job-company">${job.company}</div>
            </div>
            <div class="job-dates">${job.start_date} — ${job.end_date || 'Present'}</div>
          </div>
          ${job.bullets && job.bullets.length > 0 ? `
            <ul class="job-bullets">
              ${job.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
    ` : ''}

    <!-- Education -->
    ${education.length > 0 ? `
    <section class="${glass ? 'glass' : ''} ${shadows ? 'deep-shadow' : ''} ${noise ? 'noise' : ''}">
      <h2>Education</h2>
      ${education.map(edu => `
        <div class="edu-item">
          <div class="edu-title">${edu.credential}${edu.field ? ` in ${edu.field}` : ''}</div>
          <div class="edu-institution">${edu.institution}</div>
          ${edu.year ? `<div class="edu-year">${edu.year}</div>` : ''}
        </div>
      `).join('')}
    </section>
    ` : ''}

    <!-- Certifications -->
    ${certifications.length > 0 ? `
    <section class="${glass ? 'glass' : ''} ${shadows ? 'deep-shadow' : ''} ${noise ? 'noise' : ''}">
      <h2>Certifications</h2>
      ${certifications.map(cert => `
        <div class="cert-item">
          <div class="cert-title">${cert}</div>
        </div>
      `).join('')}
    </section>
    ` : ''}

  </main>

  <!-- FOOTER -->
  <footer>
    <div class="footer-content">
      <a href="mailto:${email}" class="cta-button">Let's Connect</a>
      <p class="footer-brand">
        Portfolio crafted with <a href="https://steelmanresumes.com" target="_blank">Steel Man Resumes</a><br>
        © ${new Date().getFullYear()} ${name}
      </p>
    </div>
  </footer>

</body>
</html>`;
}
