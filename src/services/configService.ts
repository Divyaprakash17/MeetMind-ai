export interface SpeakerInfo {
  name: string;
  role: string;
  aliases?: string[]; // Add aliases for name variations
}

export type SpeakerMapping = Record<string, SpeakerInfo>;

let speakerCache: SpeakerMapping | null = null;

// Normalize names for matching
const normalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')         // Normalize spaces
    .trim();
};

export const loadSpeakerConfig = async (): Promise<SpeakerMapping> => {
  if (speakerCache) {
    return speakerCache;
  }

  try {
    const response = await fetch('/config/speakers.json');
    if (!response.ok) {
      throw new Error(`Failed to load speaker config: ${response.statusText}`);
    }
    
    const config = await response.json();
    
    // Process the config to add normalized names and aliases
    const processedConfig: SpeakerMapping = {};
    
    for (const [key, data] of Object.entries(config)) {
      const speaker = data as SpeakerInfo;
      const normalizedKey = normalizeName(key);
      
      // Add the main entry
      processedConfig[normalizedKey] = {
        ...speaker,
        aliases: [normalizedKey, ...(speaker.aliases || [])]
      };
      
      // Add name and role as aliases
      if (speaker.name) {
        const normalizedName = normalizeName(speaker.name);
        if (normalizedName !== normalizedKey) {
          processedConfig[normalizedName] = processedConfig[normalizedKey];
        }
      }
      
      // Add role as an alias
      const normalizedRole = normalizeName(speaker.role);
      if (normalizedRole && normalizedRole !== normalizedKey && normalizedRole !== normalizeName(speaker.name)) {
        processedConfig[normalizedRole] = processedConfig[normalizedKey];
      }
    }
    
    speakerCache = processedConfig;
    return speakerCache;
  } catch (error) {
    console.error('Error loading speaker configuration:', error);
    return {};
  }
};

// Preload the config when the module loads
let speakerConfig = loadSpeakerConfig();

export const getSpeakerConfig = async (): Promise<SpeakerMapping> => {
  return speakerConfig;
};

export const getSpeakerInfo = async (key: string): Promise<SpeakerInfo> => {
  if (!key) return { name: 'Unknown', role: 'Participant' };
  
  const config = await speakerConfig;
  const normalizedKey = normalizeName(key);
  
  // Exact match
  if (config[normalizedKey]) {
    return config[normalizedKey];
  }
  
  // Check for partial matches
  for (const [speakerKey, speaker] of Object.entries(config)) {
    const speakerData = speaker as SpeakerInfo;
    const aliases = [speakerKey, ...(speakerData.aliases || [])];
    
    if (aliases.some(alias => 
      normalizedKey.includes(normalizeName(alias)) || 
      normalizeName(alias).includes(normalizedKey)
    )) {
      return speakerData;
    }
  }
  
  // Check for role matches
  for (const speaker of Object.values(config)) {
    if (normalizeName(speaker.role) === normalizedKey) {
      return speaker;
    }
  }
  
  // Default fallback
  return { 
    name: key.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '),
    role: 'Participant' 
  };
};
