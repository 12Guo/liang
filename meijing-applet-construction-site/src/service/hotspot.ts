

import {Coordinate} from '../service/dispatch'
/**
 * 热点
 */
export interface HotspotEntry {
    points: Coordinate[],
    level: number
}

/**
 * 获取所有的省级和市级行政区树
 * @returns 省市级行政区树
 */
export async function getHotspotDatas() {
    return [
        {
            points: [
                {
                    latitude: 35.428346,
                    longitude: 115.948067,
                }, {
                    latitude: 35.428346,
                    longitude: 115.953067,
                }, {
                    latitude: 35.425346,
                    longitude: 115.953067,
                }, {
                    latitude: 35.425346,
                    longitude: 115.948067
                }

            ],
            level: 1
        },
        {
            points: [
                {
                    latitude: 35.433346,
                    longitude: 115.953067,
                }, {
                    latitude: 35.433346,
                    longitude: 115.958067,
                }, {
                    latitude: 35.430346,
                    longitude: 115.958067,
                }, {
                    latitude: 35.430346,
                    longitude: 115.953067
                }

            ],
            level: 3
        },
        {
            points: [
                {
                    latitude: 35.438346,
                    longitude: 115.953067,
                }, {
                    latitude: 35.438346,
                    longitude: 115.958067,
                }, {
                    latitude: 35.435346,
                    longitude: 115.958067,
                }, {
                    latitude: 35.435346,
                    longitude: 115.953067
                }

            ],
            level: 3
        },
        {
            points: [
                {
                    latitude: 35.433346,
                    longitude: 115.958067,
                }, {
                    latitude: 35.433346,
                    longitude: 115.963067,
                }, {
                    latitude: 35.430346,
                    longitude: 115.963067,
                }, {
                    latitude: 35.430346,
                    longitude: 115.958067
                }

            ],
            level: 2
        },
        {
            points: [
                {
                    latitude: 35.428346,
                    longitude: 115.943067,
                }, {
                    latitude: 35.428346,
                    longitude: 115.948067,
                }, {
                    latitude: 35.425346,
                    longitude: 115.948067,
                }, {
                    latitude: 35.425346,
                    longitude: 115.943067
                }

            ],
            level: 3
        },
        {
            points: [
                {
                    latitude: 35.423346,
                    longitude: 115.938067,
                }, {
                    latitude: 35.423346,
                    longitude: 115.943067,
                }, {
                    latitude: 35.420346,
                    longitude: 115.943067,
                }, {
                    latitude: 35.420346,
                    longitude: 115.938067
                }

            ],
            level: 4
        },
        {
            points: [
                {
                    latitude: 35.442446,
                    longitude: 115.942467,
                }, {
                    latitude: 35.442446,
                    longitude: 115.946467,
                }, {
                    latitude: 35.445446,
                    longitude: 115.946467,
                }, {
                    latitude: 35.445446,
                    longitude: 115.942467,
                }

            ],
            level: 1
        },
        {
            points: [
                {
                    latitude: 35.439446,
                    longitude: 115.942467,
                }, {
                    latitude: 35.439446,
                    longitude: 115.946467,
                }, {
                    latitude: 35.442446,
                    longitude: 115.946467,
                }, {
                    latitude: 35.442446,
                    longitude: 115.942467,
                }

            ],
            level: 2
        },
        {
            points: [
                {
                    latitude: 35.439446,
                    longitude: 115.938467,
                }, {
                    latitude: 35.439446,
                    longitude: 115.942467,
                }, {
                    latitude: 35.442446,
                    longitude: 115.942467,
                }, {
                    latitude: 35.442446,
                    longitude: 115.938467,
                }

            ],
            level: 3
        },
    ];
} 