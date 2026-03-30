import { VayuEvent } from '../types';
import { fetchWithCache } from './cache';

export interface CVE {
  id: string;
  summary: string;
  cvss: number | null;
  published: string;
  references: string[];
}

export interface MaliciousURL {
  id: string;
  url: string;
  status: string;
  threat: string;
  tags: string[];
  dateadded: string;
}

export interface CisaKev {
  id: string;
  vendor: string;
  product: string;
  name: string;
  dateAdded: string;
  description: string;
  action: string;
}

export interface ThreatFoxIOC {
  id: string;
  ioc: string;
  type: string;
  threat: string;
  confidence: number;
  firstSeen: string;
  reporter: string;
}

export interface SSLBlacklistIP {
  ip: string;
  port: string;
  reason: string;
}

export interface FeodoIP {
  ip: string;
  firstSeen: string;
  lastSeen: string;
  malware: string;
}

export interface OpenPhishURL {
  url: string;
}

export interface BGPInfo {
  ip: string;
  asn: number;
  name: string;
  description: string;
  country: string;
}

export class OSINTService {
  private static CVE_API = "https://cve.circl.lu/api/last"; // Fixed endpoint
  private static URLHAUS_CSV = "https://urlhaus.abuse.ch/downloads/csv_recent/";
  private static CISA_KEV = "https://www.cisa.gov/sites/default/files/csv/known_exploited_vulnerabilities.csv";
  private static THREATFOX_RECENT = "https://threatfox.abuse.ch/export/json/recent/";
  private static SSL_BLACKLIST = "https://sslbl.abuse.ch/blacklist/sslipblacklist.csv";
  private static FEODO_TRACKER = "https://feodotracker.abuse.ch/downloads/ipblocklist.csv";
  private static OPENPHISH_FEED = "https://openphish.com/feed.txt";
  private static BGPVIEW_IP = "https://api.bgpview.io/ip/";

