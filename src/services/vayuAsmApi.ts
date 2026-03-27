import { fetchWithCache } from './cache';

// Helper to bypass CORS for public APIs that don't send CORS headers
async function fetchWithCorsProxy(url: string) {
  try {
    // Using codetabs proxy as it's often more reliable and returns raw data
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
    const data = await fetchWithCache(proxyUrl);
    
    // If it's a string (e.g., from a raw proxy), try to parse it
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    }
    
    // Fallback for allorigins if we switch back to it
    if (data && data.contents) {
      return JSON.parse(data.contents);
    }
    
    return data;
  } catch (e) {
    // Silently fail and let the caller handle the fallback
    throw e;
  }
}

/**
 * Cloudflare Radar public internet telemetry and ranking APIs.
 * No API key required. CORS enabled for frontend fetches.
 */
export async function getRadarTopRanking() {
  try {
    return await fetchWithCorsProxy("https://api.cloudflare.com/client/v4/radar/ranking/top");
  } catch (e) {
    // Fallback mock data if API fails
    return {
      result: {
        top_0_to_100: [
          { domain: "google.com", rank: 1 },
          { domain: "cloudflare.com", rank: 2 },
          { domain: "microsoft.com", rank: 3 },
          { domain: "apple.com", rank: 4 },
          { domain: "amazon.com", rank: 5 }
        ]
      }
    };
  }
}

export async function getRadarTrafficAnomalies() {
  try {
    return await fetchWithCorsProxy("https://api.cloudflare.com/client/v4/radar/traffic_anomalies");
  } catch (e) {
    return { result: { anomalies: [] } };
  }
}

/**
 * RIPEstat data API is used for ASN and routing info.
 * Publicly accessible without API keys.
 */
export async function getAsnOverview(asn: number) {
  return await fetchWithCache(
    `https://stat.ripe.net/data/as-overview/data.json?resource=AS${asn}`
  );
}

export async function getPrefixList(asn: number) {
  return await fetchWithCache(
    `https://stat.ripe.net/data/prefix-list/data.json?resource=AS${asn}`
  );
}

export async function getBgpUpdates(asn: number) {
  return await fetchWithCache(
    `https://stat.ripe.net/data/bgp-updates/data.json?resource=AS${asn}`
  );
}

/**
 * BGPView API for comprehensive ASN and prefix data.
 * No API key required.
 */
export async function getBgpViewAsn(asn: number) {
  try {
    return await fetchWithCorsProxy(`https://api.bgpview.io/asn/${asn}`);
  } catch (e) {
    return { status: "error", data: null };
  }
}

export async function getBgpViewPrefixes(asn: number) {
  try {
    return await fetchWithCorsProxy(`https://api.bgpview.io/asn/${asn}/prefixes`);
  } catch (e) {
    return { status: "error", data: null };
  }
}

export async function getBgpViewPeers(asn: number) {
  try {
    return await fetchWithCorsProxy(`https://api.bgpview.io/asn/${asn}/peers`);
  } catch (e) {
    return { status: "error", data: null };
  }
}

/**
 * Threat blocklists from GitHub raw files (Public Datasets).
 */
export async function getFireholBlocklist() {
  return await fetchWithCache(
    "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset"
  );
}

export async function getEmergingThreatsBlocklist() {
  return await fetchWithCache(
    "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/emerging_threats_compromised.ips"
  );
}

/**
 * DNS over HTTPS for DNS resolution & passive discovery.
 */
export async function resolveDns(name: string, type: string = 'A') {
  return await fetchWithCache(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { 'Accept': 'application/dns-json' } }
  );
}

/**
 * Light IP lookup via addr.zone public API.
 */
export async function getIpInfo(ip: string) {
  try {
    return await fetchWithCache(`https://addr.zone/api/${ip}`);
  } catch (e) {
    return null;
  }
}

/**
 * Open Source Threat Intelligence Feeds (IOCs / Indicators)
 */

export async function getThreatFoxFeed() {
  try {
    // ThreatFox JSON feed
    return await fetchWithCorsProxy("https://threatfox.abuse.ch/export/json/recent/");
  } catch (e) {
    return null;
  }
}

export async function getBlocklistDe() {
  try {
    const data = await fetchWithCorsProxy("https://lists.blocklist.de/lists/all.txt");
    return typeof data === 'string' ? data : "";
  } catch (e) {
    return "";
  }
}

export async function getTorExitNodes() {
  try {
    const data = await fetchWithCorsProxy("https://check.torproject.org/torbulkexitlist");
    return typeof data === 'string' ? data : "";
  } catch (e) {
    return "";
  }
}

export async function getBambenekDga() {
  try {
    const data = await fetchWithCorsProxy("https://osint.bambenekconsulting.com/feeds/dga-feed.txt");
    return typeof data === 'string' ? data : "";
  } catch (e) {
    return "";
  }
}

export async function getOpenPhish() {
  try {
    const data = await fetchWithCorsProxy("https://openphish.com/feed.txt");
    return typeof data === 'string' ? data : "";
  } catch (e) {
    return "";
  }
}
