import { supabase } from './server/db';
import { fetchScripts } from './scripts';

export interface TestimonialData {
  content: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
  highlight: boolean;
}

const REVIEWS_BY_CATEGORY = {
  COMBAT: [], // Will fallback to GENERAL
  FARMING: [], // Will fallback to GENERAL
  SIMULATOR: [], // Will fallback to GENERAL
  TYCOON: [], // Will fallback to GENERAL
  GENERAL: [
    "This script hub is amazing! Works perfectly on every game I play.",
    "Best investment I've made. The features are super stable.",
    "Updates are always fast and the support is helpful.",
    "I've tried many hubs, but Seisen is by far the smoothest.",
    "Works exactly as described. 10/10 would recommend.",
    "Clean UI and very easy to use. No errors at all.",
    "Security is top notch. I feel safe using this on my main.",
    "Great community and even better scripts. Worth the premium.",
    "Finally a hub that actually delivers what it promises.",
    "The execution is instant and the scripts are very optimized."
  ]
};

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visibleLen = Math.min(3, Math.max(1, Math.floor(name.length / 2)));
  const maskedName = name.substring(0, visibleLen) + '***';
  return `${maskedName}@${domain}`;
}

function maskUsername(username: string): string {
  if (!username || username.length < 3) return username;
  const visibleLen = Math.min(3, Math.max(1, Math.floor(username.length / 2)));
  return username.substring(0, visibleLen) + '***';
}

