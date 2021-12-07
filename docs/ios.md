# 前言

新版 iOS 使用 `.storyboard` 文件作为启动屏文件，RN 自带了一个 [启动屏](https://github.com/facebook/react-native/blob/main/template/ios/HelloWorld/LaunchScreen.storyboard)，在生成项目的路径为 `ios/[project]/LaunchScreen.storyboard`，如果可以接受纯文字格式的启动屏，打开这个文件修改文字即可。

若需要自定义，可通过 xcode 进行可视化编辑，如下图

![.storyboard 编辑](imgs/ios_1.png)

上图所标注的地方为主要操作区域

1. 点击 + 号按钮，拖拽 `UIImageVIew` 到屏幕窗口。
2. 选择要编辑的图层或约束条件
3. 设置当前选中图层的属性
4. 添加约束条件

可通过上述方法直接编辑 `LaunchScreen.storyboard` 或新建一个 `.storyboard` 文件，最后可通过以下方式设置启动屏所用文件，RN 默认已设置了  `LaunchScreen.storyboard` 为启动屏，若直接修改该文件，则无需进行这一步。

![设置启动屏文件](imgs/ios_2.png)

# 设计

下面展示两种常见的启动屏设计(一张居中图 + 上下各一张图)

![一张居中的 LOGO 图](imgs/ios_3.png)

![上下各一张图](imgs/ios_4.png)

### 启动图尺寸

iOS 与 Android 类似，也存在不同的分辨率和 DPI ，为了维护方便，也可以仅设置最大图（即 @3x） 即可，图片的实际显示尺寸可参见 [Android 启动屏](android.md) 中 `启动图尺寸` 章节的计算方法 和 不同版本 iPhone 的 [分辨率](https://www.ios-resolution.com/)，这里就不再累述了。另外，启动屏可能存在一定的 [瑕疵](https://developer.apple.com/forums/thread/68244)（: 修改图片再次启动不生效，仍会显示上次的图片，可以尝试修改图片名称，并修改 `.storyboard` 中的引用），实际使用时要注意测试一下。

![99.png](https://upload-images.jianshu.io/upload_images/3490921-94597bbacb840b59.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

# 与 Android 的不同之处

相比 [Android 启动屏](android.md)，iOS 启动屏类似于 Android 使用 activey 作为启动屏的方案，而没有启动背景的方案。这意味着可以有更好的灵活度，可以制作更加复杂的效果（上面只是最简单的介绍，更多玩法需自行探索）。并且该启动屏会在主页面加载成功后移除屏幕，替换为主界面，主界面是何时载成功是由接口函数反馈的，在 `AppDelegate.m` 中

```
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    .....

    // 该函数处理完毕后返回结果，此时启动屏移除屏幕
    return YES;
}
```

对于 RN 而言，该过程发生在主线程，在处理该逻辑的同时，JS 线程会同步加载并执行。若在主线程处理完毕、启动屏移除的时候，JS 线程还未处理完毕（即主界面未完成渲染），此时会显示为白屏。

一般情况下，若 JS 线程在启动时没有任何异步任务，直接在 `render` 返回界面，倒也问题不大，几乎不会出现白屏的情况，但如果 JS 在启动时执行一些异步请求，之后才 `render` 界面，那么这个白屏就很难受了。

这不同于 Android 使用 window 背景图的方式：背景图不会消失，直到主界面渲染完成后自动覆盖，视觉上是连贯的。所以对于 RN 而言，直接使用 `.storyboard` 作为启动屏并不完美。

[react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen) 的方案是，使用 `NSRunLoop` 方法阻塞主线程，等待 JS 线程加载完毕的通知，待收到通知后，解除阻塞，移除启动屏，显示主界面。

[react-native-bootsplash](https://github.com/zoontek/react-native-bootsplash) 的方案是，在未移除启动屏前，使用启动屏创建一个页面，该页面与启动屏完全一样，虽然之后启动屏按预期移除，但整个过程视觉上是没有任何变化的。待主界面加载完毕，JS 线程发送通知，此时移除覆盖在主界面上的层，显示主界面。

二者都需要在 `AppDelegate.m` 添加相应的代码

```
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    .....
   
    // react-native-splash-screen 需再此调用函数阻塞主线程，收到通知后跳出循环

    // react-native-bootsplash 在此调用函数，即启动屏移除前，创建一个完全一样的层

    // 该函数处理完毕后返回结果，此时启动屏移除屏幕
    return YES;
}
```

这两种方式，第二种要更好一点，阻塞主线程不是一个好主意。之所以能够在 RN 上使用，是因为 RN 的 JS 单独使用了一个线程，如果为原生开发，阻塞主线程就死循环了。即使对 RN 而言，也最好不要使用这种方式，因为可能有其他第三方组件需要在主线程执行一些任务。

对于第二种方式，可以考虑将使用启动屏创建的页面插入到主界面下面，这样就与使用 Android 启动背景的逻辑一致了，主界面渲染完毕后会自动覆盖启动屏，哪怕不移除这个复制的层也没什么影响。`react-native-splashbg` 便是使用这种方式。

# 插件开发

无论是 `react-native-splash-screen` 还是 `react-native-bootsplash`，都需要修改 `AppDelegate.m` 中的代码，有没有办法开发一个组件避免这一步，让组件更加绿色纯净。答案是行，但不完全行，因为组件在  `didFinishLaunchingWithOptions` 之后才会加载，而此时，启动屏刚刚被移除。

若在组件初始化的 `init` 方法中使用启动屏创建页面并插入到主界面下面，一般情况下，这个运行足够快，视觉上没有闪动，就好像启动屏一直在显示一样，所以说是可行的。

但又不完全行，因为这种方式总归是不太保险，使用启动屏创建的页面是在启动屏移除后插入的，二者之间的衔接时间会成为一个隐患，若衔接时间稍微长一点，那么这个时间间隔内会显示为白屏，安全的方式是在启动屏未移除前就插入创建的启动屏页面。

为了实现这个目的，有两种方法：第一种方法是实现自定义的 `BridgeModule`，这样可以 [注入依赖](https://reactnative.dev/docs/native-modules-ios#dependency-injection)，让 module 在 `didFinishLaunchingWithOptions` 结束之前加载，可参考 [RN与iOS原生通信原理](https://blog.gaogangsever.cn/react/ReactNative%E4%B8%8EiOS%E5%8E%9F%E7%94%9F%E9%80%9A%E4%BF%A1%E5%8E%9F%E7%90%86%E8%A7%A3%E6%9E%90-%E5%88%9D%E5%A7%8B%E5%8C%96.html)，但这种方法也需要修改 `AppDelegate.m`，并且实现起来还比较麻烦，pass 掉。

最简单的还是实现一个静态函数用于使用启动屏创建页面并插入，然后手动在 `didFinishLaunchingWithOptions` 函数内调用，所以 `react-native-splashbg` 选择使用这种方式。

继续阅读：

[Android 启动屏](android.md)

[React Native 启动屏](react.md)
