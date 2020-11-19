import axios from 'axios';

/**
 * The full API responses from `ipinfo.io` for an example IP address, not
 * including the asn object that's included in the standard plan, and the
 * company and carrier objects that are included in the pro plan.
 * @see {@link https://ipinfo.io/developers/responses#full-response}
 */
interface IPInfo {
  ip: string;
  hostname: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  postal: string;
  timezone: string;
  privacy: {
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
    hosting: boolean;
  };
}

/**
 * Returns a string representing the user's location (determined by their IP
 * address using IPInfo).
 * @see {@link https://github.com/ipinfo/node}
 * @see {@link https://ipinfo.io/developers#ip-address-parameter}
 */
export default async function getLocation(): Promise<string> {
  const {
    data: { city, region, country },
  } = await axios.get<IPInfo>(
    `https://ipinfo.io/json?token=${
      process.env.NEXT_PUBLIC_IP_INFO_TOKEN as string
    }`
  );
  return `${city}, ${region}, ${country}`;
}
