// Brand Constants - Steel Man Resumes

export const BRAND = {
  colors: {
    forgeBlack: '#0D0D0D',
    deepBlack: '#050505',
    steelGold: '#D4A84B',
    goldLight: '#E8C874',
    goldDark: '#A07830',
    trashRed: '#C41E3A',
    paperWhite: '#F5F5F0',
    industrialGray: '#4A4A4A',
    glassWhite: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
  },

  fonts: {
    headline: "'Anton', sans-serif",
    body: "'Work Sans', sans-serif",
    accent: "'Permanent Marker', cursive",
  },

  shadows: {
    glowGold: '0 0 20px rgba(212, 168, 75, 0.5)',
    glowGoldIntense: '0 0 40px rgba(212, 168, 75, 0.8)',
    glowRed: '0 0 20px rgba(196, 30, 58, 0.5)',
  },

  pricing: {
    refinery: 37.21,
    refineryStripe: 3721, // cents
  },

  promoCodes: {
    LETEMCOOK: 100, // percent off
  },
} as const;

export const FORGE_STAGES = [
  'welcome',
  'tech-comfort',
  'intake-method',
  'parsing',
  'confirm-profile',
  'goals',
  'challenges',
  'preferences',
  'processing',
  'results',
  'handoff',
] as const;

export const REFINERY_STAGES = [
  'reception',
  'confirm-profile',
  'screening-employment',
  'screening-life',
  'screening-support',
  'generation',
  'review',
  'portfolio',
  'payment',
  'download',
] as const;

export const EMPLOYMENT_STATS = [
  "The average recruiter spends 7.4 seconds reviewing a resume.",
  "75% of resumes are rejected by ATS before a human sees them.",
  "Tailored resumes get 3x more callbacks than generic ones.",
  "80% of jobs are filled through networking, not job boards.",
  "Following up on applications increases response rates by 30%.",
  "The average job search takes 5 months. We're about to accelerate yours.",
  "Companies receive an average of 250 resumes per job posting.",
  "Employees who negotiate salary earn $1 million more over their career.",
  "Keywords matching the job description increase interview chances by 60%.",
  "93% of hiring managers use LinkedIn to find candidates, but 70% of jobs are filled through direct application.",
  "Resumes with quantified achievements get 40% more interviews.",
  "The best time to apply is Tuesday morning.",
  "Companies using AI in hiring grew 67% since 2020.",
  "Companies review resumes for an average of 7 seconds.",
  "Employees who negotiate their first salary earn $1M more over their career.",
  "Tuesday between 10am-11am is the best time to submit applications.",
  "92% of employers check social media before hiring.",
  "Referrals are 4x more likely to get hired than other applicants.",
  "The average interview process takes 23 days.",
  "55% of job seekers find their position through networking.",
  "Customized cover letters increase callback rates by 50%.",
  "Including metrics in your resume increases interview chances by 40%.",
  "The first 5 applicants have a 25% chance of getting interviewed.",
  "Remote job postings receive 3x more applications.",
  "85% of jobs are filled through networking, not job boards.",
  "Following up within 24 hours of interview increases offer rates by 22%.",
  "Resumes with action verbs get 140% more responses.",
  "LinkedIn profiles with photos get 21x more views.",
  "60% of hiring managers reject candidates with typos.",
  "Video interviews increased 67% since 2020.",
  "Soft skills are now the #1 hiring priority for 91% of employers.",
  "The best time to job search is January and September.",
  "Employees who job hop earn 50% more over their careers.",
];

