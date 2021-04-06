### 项目说明
> 项目JS使用 TypsScript 模板预编译引擎使用 Sass

### 执行步骤

1. 安装依赖
```xml
npm i
```

2. 运行程序
```xml
npm run dev:weapp
```

### 业务操作说明



### 01-配置工地视频
> 从管理后台给工地污染源配置对应视频摄像头

### 操作步骤

1. 用户管理后台/易美境小程序上添加工地污染源，同时给污染源添加监管部门
```xml
https://dev.meijing.fpi-inc.site/meijing-admin-web/#/pollution/pollution-sources
```

2. 用户中台平台上基于工地污染源的编码，创建同样编码的租户，租户类型construction
```xml
https://cloud.meijingdata.cn/simple-user-admin-web/#/simple-user-admin-web/tenant/tenant
```

3. 物联网管理后台上创建站点，站点关联租户（可多选）
```xml
https://cloud.meijingdata.cn/iot-admin-web/#/iot-admin-web/site/siteList
```

4. 物联网管理后台上视频管理，新建视频，视频关联接入站点、租户
```xml
https://cloud.meijingdata.cn/iot-admin-web/#/iot-admin-web/video/videoList
```

5. 租户对应的工地污染源关联上视频后，在用户管理后台污染源管理中，给污染源添加上视频摄像头
```xml
https://dev.meijing.fpi-inc.site/meijing-admin-web/#/pollution/pollution-sources
```

此时就能在绿色工地管家和美境绿色工地小程序上查看到视频（视频没有推流则会显示设备离线）



