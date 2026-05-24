export interface CatalogEntry {
  id: string;
  /** Common abbreviation (BRT, JST, GMT…). */
  name: string;
  /** City + country. */
  loc: string;
  /** IANA tz database key, used for offset/DST lookup. */
  iana: string;
}

/** Curated timezone catalog. Order roughly west-to-east. */
export const CATALOG: CatalogEntry[] = [
  { id: 'America/Sao_Paulo', name: 'BRT', loc: 'São Paulo, Brazil', iana: 'America/Sao_Paulo' },
  { id: 'America/New_York', name: 'ET', loc: 'New York, USA', iana: 'America/New_York' },
  { id: 'America/Chicago', name: 'CT', loc: 'Chicago, USA', iana: 'America/Chicago' },
  { id: 'America/Denver', name: 'MT', loc: 'Denver, USA', iana: 'America/Denver' },
  { id: 'America/Los_Angeles', name: 'PT', loc: 'Los Angeles, USA', iana: 'America/Los_Angeles' },
  { id: 'America/Mexico_City', name: 'CST', loc: 'Mexico City, Mexico', iana: 'America/Mexico_City' },
  {
    id: 'America/Argentina/Buenos_Aires',
    name: 'ART',
    loc: 'Buenos Aires, Argentina',
    iana: 'America/Argentina/Buenos_Aires'
  },
  { id: 'America/Santiago', name: 'CLT', loc: 'Santiago, Chile', iana: 'America/Santiago' },
  { id: 'America/Bogota', name: 'COT', loc: 'Bogotá, Colombia', iana: 'America/Bogota' },
  { id: 'America/Anchorage', name: 'AKT', loc: 'Anchorage, USA', iana: 'America/Anchorage' },
  { id: 'Pacific/Honolulu', name: 'HST', loc: 'Honolulu, USA', iana: 'Pacific/Honolulu' },
  { id: 'Europe/London', name: 'GMT', loc: 'London, UK', iana: 'Europe/London' },
  { id: 'Europe/Paris', name: 'CET', loc: 'Paris, France', iana: 'Europe/Paris' },
  { id: 'Europe/Berlin', name: 'CET', loc: 'Berlin, Germany', iana: 'Europe/Berlin' },
  { id: 'Europe/Madrid', name: 'CET', loc: 'Madrid, Spain', iana: 'Europe/Madrid' },
  { id: 'Europe/Rome', name: 'CET', loc: 'Rome, Italy', iana: 'Europe/Rome' },
  { id: 'Europe/Moscow', name: 'MSK', loc: 'Moscow, Russia', iana: 'Europe/Moscow' },
  { id: 'Europe/Istanbul', name: 'TRT', loc: 'Istanbul, Turkey', iana: 'Europe/Istanbul' },
  { id: 'Europe/Athens', name: 'EET', loc: 'Athens, Greece', iana: 'Europe/Athens' },
  { id: 'Africa/Cairo', name: 'EET', loc: 'Cairo, Egypt', iana: 'Africa/Cairo' },
  { id: 'Africa/Johannesburg', name: 'SAST', loc: 'Johannesburg, S. Africa', iana: 'Africa/Johannesburg' },
  { id: 'Africa/Lagos', name: 'WAT', loc: 'Lagos, Nigeria', iana: 'Africa/Lagos' },
  { id: 'Asia/Dubai', name: 'GST', loc: 'Dubai, UAE', iana: 'Asia/Dubai' },
  { id: 'Asia/Tehran', name: 'IRST', loc: 'Tehran, Iran', iana: 'Asia/Tehran' },
  { id: 'Asia/Karachi', name: 'PKT', loc: 'Karachi, Pakistan', iana: 'Asia/Karachi' },
  { id: 'Asia/Kolkata', name: 'IST', loc: 'India', iana: 'Asia/Kolkata' },
  { id: 'Asia/Bangkok', name: 'ICT', loc: 'Bangkok, Thailand', iana: 'Asia/Bangkok' },
  { id: 'Asia/Singapore', name: 'SGT', loc: 'Singapore', iana: 'Asia/Singapore' },
  { id: 'Asia/Shanghai', name: 'CST', loc: 'China', iana: 'Asia/Shanghai' },
  { id: 'Asia/Hong_Kong', name: 'HKT', loc: 'Hong Kong', iana: 'Asia/Hong_Kong' },
  { id: 'Asia/Manila', name: 'PHT', loc: 'Manila, Philippines', iana: 'Asia/Manila' },
  { id: 'Asia/Taipei', name: 'TST', loc: 'Taipei, Taiwan', iana: 'Asia/Taipei' },
  { id: 'Asia/Seoul', name: 'KST', loc: 'Seoul, S. Korea', iana: 'Asia/Seoul' },
  { id: 'Asia/Tokyo', name: 'JST', loc: 'Tokyo, Japan', iana: 'Asia/Tokyo' },
  { id: 'Australia/Perth', name: 'AWST', loc: 'Perth, Australia', iana: 'Australia/Perth' },
  { id: 'Australia/Sydney', name: 'AEDT', loc: 'Sydney, Australia', iana: 'Australia/Sydney' },
  { id: 'Pacific/Auckland', name: 'NZDT', loc: 'Auckland, NZ', iana: 'Pacific/Auckland' }
];