  // Robust CORS proxy wrapper
  private static async fetchViaProxy(url: string, isJson: boolean = false): Promise<any> {
    const proxies = [
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    let lastError = null;
    for (const proxy of proxies) {
      try {
        const data = await fetchWithCache(proxy);
        if (data) {
          if (isJson && typeof data === 'string') {
            try {
              return JSON.parse(data);
            } catch (e) {
              // If it fails to parse, it might not be JSON, but we return it anyway
              return data;
            }
          }
          return data;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Proxy ${proxy} failed for ${url}, trying next...`);
        continue;
      }
    }
    
    console.error(`All proxies failed for ${url}`, lastError);
    throw new Error(`Failed to fetch from ${url} via all proxies`);
  }

  static async fetchLatestCVEs(): Promise<CVE[]> {
    try {
      const data = await this.fetchViaProxy(this.CVE_API, true);
      
      const items = Array.isArray(data) ? data : (data?.results || []);
      return items.slice(0, 100).map((item: any) => ({
        id: item.id,
        summary: item.summary,
        cvss: item.cvss || null,
        published: item.Published,
        references: item.references || []
      }));
    } catch (error) {
      console.error("Failed to fetch CVEs:", error);
      return [];
    }
  }

  static async fetchMaliciousURLs(): Promise<MaliciousURL[]> {
    try {
      const text = await this.fetchViaProxy(this.URLHAUS_CSV, false);
      if (typeof text !== 'string') return [];
      
      const lines = text.trim().split("\n").filter((l: string) => !l.startsWith("#"));
      return lines.slice(1, 100).map((line: string) => {
        const cols = line.split('","').map(c => c.replace(/"/g, ''));
        return {
          id: cols[0],
          dateadded: cols[1],
          url: cols[2],
          status: cols[3],
          threat: cols[4],
          tags: cols[5] ? cols[5].split(',') : [],
        };
      }).filter((item: any) => item.url);
    } catch (error) {
      console.error("Failed to fetch URLhaus feed:", error);
      return [];
    }
  }

  static async fetchCisaKev(): Promise<CisaKev[]> {
    try {
      const text = await this.fetchViaProxy(this.CISA_KEV, false);
      if (typeof text !== 'string') return [];

      const lines = text.trim().split("\n");
      return lines.slice(1, 100).map((line: string) => {
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        return {
          id: cols[0]?.replace(/"/g, ''),
          vendor: cols[1]?.replace(/"/g, ''),
          product: cols[2]?.replace(/"/g, ''),
          name: cols[3]?.replace(/"/g, ''),
          dateAdded: cols[4]?.replace(/"/g, ''),
          description: cols[5]?.replace(/"/g, ''),
          action: cols[6]?.replace(/"/g, ''),
        };
      }).filter((item: any) => item.id && item.id.startsWith('CVE-'));
    } catch (error) {
      console.error("Failed to fetch CISA KEV:", error);
      return [];
    }
  }

  static async fetchThreatFox(): Promise<ThreatFoxIOC[]> {
    try {
      const data = await this.fetchViaProxy(this.THREATFOX_RECENT, true);
      
      let items: any[] = [];
      if (data && typeof data === 'object') {
        // ThreatFox /export/json/recent/ returns an object where keys are IDs and values are arrays of IOC objects
        items = Object.values(data).map((arr: any) => arr[0]).filter(Boolean);
      }
      
      return items.slice(0, 100).map((item: any) => ({
        id: item.id || Math.random().toString(36).substring(7),
        ioc: item.ioc_value || item.ioc || 'Unknown',
        type: item.ioc_type || 'Unknown',
        threat: item.threat_type || 'Unknown',
        confidence: item.confidence_level || 0,
        firstSeen: item.first_seen_utc || item.first_seen || new Date().toISOString(),
        reporter: item.reporter || 'Unknown'
      }));
    } catch (error) {
      console.error("Failed to fetch ThreatFox:", error);
      return [];
    }
  }

  static async fetchSSLBlacklist(): Promise<SSLBlacklistIP[]> {
    try {
      const text = await this.fetchViaProxy(this.SSL_BLACKLIST, false);
      if (typeof text !== 'string') return [];

      const lines = text.trim().split("\n").filter((l: string) => !l.startsWith("#"));
      return lines.slice(0, 100).map((line: string) => {
        const cols = line.split(",");
        return {
          ip: cols[0],
          port: cols[1],
          reason: cols[2]
        };
      }).filter((item: any) => item.ip);
    } catch (error) {
      console.error("Failed to fetch SSL Blacklist:", error);
      return [];
    }
  }

  static async fetchFeodoTracker(): Promise<FeodoIP[]> {
    try {
      const text = await this.fetchViaProxy(this.FEODO_TRACKER, false);
      if (typeof text !== 'string') return [];

      const lines = text.trim().split("\n").filter((l: string) => !l.startsWith("#"));
      return lines.slice(1, 100).map((line: string) => {
        const cols = line.split(",");
        return {
          firstSeen: cols[0],
          ip: cols[1],
          lastSeen: cols[4],
          malware: cols[5]
        };
      }).filter((item: any) => item.ip);
    } catch (error) {
      console.error("Failed to fetch Feodo Tracker:", error);
      return [];
    }
  }

  static async fetchOpenPhish(): Promise<OpenPhishURL[]> {
    try {
      const text = await this.fetchViaProxy(this.OPENPHISH_FEED, false);
      if (typeof text !== 'string') return [];
      
      const lines = text.trim().split("\n");
      return lines.slice(0, 100).map((url: string) => ({ url }));
    } catch (error) {
      console.error("Failed to fetch OpenPhish:", error);
      return [];
    }
  }

  static async fetchBGPInfo(ip: string): Promise<BGPInfo | null> {
    try {
      // Basic IP validation
      if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) return null;
      
      const data = await this.fetchViaProxy(`${this.BGPVIEW_IP}${ip}`, true);
      if (data && data.status === "ok" && data.data?.prefixes?.length > 0) {
        const prefix = data.data.prefixes[0];
        return {
          ip,
          asn: prefix.asn.asn,
          name: prefix.asn.name,
          description: prefix.asn.description,
          country: prefix.asn.country_code
        };
      }
      return null;
    } catch (error: any) {
      if (error.message.includes('403')) {
        console.warn(`BGPView API returned 403 for ${ip}. Skipping.`);
      } else {
        console.error(`Failed to fetch BGP info for ${ip}:`, error);
      }
      return null;
    }
  }

  static correlateAssets(
    assets: string[], 
    urls: MaliciousURL[], 
    cves: CVE[], 
    kev: CisaKev[], 
    iocs: ThreatFoxIOC[], 
    ssl: SSLBlacklistIP[],
    feodo: FeodoIP[],
    openphish: OpenPhishURL[]
  ) {
    const assetMatches = assets.map(asset => {
      const assetLower = asset.toLowerCase();
      const matches: any[] = [];
      let riskScore = 0;

      // Check URLs (Phishing/Malware) - High Risk
      const urlMatch = urls.filter(u => u.url && u.url.toLowerCase().includes(assetLower));
      if (urlMatch.length > 0) {
        riskScore += Math.min(urlMatch.length * 15, 40);
        matches.push(...urlMatch.map(m => ({ type: 'Malicious URL', source: 'URLHaus', details: m.threat, score: 30 })));
      }

      // Check CVEs (Vulnerabilities) - Medium Risk
      const cveMatch = cves.filter(c => c.summary && c.summary.toLowerCase().includes(assetLower));
      if (cveMatch.length > 0) {
        riskScore += Math.min(cveMatch.length * 10, 30);
        matches.push(...cveMatch.map(m => ({ type: 'Vulnerability', source: 'CIRCL CVE', details: m.id, score: 20 })));
      }

      // Check KEV (Known Exploited) - Critical Risk
      const kevMatch = kev.filter(k => 
        (k.vendor && k.vendor.toLowerCase().includes(assetLower)) || 
        (k.product && k.product.toLowerCase().includes(assetLower)) ||
        (k.description && k.description.toLowerCase().includes(assetLower))
      );
      if (kevMatch.length > 0) {
        riskScore += 50;
        matches.push(...kevMatch.map(m => ({ type: 'Exploited Vuln', source: 'CISA KEV', details: m.id, score: 50 })));
      }

      // Check IOCs (Threat Intelligence) - High Risk
      const iocMatch = iocs.filter(i => i.ioc && i.ioc.toLowerCase().includes(assetLower));
      if (iocMatch.length > 0) {
        riskScore += 40;
        matches.push(...iocMatch.map(m => ({ type: 'IOC Match', source: 'ThreatFox', details: m.threat, score: 40 })));
      }

      // Check SSL Blacklist - Medium Risk
      const sslMatch = ssl.filter(s => s.ip?.includes(asset));
      if (sslMatch.length > 0) {
        riskScore += 25;
        matches.push(...sslMatch.map(m => ({ type: 'SSL Blacklist', source: 'SSLBL', details: m.reason, score: 25 })));
      }

      // Check Feodo (C2) - Critical Risk
      const feodoMatch = feodo.filter(f => f.ip?.includes(asset));
      if (feodoMatch.length > 0) {
        riskScore += 60;
        matches.push(...feodoMatch.map(m => ({ type: 'C2 Infrastructure', source: 'FeodoTracker', details: m.malware, score: 60 })));
      }

      // Check OpenPhish - High Risk
      const openphishMatch = openphish.filter(o => o.url && o.url.toLowerCase().includes(assetLower));
      if (openphishMatch.length > 0) {
        riskScore += 35;
        matches.push(...openphishMatch.map(m => ({ type: 'Phishing Target', source: 'OpenPhish', details: 'Active phishing campaign', score: 35 })));
      }

      return {
        asset,
        riskScore: Math.min(riskScore, 100),
        matches: Array.from(new Set(matches.map(m => JSON.stringify(m)))).map(s => JSON.parse(s))
      };
    });

    const allMatches = assetMatches.flatMap(am => am.matches.map(m => ({ ...m, asset: am.asset })));
    const avgRiskScore = assetMatches.length > 0 
      ? Math.round(assetMatches.reduce((acc, curr) => acc + curr.riskScore, 0) / assetMatches.length)
      : 0;

    return {
      assetMatches,
      allMatches,
      avgRiskScore,
      totalExposures: allMatches.length
    };
  }
}
