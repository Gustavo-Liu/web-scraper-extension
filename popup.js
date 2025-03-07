document.addEventListener('DOMContentLoaded', function() {
  const scrapeBtn = document.getElementById('scrapeBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const resultDiv = document.getElementById('result');
  
  let scrapedData = {};
  
  // 爬取信息按钮点击事件
  scrapeBtn.addEventListener('click', function() {
    // 获取用户选择的爬取选项
    const options = {
      title: document.getElementById('title').checked,
      meta: document.getElementById('meta').checked,
      links: document.getElementById('links').checked,
      images: document.getElementById('images').checked,
      text: document.getElementById('text').checked
    };
    
    // 显示加载状态
    resultDiv.innerHTML = '<p>正在爬取数据，请稍候...</p>';
    
    // 获取当前活动标签页
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      
      // 在当前页面执行内容脚本
      chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        function: scrapePageContent,
        args: [options]
      }, function(results) {
        if (chrome.runtime.lastError) {
          resultDiv.innerHTML = `<p>错误: ${chrome.runtime.lastError.message}</p>`;
          return;
        }
        
        // 处理爬取结果
        const data = results[0].result;
        scrapedData = data;
        
        // 显示爬取结果
        displayResults(data);
      });
    });
  });
  
  // 复制结果按钮点击事件
  copyBtn.addEventListener('click', function() {
    const resultText = JSON.stringify(scrapedData, null, 2);
    navigator.clipboard.writeText(resultText).then(function() {
      alert('结果已复制到剪贴板！');
    }).catch(function(err) {
      alert('复制失败: ' + err);
    });
  });
  
  // 下载结果按钮点击事件
  downloadBtn.addEventListener('click', function() {
    const resultText = JSON.stringify(scrapedData, null, 2);
    const blob = new Blob([resultText], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scraped_data_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.json';
    a.click();
    
    URL.revokeObjectURL(url);
  });
  
  // 显示爬取结果
  function displayResults(data) {
    let html = '<h3>爬取结果:</h3>';
    
    if (data.title) {
      html += `<p><strong>标题:</strong> ${data.title}</p>`;
    }
    
    if (data.meta && data.meta.length > 0) {
      html += '<p><strong>Meta信息:</strong></p><ul>';
      data.meta.forEach(meta => {
        html += `<li>${meta.name || meta.property || '未命名'}: ${meta.content}</li>`;
      });
      html += '</ul>';
    }
    
    if (data.links && data.links.length > 0) {
      html += `<p><strong>链接数量:</strong> ${data.links.length}</p>`;
      html += '<details><summary>查看链接</summary><ul>';
      data.links.slice(0, 20).forEach(link => {
        html += `<li><a href="${link.url}" target="_blank">${link.text || link.url}</a></li>`;
      });
      if (data.links.length > 20) {
        html += `<li>... 还有 ${data.links.length - 20} 个链接</li>`;
      }
      html += '</ul></details>';
    }
    
    if (data.images && data.images.length > 0) {
      html += `<p><strong>图片数量:</strong> ${data.images.length}</p>`;
      html += '<details><summary>查看图片</summary><ul>';
      data.images.slice(0, 10).forEach(img => {
        html += `<li>${img.alt || '无描述'}: ${img.src}</li>`;
      });
      if (data.images.length > 10) {
        html += `<li>... 还有 ${data.images.length - 10} 张图片</li>`;
      }
      html += '</ul></details>';
    }
    
    if (data.text) {
      const previewText = data.text.length > 200 ? data.text.substring(0, 200) + '...' : data.text;
      html += `<p><strong>文本内容预览:</strong></p>`;
      html += `<p>${previewText}</p>`;
      html += '<details><summary>查看完整文本</summary><pre style="white-space: pre-wrap;">' + data.text + '</pre></details>';
    }
    
    resultDiv.innerHTML = html;
  }
});

// 在页面中执行的爬取函数
function scrapePageContent(options) {
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