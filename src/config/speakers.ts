export interface SpeakerInfo {
  name: string;
  role: string;
}

export type SpeakerMapping = Record<string, SpeakerInfo>;

const SPEAKER_MAPPING: SpeakerMapping = {
  'mayor': { name: 'Patrick Taran', role: 'Mayor' },
  'councillor miller': { name: 'Mark Miller', role: 'Councillor' },
  'councillor warren': { name: 'Melinda Warren', role: 'Councillor' },
  'councillor fuel': { name: 'Glenn Fuel', role: 'Councillor' },
  'councillor kaczynski': { name: 'Andy Kaczynski', role: 'Councillor' },
  'ceo': { name: 'CEO', role: 'Staff' },
  'cfo': { name: 'CFO', role: 'Staff' },
  'clerk': { name: 'Clerk', role: 'Staff' },
};

export default SPEAKER_MAPPING;
