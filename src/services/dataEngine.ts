import { VayuEvent } from '../types';
import { getBgpUpdates, getAsnOverview, getFireholBlocklist } from './vayuAsmApi';

// Mock data generator for initial development while APIs are being wired
export const generateMockEvents = (count: number): VayuEvent[] => {
  const categories: VayuEvent['category'][] = ["traffic", "attack", "bgp", "dns", "osint", "deception"];
  const countries = ["US", "CN", "RU", "GB", "DE", "FR", "JP", "BR", "IN", "AU"];
  
  return Array.from({ length: count }).map((_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const hasTarget = category === "attack" || category === "deception" || Math.random() > 0.7;
    
    // Advanced Correlation: Increase severity for certain patterns
    let severity = Math.floor(Math.random() * 6) + 2; // Base 2-7
    if (category === "attack") severity += 2;
    if (Math.random() > 0.9) severity = 10; // Critical anomaly
    
    return {
      id: `evt-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now() - Math.random() * 3600000,
      category,
      severity,
      source: {
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        asn: Math.floor(Math.random() * 65535),
        country: countries[Math.floor(Math.random() * countries.length)],
        lat: (Math.random() * 180) - 90,
        lon: (Math.random() * 360) - 180,
      },
      target: hasTarget ? {
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        asn: Math.floor(Math.random() * 65535),
        country: countries[Math.floor(Math.random() * countries.length)],
        lat: (Math.random() * 180) - 90,
        lon: (Math.random() * 360) - 180,
      } : undefined,
      metrics: {
        volume: Math.random() * 1000,
        requests: Math.floor(Math.random() * 10000),
        latency: Math.floor(Math.random() * 200),
        packetLoss: Math.random() * 5,
      },
      tags: [category, "live-feed", severity >= 8 ? "critical" : "stable", "shadow-dragon-fusion"],
      description: generateDescription(category, severity),
      type: category.toUpperCase(),
      metadata: generateMetadata(category)
    };
  });
};

const generateMetadata = (category: string) => {
  switch(category) {
    case 'bgp': return {
      prefix: `${Math.floor(Math.random() * 223)}.${Math.floor(Math.random() * 255)}.0.0/16`,
      origin: `AS${Math.floor(Math.random() * 65000)}`,
      path: [Math.floor(Math.random() * 65000), Math.floor(Math.random() * 65000), Math.floor(Math.random() * 65000)],
      status: Math.random() > 0.8 ? "HIJACKED" : "STABLE"
    };
    case 'attack': return {
      vector: ["UDP Flood", "TCP SYN", "HTTP GET", "DNS Amplification", "ICMP Flood", "Slowloris"][Math.floor(Math.random() * 6)],
      target_port: [80, 443, 53, 22, 3389, 8080][Math.floor(Math.random() * 6)],
      botnet_id: ["MIRAI-V2", "GAFGYT", "REAPER", "MOZI"][Math.floor(Math.random() * 4)],
      threat_actor: ["APT28", "Lazarus", "Fancy Bear", "Sandworm"][Math.floor(Math.random() * 4)]
    };
    case 'osint': 
      const sources = ["Shadow Dragon OIM", "Malcore Analysis", "URLhaus", "ThreatFox", "CISA KEV", "CIRCL CVE"];
      const types = ["Identity Pivot", "Infrastructure Link", "Credential Leak", "Malicious URL", "Exploited Vulnerability", "Botnet IOC"];
      const sourceIdx = Math.floor(Math.random() * sources.length);
      return {
        source: sources[sourceIdx],
        confidence: Math.random() * 0.4 + 0.6, // 0.6 - 1.0
        correlation_id: `INTEL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        intel_type: types[sourceIdx] || types[0]
      };
    default: return {};
  }
};

const generateDescription = (category: string, severity: number): string => {
  const attackTypes = ["DDoS Volumetric", "SQL Injection Attempt", "Botnet C2 Beacon", "Brute Force Auth", "Zero-day Exploit Probe"];
  const bgpTypes = ["Route Leak", "Prefix Hijack", "Path Prepending", "BGP Flap", "AS-Path Inconsistency"];
  const deceptionTypes = ["Honeypot Interaction", "Decoy Network Scan", "Simulated Data Exfiltration", "Fake Service Probe"];
  const trafficTypes = ["Sudden Traffic Spike", "Global Latency Increase", "Packet Loss Anomaly", "Tier-1 Congestion"];
  const osintTypes = ["Shadow Dragon Identity Pivot", "Malcore Malware Detection", "URLhaus Malicious URL", "ThreatFox Botnet IOC", "CISA KEV Match", "CIRCL CVE Vulnerability"];

  let desc = "";
  switch(category) {
    case 'attack': desc = `${attackTypes[Math.floor(Math.random() * attackTypes.length)]} detected from AS${Math.floor(Math.random() * 65000)}`; break;
    case 'bgp': desc = `${bgpTypes[Math.floor(Math.random() * bgpTypes.length)]} on AS${Math.floor(Math.random() * 65000)} affecting global reachability`; break;
    case 'deception': desc = `${deceptionTypes[Math.floor(Math.random() * deceptionTypes.length)]} in EU-West-1 decoy cluster`; break;
    case 'traffic': desc = `${trafficTypes[Math.floor(Math.random() * trafficTypes.length)]} across backbone nodes`; break;
    case 'osint': 
      const osintType = osintTypes[Math.floor(Math.random() * osintTypes.length)];
      desc = `${osintType} - High confidence match from OSINT Intelligence Matrix`; 
      break;
    default: desc = "Routine telemetry heartbeat received from global edge node"; break;
  }

  if (severity >= 8) {
    desc = `[CRITICAL] ${desc}`;
  }
  return desc;
};

// Real-world public data integration
export const fetchRealTimeBgp = async (asn: number = 3333) => {
  try {
    const data = await getBgpUpdates(asn);
    return data?.data?.updates || [];
  } catch (e) {
    // Silently return empty array on failure
    return [];
  }
};

export const fetchPublicBlocklist = async () => {
  try {
    const data = await getFireholBlocklist();
    return typeof data === 'string' ? data.split('\n').filter(l => !l.startsWith('#') && l.trim() !== '') : [];
  } catch (e) {
    // Silently return empty array on failure
    return [];
  }
};
