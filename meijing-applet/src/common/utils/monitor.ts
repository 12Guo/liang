export const FACTORS = [
  {
    code: 'aqi',
    fixed: 0,
    dataKey: 'aqi',
    name: 'AQI',
    hourLevelValues: [0, 50, 100, 150, 200, 300, 500],
  },
  {
    code: 'a34004',
    fixed: 0,
    dataKey: 'V_a34004',
    name: 'PM2.5',
    hourLevelValues: [0, 35, 75, 115, 150, 250, 500],
  },
  {
    code: 'a34002',
    fixed: 0,
    dataKey: 'V_a34002',
    name: 'PM10',
    hourLevelValues: [0, 50, 150, 250, 350, 420, 600],
  },
  {
    code: 'a05024',
    fixed: 0,
    dataKey: 'V_a05024',
    name: 'O₃',
    hourLevelValues: [0, 160, 200, 300, 400, 800, 1000],
  },
  {
    code: 'a21004',
    fixed: 0,
    dataKey: 'V_a21004',
    name: 'NO₂',
    hourLevelValues: [0, 100, 200, 700, 1200, 2340, 3090],
  },
  {
    code: 'a21026',
    fixed: 0,
    dataKey: 'V_a21026',
    name: 'SO₂',
    hourLevelValues: [0, 150, 500, 650, 800, 900, 1000],
  },
  {
    code: 'a21005',
    fixed: 1,
    dataKey: 'V_a21005',
    name: 'CO',
    hourLevelValues: [0, 5, 10, 35, 60, 90, 120],
  }
]

//站点类型
export const SITETYPES = [
  {
    id: 0,
    name: "非考核点"
  },
  {
    id: 1,
    name: "考核点"
  }
]

export const LEVELS = [
  {
    color: '#74D05E',
    title: '优',
  }, {
    color: '#FFC70B',
    title: '良',
  }, {
    color: '#FF943B',
    title: '轻度污染',
  }, {
    color: '#E54848',
    title: '中度污染',
  }, {
    color: '#66409A',
    title: '重度污染',
  }, {
    color: '#960531',
    title: '严重污染',
  }
]

export interface AlarmStatus {
  name: string,
  code: string,
}

export interface PollutantCode {
  name: string,
  code: string,
}

export const alarmStatusCodes: AlarmStatus[] = [
  {
    "code": "1",
    "name": "已处置"
  },
  {
    "code": "0",
    "name": "未处置"
  }
];

export const pollutantCodes: PollutantCode[] = [
  {
    "code": "a34004",
    "name": "PM2.5"
  },
  {
    "code": "a34002",
    "name": "PM10"
  },
  {
    "code": "a05024",
    "name": "O₃"
  },
  {
    "code": "a21004",
    "name": "NO₂"
  },
  {
    "code": "a21026",
    "name": "SO₂"
  },
  {
    "code": "a21005",
    "name": "CO"
  }
];


export const getPollutantName = (code: string) => {
  let pollutantCodeArray = pollutantCodes.filter(item => item.code == code);
  return pollutantCodeArray.length > 0 ? pollutantCodeArray[0].name : '';
}


const getFactor = (factorCode: string) => {
  for (const factor of FACTORS) {
    if (factorCode.startsWith("V_")) {
      if (factor.dataKey == factorCode) {
        return factor;
      }
    } else {
      if (factor.code === factorCode) {
        return factor
      }
    }
  }
}

export const getFactorCodeByDataKey = (factorKey: string) => {
  for (const factor of FACTORS) {
    if (factor.dataKey === factorKey) {
      return factor.code
    }
  }
  return ""
}

export const getFactorDataKey = (factorCode: string): string => {
  const factor = getFactor(factorCode)
  if (factor) {
    return factor.dataKey
  } else {
    return factorCode
  }
}

export const formatValue = (factorCode: string, factorValue: any) => {
  if (factorValue == null || factorValue == undefined) {
    return '--'
  }
  const factor = getFactor(factorCode)
  if (factor) {
    return Number(factorValue).toFixed(factor.fixed)
  }
  return Number(factorValue).toFixed(0)
}


export const getHourLevel = (factorCode: string, factorValue: number | undefined) => {
  const factor = getFactor(factorCode)
  if (factorValue == null || factor == null) {
    return -1;
  }
  let level: number = -1;
  for (let index = 0; index < factor.hourLevelValues.length; index++) {
    if (factor.hourLevelValues[index] < Math.floor(factorValue)) {
      level = (index == 0 ? 0 : index);
    } else if (factor.hourLevelValues[index] == Math.floor(factorValue)) {
      level = (index == 0 ? 0 : index - 1);
    }
  }
  return level;
}

export const getValueColor = (factorCode: string, factorValue: number | undefined) => {
  const level = getHourLevel(factorCode, factorValue)
  if (level >= LEVELS.length) {
    return LEVELS[5].color
  }
  if (level >= 0 && level < LEVELS.length) {
    return LEVELS[level].color
  }
  return '#959DAF'
}

export const getHourLevelTitle = (aqi: number | undefined) => {
  if (aqi == null || aqi == undefined) {
    return '--'
  }
  const level = getHourLevel("aqi", aqi);
  if (level >= LEVELS.length) {
    return LEVELS[5].title
  }
  if (level >= 0 && level < LEVELS.length) {
    return LEVELS[level].title
  }
}

export const getFactorNames = (factorCodes: string[]): string[] => {
  const names: string[] = []
  if (factorCodes == null) {
    return names
  }
  for (const code of factorCodes) {
    const factor = getFactor(code.replace("V_", ""))
    if (factor) {
      names.push(factor.name)
    }
  }
  return names
}