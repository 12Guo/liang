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
Taro.uma = uma ;

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
      "pages/task_dispatch_new/index",
      "pages/my_new/index",
      // "pages/my/index",
      // "pages/my/exclusiveQrcode",
      // "pages/my/agree",
      // "pages/my/joinList",
      // "pages/my/inspectList",
      "pages/work_circle/index",
      "pages/index/index",
      // "pages/works/detail",
      // "pages/works/reply",
      // "pages/works/labelChoose",
      // "pages/works/users",
      // "pages/works/filter",
      "pages/proxy/index",
      // "pages/works/detailOpen",
      "pages/discovery/index",
      // "pages/demo/table",
      // "pages/my/acceptDispatch",
      // "pages/my/launchDispatch",
      // "pages/my/goodShare",
    ],
    subPackages: [
      {
        root: "pages/works",
        name: "works",
        pages: ["index", "detail", "reply", "labelChoose", "users", "filter", "detailOpen"]
      },
      {
        root: "pages/department_select",
        name: "department_select",
        pages: ["index"]
      },
      {
        root: "pages/work_stats",
        name: "work_stats",
        pages: ["index"]
      },
      {
        root: "pages/photo",
        name: "photo",
        pages: ["index"]
      },
      {
        root: "pages/person",
        name: "person",
        pages: ["index"]
      },
      {
        root: "pages/personalInfo",
        name: "personalInfo",
        pages: ["index", "edit", "divisionEdit", "roleEdit"]
      },
      {
        root: "pages/task_dispatch",
        name: "task_dispatch",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/user_division",
        name: "user_division",
        pages: [
          "user_division",
        ]
      },
      {
        root: "pages/task_dispatch_detail",
        name: "task_dispatch_detail",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/user_upload_info",
        name: "user_upload_info",
        pages: [
          "user_upload_info",
        ]
      },
      {
        root: "pages/division_select",
        name: "division_select",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/personChoose",
        name: "personChoose",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/dispatch_send_success",
        name: "dispatch_send_success",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/dispatch_msg_detail",
        name: "dispatch_msg_detail",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/sign_point",
        name: "sign_point",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/log",
        name: "log",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/report",
        name: "report",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/inventory",
        name: "inventory",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/send_notice",
        name: "send_notice",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/secure",
        name: "secure",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/red_black_billboard",
        name: "red_black_billboard",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/pollution-industry",
        name: "pollution-industry",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/task_dispatch_message",
        name: "task_dispatch_message",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/impact_analysis",
        name: "impact_analysis",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/agree_higher_access",
        name: "agree_higher_access",
        pages: [
          "index",
        ]
      },
      {
        root: "common/pages/webview",
        name: "webview",
        pages: [
          "index",
          "horizontal_view",
          "goal_webview"
        ]
      },
      {
        root: "pages/apply_lower_access",
        name: "apply_lower_access",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/verify_higher_access",
        name: "verify_higher_access",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/user_base_phone",
        name: "user_base_phone",
        pages: [
          "user_base_phone",
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
        root: "pages/user_unionid_verify",
        name: "user_unionid_verify",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/user_area_manage",
        name: "user_area_manage",
        pages: [
          "user_area_manage",
        ]
      },
      {
        root: "pages/user_area_batch_active",
        name: "user_area_batch_active",
        pages: [
          "user_area_batch_active",
        ]
      },
      {
        root: "pages/user_base_info",
        name: "user_base_info",
        pages: [
          "user_base_info",
        ]
      },
      {
        root: "pages/user_phone",
        name: "user_phone",
        pages: [
          "index",
        ]
      },
      {
        root: "pages/user_apply_register",
        name: "user_apply_register",
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
        root: "pages/default",
        name: "default",
        pages: ["index", "limitedAccess"]
      },
      {
        root: "pages/inspectReport",
        name: "inspectReport",
        pages: ["index", "report", "report_jk", "report_bh", "success"]
      },
      {
        root: "pages/mark",
        name: "mark",
        pages: ["index", "add", "success"]
      },
      {
        root: "pages/joinRequest",
        name: "joinRequest",
        pages: ["index", "agree"]
      },
      {
        root: "pages/departmentManage",
        name: "departmentManage",
        pages: ["index", "edit"]
      },
      {
        root: "pages/switchArea",
        name: "switchArea",
        pages: ["index", "choose"]
      },
      {
        root: "pages/special-action",
        name: "special-action",
        pages: ["index", "edit", "detail"]
      },
      {
        root: "pages/personManage",
        name: "personManage",
        pages: [
          "index",
          "selectPerson",
          "selectDepartment",
          "selectDivision",
          "edit",
          "add",
          "qrCode"
        ]
      },
      {
        root: "pages/pollution-manage",
        name: "pollution-manage",
        pages: [
          "index",
          "patrol",
          "detail",
          "edit",
          "statusChangeLog",
          "staffChangeLog"
        ]
      },
      {
        root: "pages/alarm",
        name: "alarm",
        pages: [
          "site_alarm",
          "site_alarm_detail",
          "reply",
        ]
      },
      {
        root: "pages/myInfo",
        name: "myInfo",
        pages: ["exclusiveQrcode", "agree", "joinList", "inspectList", "acceptDispatch", "launchDispatch", "goodShare", "myList", "myStats"]
      },
      {
        root: "pages/dispatchManage",
        name: "dispatchManage",
        pages: ["index"]
      },
      {
        root: "pages/inspectRank",
        name: "inspectRank",
        pages: ["index", "detail"]
      }
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
          pagePath: "pages/task_dispatch_new/index",
          text: "调度",
          iconPath: "./assets/tabBar/tab_diaodu.png",
          selectedIconPath: "./assets/tabBar/tab_diaodu_s.png"
        },
        {
          pagePath: "pages/work_circle/index",
          text: "工作圈",
          iconPath: "./assets/tabBar/tab_work.png",
          selectedIconPath: "./assets/tabBar/tab_work_s.png"
        },
        {
          pagePath: "pages/proxy/index",
          text: "上报",
          iconPath: "./assets/tabBar/tab_camera2.png",
          selectedIconPath: "./assets/tabBar/tab_camera2.png"
        },
        {
          pagePath: "pages/discovery/index",
          text: "发现",
          iconPath: "./assets/tabBar/tab_discovery.png",
          selectedIconPath: "./assets/tabBar/tab_discovery_s.png"
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
      if (type == "code") {
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
      userStore.load(() => {
        Taro.redirectTo({ url: "/pages/login/login" });
      });
    }
    systemInfoStore.load('yimeijing-applet');
  }

  componentDidShow() {
    const { openPage = false } = this.$router.params && this.$router.params.query || {};
    if (openPage) {
      return;
    }

    let divisionCode: string = Taro.getStorageSync("division_code");
    let isRegiste: boolean = Taro.getStorageSync("isRegiste");
    const {
      isLoggedIn,
      userDetails: { status }
    } = userStore;

    if (!isLoggedIn) {
      Taro.redirectTo({ url: "/pages/login/login" });
    } else if (status == "EXTERNAL" || status == null) {
      if (!isRegiste && (divisionCode == "" || divisionCode == "null")) {
        Taro.redirectTo({ url: "/pages/user_join/index" });
      }
    } else if (
      status == "ACTIVE_DIVISION_REQUESTING " ||
      status == "JOIN_DIVISION_REQUESTING" || status == "DIVISION_JOIN_REJECT"
    ) {
      userStore.getUserDetails();
      Taro.redirectTo({ url: '/pages/user_request_verify/index' });
    }

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
