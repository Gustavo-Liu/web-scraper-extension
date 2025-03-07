// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(function() {
  console.log('网页信息爬取器扩展已安装');
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(function(tab) {
  // 如果没有设置popup，可以在这里处理点击事件
  // 由于我们已经设置了popup.html，这个事件不会被触发
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'saveData') {
    // 保存数据到存储
    chrome.storage.local.set({
      'lastScrapedData': request.data,
      'lastScrapedUrl': sender.tab.url,
      'lastScrapedTime': new Date().toISOString()
    }, function() {
      sendResponse({success: true});
    });
    return true; // 保持消息通道开放，以便异步响应
  }
}); 