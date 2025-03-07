// 这个脚本会在网页中执行
// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'scrapeData') {
    // 执行爬取操作
    const data = scrapePageData(request.options);
    // 发送爬取结果回popup
    sendResponse(data);
  }
  return true; // 保持消息通道开放，以便异步响应
});

// 爬取页面数据的函数
function scrapePageData(options) {
  const data = {};
  
  // 爬取标题
  if (options.title) {
    data.title = document.title;
  }
  
  // 爬取Meta信息
  if (options.meta) {
    data.meta = [];
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(meta => {
      const metaInfo = {};
      if (meta.name) metaInfo.name = meta.name;
      if (meta.property) metaInfo.property = meta.property;
      if (meta.content) metaInfo.content = meta.content;
      if (Object.keys(metaInfo).length > 0) {
        data.meta.push(metaInfo);
      }
    });
  }
  
  // 爬取链接
  if (options.links) {
    data.links = [];
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      if (link.href) {
        data.links.push({
          text: link.textContent.trim(),
          url: link.href
        });
      }
    });
  }
  
  // 爬取图片
  if (options.images) {
    data.images = [];
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src) {
        data.images.push({
          src: img.src,
          alt: img.alt || '',
          width: img.width,
          height: img.height
        });
      }
    });
  }
  
  // 爬取文本内容
  if (options.text) {
    // 获取主要内容区域（尝试排除导航、页脚等）
    let mainContent = '';
    
    // 尝试找到主要内容区域
    const possibleContentElements = [
      document.querySelector('main'),
      document.querySelector('article'),
      document.querySelector('.content'),
      document.querySelector('#content'),
      document.querySelector('.main'),
      document.querySelector('#main'),
      document.body
    ];
    
    // 使用第一个找到的有效元素
    const contentElement = possibleContentElements.find(el => el !== null);
    
    if (contentElement) {
      // 创建一个副本以便操作
      const clone = contentElement.cloneNode(true);
      
      // 移除脚本、样式等不需要的元素
      const elementsToRemove = clone.querySelectorAll('script, style, nav, header, footer');
      elementsToRemove.forEach(el => el.remove());
      
      // 获取文本内容
      mainContent = clone.textContent.replace(/\s+/g, ' ').trim();
    }
    
    data.text = mainContent;
  }
  
  return data;
} 