export const MOTIVATIONAL_QUOTES = [
  { quote: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "The comeback is always stronger than the setback.", author: "Unknown" },
  { quote: "Every saint has a past, and every sinner has a future.", author: "Oscar Wilde" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { quote: "Your past doesn't define your paycheck.", author: "Steel Man Resumes" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { quote: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { quote: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Your limitation—it's only your imagination.", author: "Unknown" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { quote: "Great things never come from comfort zones.", author: "Unknown" },
  { quote: "Dream it. Wish it. Do it.", author: "Unknown" },
  { quote: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { quote: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { quote: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { quote: "Dream bigger. Do bigger.", author: "Unknown" },
  { quote: "Don't wait for opportunity. Create it.", author: "Unknown" },
  { quote: "Sometimes later becomes never. Do it now.", author: "Unknown" },
  { quote: "Little things make big days.", author: "Unknown" },
  { quote: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
];

export const FORGE_LOADING_PHASES = [
  "Understanding your experience...",
  "Analyzing your skills for ATS...",
  "Building your job search strategy...",
  "Creating your challenge scripts...",
  "Researching employers in your area...",
  "Combining everything together...",
  "Writing your personalized report...",
];

export const REFINERY_LOADING_PHASES = [
  "Building your resume...",
  "Crafting your cover letter...",
  "Creating your 30-day action plan...",
  "Researching 50 target employers...",
  "Building your web portfolio...",
  "Finalizing barrier strategies...",
  "Packaging everything together...",
];

export const TECH_COMFORT_DESCRIPTIONS = {
  easy: {
    title: "EASY MODE",
    subtitle: "I want step-by-step guidance. Keep it simple. Walk me through everything.",
    bestFor: "First time doing this online",
  },
  comfortable: {
    title: "COMFORTABLE",
    subtitle: "I know my way around. Give me options but don't overwhelm me.",
    bestFor: "Regular computer/phone user",
  },
  master: {
    title: "MASTER",
    subtitle: "I'm tech-savvy. Give me full control and get out of my way.",
    bestFor: "Power users who want maximum flex",
  },
};

export const GOALS_OPTIONS = [
  { id: 'higher_pay', label: 'Higher Pay', icon: '💰', prompt: "What's your target? (e.g., $25/hour, $50k/year)" },
  { id: 'career_growth', label: 'Career Growth', icon: '📈', prompt: "What does growth look like to you?" },
  { id: 'better_benefits', label: 'Better Benefits', icon: '🏥', prompt: "What benefits matter most?" },
  { id: 'get_started', label: 'Get Started Somewhere', icon: '🚀', prompt: "Tell us about your urgency..." },
  { id: 'stability', label: 'Stability', icon: '🏠', prompt: "What does stability mean to you?" },
  { id: 'quick_hire', label: 'Quick Hire', icon: '⚡', prompt: "How soon do you need to start?" },
  { id: 'career_change', label: 'Career Change', icon: '🔄', prompt: "What field are you moving into?" },
  { id: 'specific_role', label: 'Specific Role in Mind', icon: '🎯', prompt: "What role are you targeting?" },
  { id: 'something_else', label: 'Something Else', icon: '➕', prompt: "Tell us more..." },
];

export const CHALLENGES_OPTIONS = [
  { id: 'employment_gap', label: 'Gap in Employment', icon: '📅', prompt: "What happened during this time? (Only what you're comfortable sharing)" },
  { id: 'criminal_background', label: 'Criminal Background', icon: '⚖️', prompt: "Brief context — this helps us craft the right approach" },
  { id: 'recovery_journey', label: 'Recovery Journey', icon: '🔄', prompt: "Where are you in your journey? (Optional)" },
  { id: 'transportation', label: 'Transportation Issues', icon: '🚗', prompt: "What's your situation? (Bus, rides, etc.)" },
  { id: 'job_hopping', label: 'Job Hopping History', icon: '🔀', prompt: "Any context that would help explain the pattern?" },
  { id: 'no_degree', label: 'No Degree', icon: '🎓', prompt: "Tell us about your education background..." },
  { id: 'career_changer', label: 'Career Changer', icon: '🔄', prompt: "What are you transitioning from/to?" },
  { id: 'health_challenges', label: 'Health Challenges', icon: '🏥', prompt: "Anything affecting your work capacity we should know?" },
  { id: 'something_else', label: 'Something Else', icon: '➕', prompt: "Tell us what's on your mind..." },
  { id: 'none', label: 'None of these apply', icon: '✓', prompt: null },
];

export const CONTACT_INFO = {
  phone: '(262) 391-8137',
  email: 'troyrichardcarr@gmail.com',
  owner: 'Troy Richard Carr',
  googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJg2hj1q6qK4gRfAJbz3TVhO4',
};

export const TAGLINES = {
  primary: "Truth. Told Strong.",
  secondary: "Your past doesn't define your paycheck.",
  tertiary: "Built for the workers who build America.",
};

export const API_MODELS = {
  claude: 'claude-sonnet-4-20250514',
  gpt: 'gpt-4o-mini',
  perplexity: 'sonar-pro',
} as const;
