import { observable, action, computed } from 'mobx'
import Taro from '@tarojs/taro'

export interface SystemInfo {
    model: string,
    windowWidth: number,
    windowHeight: number,
    system: string,
    screenWidth: number,
    screenHeight: number,
    statusBarHeight: number
}

export class SystemInfoStore {
    @observable systemInfo: SystemInfo;

    @action load = () => {
        let _this = this;
        Taro.getSystemInfo({
            success(res) {
                _this.systemInfo = res
                Taro.setStorageSync('systemInfo', this.res)
            }
        })
    }

    @computed get getSystemInfo() {
        return this.systemInfo
    }

    @computed get getTabbarHeight() {
        let systemInfo = this.systemInfo;
        // px转换到rpx的比例
        let pxToRpxScale = 750 / systemInfo.windowWidth;
        // 状态栏的高度
        let ktxStatusHeight = systemInfo.statusBarHeight * pxToRpxScale
        // 导航栏的高度
        let navigationHeight = 44 * pxToRpxScale
        // window的宽度
        let ktxWindowWidth = systemInfo.windowWidth * pxToRpxScale
        // window的高度
        let ktxWindowHeight = systemInfo.windowHeight * pxToRpxScale
        // 屏幕的高度
        let ktxScreentHeight = systemInfo.screenHeight * pxToRpxScale
        // 底部tabBar的高度
        let tabBarHeight = ktxScreentHeight - ktxStatusHeight - navigationHeight - ktxWindowHeight

        return tabBarHeight;
    }
}

export default new SystemInfoStore()