#import "SplashBgModule.h"
#import <React/RCTBridge.h>
#import <React/RCTRootContentView.h>

static UIView *launchView = nil;
static BOOL launchActivated = NO;

@implementation SplashBgModule

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onWindowBecomeVisible)
                                                 name:UIWindowDidBecomeVisibleNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onJavaScriptLoad)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:nil];
    return false;
}

+ (void)onWindowBecomeVisible {
    [SplashBgModule show];
}

+ (void)onJavaScriptLoad {
    [SplashBgModule show];
}

+ (void)show {
    // 已显示过启动屏, 且已移除, 就不做任何处理了, 比如 reload jsbundle
    if (!launchView && launchActivated) {
        return;
    }
    // RCTRootContentView 是使用 insertSubview:atIndex:0 方式插入的: https://git.io/JDkPO
    // 所以需在 RCTRootContentView 插入后再插入 launchView, 否则 launchView 会覆盖在 RCTRootContentView 上面
    int index = 0;
    BOOL launchAtFirst = NO;
    BOOL hasContentView = NO;
    UIView *rootView = [[[[[UIApplication sharedApplication] delegate] window] rootViewController] view];
    for (UIView *subview in rootView.subviews) {
        if (0 == index && subview == launchView) {
            launchAtFirst = YES;
        } else if ([subview isKindOfClass:[RCTRootContentView class]]) {
            hasContentView = YES;
            break;
        }
        index++;
    }
    // 没有 ContentView 或 有 ContentView 但位置正确, 无需处理
    if (!hasContentView || launchAtFirst) {
        return;
    }
    if (!launchView) {
        launchActivated = YES;
        NSString *launchScreen = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UILaunchStoryboardName"];
        launchView = [[[UIStoryboard storyboardWithName:launchScreen bundle:nil] instantiateInitialViewController] view];
        CGRect frame = rootView.frame;
        frame.origin = CGPointMake(0, 0);
        launchView.frame = frame;
    }
    [rootView insertSubview:launchView atIndex:0];
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(remove) {
    if (launchView) {
        [launchView removeFromSuperview];
        launchView = nil;
    }
}

@end
