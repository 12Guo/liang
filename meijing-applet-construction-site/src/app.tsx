//@ts-ignore
import uma from './uma';
import Taro, { Component, Config } from "@tarojs/taro";
import { Provider } from "@tarojs/mobx";
import "@tarojs/async-await";

import Login from "./pages/login/login";
import userStore from "@common/store/user";
import systemInfoStore from "@common/store/systeminfo";
import dispatchStore from "./store/dispatch";

import "./app.scss";
import "@common/utils/requests";

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

const store = {
  userStore,
  systemInfoStore,
  dispatchStore
};
//@ts-ignore
Taro.uma = uma;

class App extends Component {
  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    pages: [
      "common/pages/welcome/index",
      "pages/index/index",
      "pages/workbench/index",
      "pages/department_select/index",
      "pages/my_new/index",
      "pages/person/index",
      "pages/impact_analysis/index",
      "pages/webview/index"
    ],
    subPackages: [
      {
        root: "pages/device",
        name: "device",
        pages: [
          "video",
          "snapshot",
          "detail",
          "nodata"
        ]
      },
      {
        root: "pages/user_join",
        name: "user_join",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/login",
        name: "login",
        pages: [
          "login",
          "phoneLogin",
        ]
      },
      {
        root: "pages/user_request_verify",
        name: "user_request_verify",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/user_join_success",
        name: "user_join_success",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/user_construction",
        name: "user_construction",
        pages: ["index", "search"]
      },
      {
        root: "pages/work_options",
        name: "work_options",
        pages: ["contentUpdate", "filter", "history", "inspect", "inspection_report", "inspectList", "record", "selectSite"]
      },
      {
        root: "pages/supervise",
        name: "supervise",
        pages: ["filter", "index"]
      },
      {
        root: "pages/pollution-manage",
        name: "pollution-manage",
        pages: ["question", "detail", "edit", "filter", "index", "patrol", "staffChangeLog", "statusChangeLog"]
      },
      {
        root: "pages/works",
        name: "works",
        pages: ["detail", "detailOpen", "filter", "index", "labelChoose", "reply", "users"]
      },
      {
        root: "pages/inspectReport",
        name: "inspectReport",
        pages: ["index", "report", "success"]
      },
      {
        root: "common/pages/myInfo",
        name: "myInfo",
        pages: ["exclusiveQrcode", "agree", "joinList", "inspectList", "acceptDispatch", "launchDispatch", "goodShare", "myList", "myStats"]
      },
      {
        root: "pages/dispatch",
        name: "dispatch",
        pages: ["dispatch_list", "dispatch_detail"]
      },
      {
        root: "pages/switch_construction",
        name: "switch_construction",
        pages: ["index"]
      },
      {
        root: "pages/departmentManage",
        name: "departmentManage",
        pages: ["index", "index_bk", "edit"]
      },
      {
        root: "common/pages/personalInfo",
        name: "personalInfo",
        pages: ["divisionEdit", "edit", "index", "roleEdit"]
      },
      {
        root: "pages/personManage",
        name: "personManage",
        pages: ["add", "index", "index-bk", "edit", "qrCode", "selectDepartment", "selectDivision", "selectPerson"]
      },
      {
        root: "pages/joinRequest",
        name: "joinRequest",
        pages: ["agree", "index"]
      },
      {
        root: "pages/pollution-industry",
        name: "pollution-industry",
        pages: ["index"]
      },
    ],
    window: {
      backgroundTextStyle: "light",
      navigationBarBackgroundColor: "#fff",
      navigationBarTitleText: "WeChat",
      navigationBarTextStyle: "black"
    },
    permission: {
      "scope.userLocation": {
        desc: "你的位置信息将用于小程序位置接口的效果展示"
      }
    },
    tabBar: {
      list: [
        {
          pagePath: "pages/index/index",
          text: "任务",
          iconPath: "./assets/tabBar/tab_task.png",
          selectedIconPath: "./assets/tabBar/tab_task_s.png"
        },
        {
          pagePath: "pages/workbench/index",
          text: "工作台",
          iconPath: "./assets/tabBar/tab_gongzuo.png",
          selectedIconPath: "./assets/tabBar/tab_gongzuo_s.png"
        },
        {
          pagePath: "pages/my_new/index",
          text: "我的",
          iconPath: "./assets/tabBar/tab_my.png",
          selectedIconPath: "./assets/tabBar/tab_my_s.png"
        }
      ],
      color: "#1B2E59",
      selectedColor: "#1091FF",
      backgroundColor: "#FFFFFF",
      borderStyle: "white"
    }
  };

  componentWillMount() {
    const paramsUrl = this.$router.params;
    const scene = decodeURIComponent(paramsUrl.query.scene);
    if (scene.indexOf("&") != -1) {
      let listData = scene.split("&");
      let value = ""
      let type = ""
      for (let i = 0; i < listData.length; i++) {
        value = listData[0].substr(listData[0].indexOf("=") + 1)
        type = listData[1].substr(listData[1].indexOf("=") + 1)
      }
      if (type == "division_code") {
        Taro.setStorageSync("division_code", value);
      }
      if (type = "user_id") {
        Taro.setStorageSync("invite_user_id", value);
      }
    }
  }

  componentDidMount() {
    const { openPage = false } = this.$router.params && this.$router.params.query || {};
    if (!openPage) {
      systemInfoStore.load('green-construct');
      userStore.load(() => {
        Taro.redirectTo({ url: "/pages/login/login" });
      });
    }
  }

  componentDidShow() {
    const { openPage = false } = this.$router.params && this.$router.params.query || {};
    if (openPage) {
      return;
    }

    // const {
    //   isLoggedIn,
    //   userDetails: { requestStatus, status }
    // } = userStore;
    // if (!isLoggedIn) {
    //   Taro.redirectTo({ url: "/pages/login/login" });
    // } else if (status == 'COMMON' || requestStatus == "PASS") {
    //   Taro.switchTab({ url: '/pages/index/index' });
    // } else if (requestStatus == 'CONFIRMING' || requestStatus == 'REJECT') {
    //   Taro.redirectTo({ url: '/pages/user_request_verify/index' });
    // } else {
    //   Taro.redirectTo({ url: '/pages/user_join/index' });
    // }
  }

  componentDidHide() { }

  componentDidCatchError() { }

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render() {
    return (
      <Provider store={store}>
        <Login />
      </Provider>
    );
  }
}

Taro.render(<App />, document.getElementById("app"));
