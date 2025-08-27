import { LocationData, SpeedTestData, IpInfo, DeviceInfo } from '../types';

// --- Location Service ---
export const getLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('User denied the request for Geolocation.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable.'));
            break;
          case error.TIMEOUT:
            reject(new Error('The request to get user location timed out.'));
            break;
          default:
            reject(new Error('An unknown error occurred while getting location.'));
            break;
        }
      }
    );
  });
};

// --- IP & ISP Info Service ---
export const getIpInfo = async (): Promise<IpInfo> => {
  try {
    // Switched to ipinfo.io as a more reliable alternative
    const response = await fetch('https://ipinfo.io/json');
    if (!response.ok) {
      throw new Error('Failed to fetch IP information.');
    }
    const data = await response.json();
    return {
      ip: data.ip,
      isp: data.org, // ipinfo.io uses 'org' for the ISP
      city: data.city,
      country: data.country,
    };
  } catch (error) {
    console.error(error);
    throw new Error('Could not retrieve IP information.');
  }
};

// --- Internet Speed Test Service ---
const measureSpeed = async (url: string, sizeInBytes: number, isUpload = false): Promise<number> => {
  const startTime = performance.now();
  
  const options: RequestInit = {};
  if (isUpload) {
    const blob = new Blob([new ArrayBuffer(sizeInBytes)], { type: 'application/octet-stream' });
    options.method = 'POST';
    options.body = blob;
  } else {
    options.cache = 'no-store';
  }

  await fetch(url, options);
  
  const endTime = performance.now();
  const durationInSeconds = (endTime - startTime) / 1000;
  if (durationInSeconds === 0) return Infinity;
  
  const bitsLoaded = sizeInBytes * 8;
  const speedBps = bitsLoaded / durationInSeconds;
  const speedMbps = speedBps / (1024 * 1024);
  
  return speedMbps;
};

const measureLatency = async (url: string): Promise<number> => {
    const startTime = performance.now();
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
    const endTime = performance.now();
    return endTime - startTime;
}

export const runSpeedTest = async (): Promise<SpeedTestData> => {
    // A publicly available file for testing. ~5MB.
    const downloadTestUrl = 'https://cachefly.cachefly.net/5mb.test';
    const downloadFileSize = 5 * 1024 * 1024; // 5MB

    // A public endpoint that accepts POST requests. We send 2MB of data.
    const uploadTestUrl = 'https://httpbin.org/post';
    const uploadFileSize = 2 * 1024 * 1024; // 2MB

    const latencyTestUrl = 'https://www.google.com'; // A reliable, fast server for latency test

    try {
        const pings = await Promise.all([
            measureLatency(latencyTestUrl),
            measureLatency(latencyTestUrl),
            measureLatency(latencyTestUrl)
        ]);
        const avgLatency = pings.reduce((a, b) => a + b, 0) / pings.length;
        
        const downloadSpeed = await measureSpeed(downloadTestUrl, downloadFileSize);
        const uploadSpeed = await measureSpeed(uploadTestUrl, uploadFileSize, true);

        return {
            downloadSpeed: parseFloat(downloadSpeed.toFixed(2)),
            uploadSpeed: parseFloat(uploadSpeed.toFixed(2)),
            latency: parseFloat(avgLatency.toFixed(0))
        };
    } catch (error) {
        console.error("Speed test failed:", error);
        throw new Error('The internet speed test could not be completed.');
    }
};

// --- Device Info Service ---
const getOSVersion = (ua: string, os: string): number | null => {
    try {
        if (os === 'iOS') {
            const match = ua.match(/OS (\d+)_/);
            return match ? parseInt(match[1], 10) : null;
        }
        if (os === 'Android') {
            const match = ua.match(/Android (\d+)/);
            return match ? parseInt(match[1], 10) : null;
        }
        return null;
    } catch {
        return null;
    }
};

export const getDeviceInfo = (): DeviceInfo => {
    const ua = navigator.userAgent;
    let os = "Unknown OS";
    if (ua.indexOf("Win") != -1) os = "Windows";
    if (ua.indexOf("Mac") != -1) os = "MacOS";
    if (ua.indexOf("Linux") != -1) os = "Linux";
    if (ua.indexOf("Android") != -1) os = "Android";
    if (ua.indexOf("like Mac") != -1) os = "iOS";

    let browser = "Unknown Browser";
    if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") == -1) browser = "Chrome";
    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") == -1) browser = "Safari";
    if (ua.indexOf("Edg") > -1) browser = "Edge";

    const osVersion = getOSVersion(ua, os);
    const isHuawei = ua.toLowerCase().includes('huawei');

    // Get hardware info (availability may vary)
    const ram = 'deviceMemory' in navigator ? (navigator as any).deviceMemory : null;
    const cpuCores = 'hardwareConcurrency' in navigator ? navigator.hardwareConcurrency : null;

    return { 
        browser, 
        os,
        osVersion,
        isHuawei,
        ram,
        cpuCores
    };
}