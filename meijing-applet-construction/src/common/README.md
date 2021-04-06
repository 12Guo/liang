# meijing-applet-common

小程序公共模块

### 使用说明

1. 项目中如果需要使用子模块，执行命令
```xml
git submodule add git@git.meijingdata.cn:simple/simple-applet-common.git src/common
```

2. 在config/index文件下，添加别名配置
```xml
'@common': path.resolve(__dirname, '..', 'src/common')
```

3. 使用公共模块里的组件或页面
```xml
import ListView from "@common/components/ListView/index"
```

4. 公共模块修改说明  a、切换到src/common目录下进行git子仓库提交  b、切回主项目进行git提交

5. 主项目存在submodule，首次拉代码，执行命令
```xml
git submodule init && git submodule update
```