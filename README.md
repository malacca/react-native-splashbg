# 安装

`yarn add react-native-splashbg`

`cd ios && pod install && cd ../`


# 配置

在配置前，推荐先阅读 [启动屏原理及实现探究](docs)，以了解 `react-native-splashbg` 的运行原理，之后可参考 [example](example) 文件夹下样例配置 Android / iOS 启动屏文件。

如果是全新的项目，或从未修改过相关的配置文件，还可利用 `react-native-splashbg` 提供的命令行工具进行快速配置，只需在项目根目录执行:

`npx splash [theme]`

其中 `[theme]` 修改为 [example](example) 目录下的文件夹名称，该命令会自动下载配置文件并保存到对应路径，之后只需修改 `android/app/src/main/res/drawable-xxxhdpi` 和 `ios/project/Images.xcassets` 目录下的相应图片即可，图片尺寸无需保持完全一致。

如果多次执行该命令，并下载了不同的 `theme`，可能会产生多余的图片资源，还请注意手动删除，不删除不会影响程序运行，但会增大安装包的体积。


# 使用

安装并配置之后，无需任何操作便可正常使用了，但推荐在 APP 加载完成之后清楚启动图，以减少 APP 占用内存，清除启动屏的方法如下：

```
import splashbg from 'react-native-splashbg';


splashbg.remove();
```