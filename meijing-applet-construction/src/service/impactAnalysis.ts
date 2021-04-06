import Taro from '@tarojs/taro'

export async function getImpactAnalysisResult(divisionCode: string, longitude: number, latitude: number){
    return Taro.request({
        url: `/model-data-service/export/eventAffect`,
        method: 'GET',
        data: {
            lat: latitude,
            lon: longitude,
            areaCode: divisionCode
        }
    });
}