
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface SpeedTestData {
  downloadSpeed: number; // in Mbps
  uploadSpeed: number; // in Mbps
  latency: number; // in ms
}

export interface IpInfo {
  ip: string;
  isp: string;
  city: string;
  country: string;
}

export interface DeviceInfo {
    browser: string;
    os: string;
    osVersion: number | null;
    isHuawei: boolean;
    ram: number | null; // in GB
    cpuCores: number | null;
}

export interface Rating {
    label: string;
    description: string;
    level: 'excellent' | 'good' | 'average' | 'poor' | 'fail';
}

export interface TestResults {
  location?: LocationData & { rating?: Rating };
  speed?: SpeedTestData & { rating?: Rating };
  ipInfo?: IpInfo;
  deviceInfo?: DeviceInfo & { rating?: Rating };
}

export type TestName = 'location' | 'speed' | 'ipInfo' | 'deviceInfo';

export type TestStatus = 'idle' | 'running' | 'completed' | 'failed';

export type TestProgress = {
  [key in TestName]: {
    status: TestStatus;
    error?: string;
  };
};

export interface OverallDiagnosis {
    title: string;
    description: string;
    level: 'good' | 'average' | 'poor';
}