const POPULAR_GAMES = [
    "Blox Fruits", "Pet Simulator 99", "Da Hood", "Blade Ball", 
    "The Strongest Battlegrounds", "BedWars", "Anime Defenders", 
    "Rivals", "Arsenal", "Murder Mystery 2"
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getScriptCategory(name: string): keyof typeof REVIEWS_BY_CATEGORY {
  const lower = name.toLowerCase();
  
  if (lower.includes('fruit') || lower.includes('blox') || lower.includes('combat') || lower.includes('war') || lower.includes('blade') || lower.includes('fight') || lower.includes('apex') || lower.includes('counter') || lower.includes('rivals') || lower.includes('shot') || lower.includes('gun') || lower.includes('fps') || lower.includes('blue heater')) {
    return 'COMBAT';
  }
  
  if (lower.includes('sim') || lower.includes('clicker') || lower.includes('tap') || lower.includes('legends') || lower.includes('lifting') || lower.includes('strongman') || lower.includes('punch') || lower.includes('run') || lower.includes('race') || lower.includes('hat') || lower.includes('pet') || lower.includes('anime defenders') || lower.includes('dig') || lower.includes('mining') || lower.includes('magnet')) {
    return 'SIMULATOR';
  }

  if (lower.includes('farm') || lower.includes('build') || lower.includes('fish') || lower.includes('plant') || lower.includes('quest') || lower.includes('adventure') || lower.includes('dungeon') || lower.includes('rpg')) {
    return 'FARMING';
  }
  
  if (lower.includes('tycoon') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('pizza') || lower.includes('business')) {
     return 'TYCOON'; 
  }
  
  if (lower.includes('2') || lower.includes('3') || lower.includes('x') || lower.includes('simulator')) {
      return 'SIMULATOR';
  }
  
  return 'GENERAL';
}

const FEATURE_TEMPLATES = [
  "The {feature} is incredibly smooth and reliable.",
  "I love the {feature}, it makes the game so much easier.",
  "Best {feature} I've used. Totally undetectable.",
  "The {feature} works perfectly, exactly what I needed.",
  "Finally a working {feature} that doesn't crash.",
  "Super fast {feature}. I'm progressing way quicker now.",
  "The {feature} is a game changer for me.",
  "Highly recommend for the {feature} alone.",
  "I can't believe how good the {feature} is.",
  "The {feature} logic is improved and works like a charm.",
  "Updates made the {feature} even faster.",
  "Using the {feature} saved me hours of grinding.",
  "The {feature} allows me to AFK with peace of mind.",
  "Incredible speed on the {feature}, unmatched by others.",
  "The {feature} bypass is solid, no bans so far.",
  "Simple and effective {feature}, just 10/10.",
  "Bro the {feature} is actually insane wtf.",
  "Never seen a {feature} work this well before.",
  "The {feature} is just built different.",
  "Seisen's {feature} is on another level.",
  "I've been using the {feature} for 3 days straight lol.",
  "The {feature} update fixed everything, works great.",
  "Legit best {feature} on the market right now.",
  "The {feature} makes farming so satisfying.",
  "Can you add more options to the {feature}? It's so good.",
  "The {feature} is faster than any other hub I tried.",
  "Actually working {feature}, not like the other scams.",
  "The {feature} is exactly what I was looking for.",
  "My friends are jealous of this {feature} haha.",
  "The new {feature} settings are perfect."
];

const GENERIC_REVIEWS = [
    "This script hub is amazing! Works perfectly on every game I play.",
    "Best investment I've made. The features are super stable.",
    "Updates are always fast and the support is helpful.",
    "I've tried many hubs, but Seisen is by far the smoothest.",
    "Works exactly as described. 10/10 would recommend.",
    "Clean UI and very easy to use. No errors at all.",
    "Security is top notch. I feel safe using this on my main.",
    "Great community and even better scripts. Worth the premium.",
    "Finally a hub that actually delivers what it promises.",
    "The execution is instant and the scripts are very optimized.",
    "I've been using this for months without any issues.",
    "Support team solved my key issue in minutes. Great service.",
    "The best premium script for Roblox hands down.",
    "Very reasonable price for the quality you get.",
    "I love how often they add new games to the hub.",
    "Bypasses Byfron perfectly, haven't had any kick issues.",
    "The discord community is super active and helpful.",
    "Setup was a breeze, got my key and started instantly.",
    "No lag, no crashes, just pure performance.",
    "Every update brings something new. Love it.",
    "It's rare to find a dev team this dedicated.",
    "My gaming experience has improved 100x with this.",
    "Safe, reliable, and powerful. What else do you need?",
    "Better than all the other paid scripts I've tried.",
    "The key system is instant, no waiting around.",
    "Legit the only script I trust on my main account.",
    "Performance is buttery smooth even on low end PCs.",
    "Easy to config and save settings for each game.",
    "Just buy it, you won't regret it.",
    "Automates the boring stuff so I can have fun.",
    "W script hub honestly.",
    "Been using since release, never disappointed.",
    "The UI is so clean, reminds me of quality software.",
    "Actually undetectable, been safe for weeks.",
    "Worth every penny just for the auto farm.",
    "Script works flawlessly on mobile too.",
    "Keyless system for premium is a lifesaver.",
    "I was skeptical but this is actually legit.",
    "The community in discord is actually chill.",
    "Admin added my suggestion in like 2 days.",
    "Updating is auto so I don't have to redownload.",
    "Fire scripts fr.",
    "Goated status honestly.",
    "Fastest updates in the game.",
    "I refunded another hub to buy this one lol.",
    "Seisen on top 💯",
    "Don't waste money on pasted scripts, get this.",
    "The bypasses are crazy good.",
    "Customer support is actually human.",
    "Makes the game actually fun again.",
    "Grinding is painless now.",
    "Recommended by a friend, glad I bought it.",
    "The variety of games supported is huge.",
    "Even the free scripts are good, but premium is next level.",
    "Instant key delivery, no ad linkvertise bs for premium.",
    "Smooth execution, 0 fps drops.",
    "Best purchase I've made for Roblox.",
    "They actually listen to feedback.",
    "Simple, effective, powerful.",
    "100% uptime so far."
];

export async function getRecentTestimonials(): Promise<TestimonialData[]> {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('payer_email, tier, created_at, roblox_username')
      .neq('payer_email', 'sb-4328s33649666@personal.example.com') 
      .not('payer_email', 'like', '%@personal.example.com')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    }

    if (!payments || payments.length === 0) {
      return [];
    }

    const scripts = await fetchScripts();
    const scriptNames = scripts.map(s => s.name);
    const scriptFeaturesMap = new Map<string, string[]>();
    scripts.forEach(s => {
        if (s.features && s.features.length > 0) {
            scriptFeaturesMap.set(s.name, s.features);
        }
    });

    // Helper to shuffle array deterministically based on a seed
    const shuffle = (array: any[], seed: number) => {
        let m = array.length, t, i;
        while (m) {
            i = Math.floor(Math.abs(Math.sin(seed + m) * 10000)) % m--;
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }

    // Prepare indices for unique selection
    const genericIndices = Array.from({ length: GENERIC_REVIEWS.length }, (_, i) => i);
    const featureIndices = Array.from({ length: FEATURE_TEMPLATES.length }, (_, i) => i);
    
    // We use the first payment's ID or time as a seed for the "page load" shuffle to keep it consistent but random-looking
    const globalSeed = payments.length > 0 ? hashCode(payments[0].created_at) : Date.now();
    
    shuffle(genericIndices, globalSeed);
    shuffle(featureIndices, globalSeed);

    let genericPointer = 0;
    let featureTemplatePointer = 0;

    return payments
      .filter(p => {
        const hasEmail = p.payer_email && p.payer_email !== 'EMPTY';
        const hasRoblox = !!p.roblox_username;
        return hasEmail || hasRoblox;
      })
      .slice(0, 60) // Get 60 reviews for the carousel
      .map((payment, index) => {
        const seedString = payment.payer_email === 'EMPTY' || !payment.payer_email 
            ? (payment.roblox_username || 'user') 
            : payment.payer_email;
            
        let scriptName = payment.tier;
        
        const lowerTier = scriptName.toLowerCase();
        if (lowerTier.includes('weekly') || lowerTier.includes('monthly') || lowerTier.includes('lifetime') || lowerTier === 'premium') {
             if (scriptNames.length > 0) {
                 const scriptIndex = (hashCode(seedString) + index + hashCode(payment.created_at)) % scriptNames.length;
                 scriptName = scriptNames[scriptIndex];
             } else {
                 const gameIndex = (hashCode(seedString) + index + hashCode(payment.created_at)) % POPULAR_GAMES.length;
                 scriptName = POPULAR_GAMES[gameIndex];
             }
        } else if (!scriptName) {
            if (scriptNames.length > 0) {
                 scriptName = scriptNames[0];
            } else {
                 scriptName = "Blox Fruits"; 
            }
        }
        
        scriptName = scriptName.replace(/\s*script$/i, '').trim();

        // Determine Content
        let content = "";
        const features = scriptFeaturesMap.get(scriptName);
        
        // 70% chance to use a feature-based review if features exist
        const useFeature = features && features.length > 0 && (hashCode(seedString + index) % 10) < 7;
        
        if (useFeature && features) {
            // Pick a random feature
            const featureIndex = (hashCode(seedString) + index) % features.length;
            const feature = features[featureIndex];
            
            // Pick a UNIQUE template
            const templateIndex = featureIndices[featureTemplatePointer % featureIndices.length];
            featureTemplatePointer++;
            
            content = FEATURE_TEMPLATES[templateIndex].replace('{feature}', feature);
        } else {
            // Pick a UNIQUE generic review
            const reviewIndex = genericIndices[genericPointer % genericIndices.length];
            genericPointer++;
            
            content = GENERIC_REVIEWS[reviewIndex];
        }

        let authorName = 'Verified User';
        if (payment.roblox_username) {
            authorName = maskUsername(payment.roblox_username);
        } else if (payment.payer_email && payment.payer_email !== 'EMPTY') {
            authorName = maskEmail(payment.payer_email);
        }

        return {
          content: content,
          author: authorName,
          role: scriptName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedString}`,
          rating: 5,
          highlight: false 
        };
      });

  } catch (error) {
    console.error('Unexpected error fetching testimonials:', error);
    return [];
  }
}
