import dns from 'dns/promises';
import { SSRFError } from '../errors';

// Private IP ranges (RFC 1918, RFC 4193, localhost, link-local)
const PRIVATE_IP_PATTERNS = [
  /^127\./, // 127.0.0.0/8
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^169\.254\./, // 169.254.0.0/16 (link-local)
  /^::1$/, // IPv6 localhost
  /^fc00:/, // IPv6 private (RFC 4193)
  /^fe80:/, // IPv6 link-local
];

export async function validateUrlForSSRF(urlString: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch (error) {
    throw new SSRFError('Invalid URL format');
  }

  // Only allow http and https
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new SSRFError('Only HTTP and HTTPS protocols are allowed');
  }

  // Resolve hostname to IPs
  let addresses: string[];
  try {
    addresses = await dns.resolve4(url.hostname).catch(() => []);
    const ipv6Addresses = await dns.resolve6(url.hostname).catch(() => []);
    addresses = [...addresses, ...ipv6Addresses];
  } catch (error) {
    throw new SSRFError(`Failed to resolve hostname: ${url.hostname}`);
  }

  if (addresses.length === 0) {
    throw new SSRFError(`Could not resolve hostname: ${url.hostname}`);
  }

  // Check all resolved IPs against private ranges
  for (const ip of addresses) {
    if (isPrivateIP(ip)) {
      throw new SSRFError(`Target IP ${ip} is in a private/local range`);
    }
  }

  // Additional check: block localhost hostnames
  const hostnameLower = url.hostname.toLowerCase();
  if (
    hostnameLower === 'localhost' ||
    hostnameLower.endsWith('.localhost') ||
    hostnameLower === '127.0.0.1' ||
    hostnameLower === '::1'
  ) {
    throw new SSRFError('Localhost hostnames are not allowed');
  }
}

function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}
