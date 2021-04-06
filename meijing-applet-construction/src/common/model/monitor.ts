
export interface Site {
  id: number;
  code: string;
  location: {
    latitude: number;
    longitude: number;
  };
  name: string;
  siteType: number;
  divisionCode: string;
  divisionName: string;
  address: string;
  examineSite: boolean;
}

interface MonitorData {
  dataTime: Date,
  datas: {
    V_a05024: number,
    V_a21004: number,
    V_a21005: number,
    V_a21026: number,
    V_a34002: number,
    V_a34004: number,
    aqi: number,
    main_pollutants: string[],
  },
  day: number,
  hour: number,
  month: number,
  year: number,
}

export interface SiteMonitorData extends MonitorData {
  siteCode: string
}


export interface DivisionMonitorData extends MonitorData {
  divisionCode: string,
}