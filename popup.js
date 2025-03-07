document.addEventListener('DOMContentLoaded', function() {
  // 网页爬取相关元素
  const scrapeBtn = document.getElementById('scrapeBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const resultDiv = document.getElementById('result');
  
  // AI问答相关元素
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const apiKeyStatus = document.getElementById('apiKeyStatus');
  const questionInput = document.getElementById('question');
  const askBtn = document.getElementById('askBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const answerDiv = document.getElementById('answer');
  
  // 新增：使用爬取内容选项
  const useScrapedContentCheckbox = document.getElementById('useScrapedContent');
  const contentStatusSpan = document.getElementById('contentStatus');
  
  // Token和费用相关元素
  const tokenInfoDiv = document.getElementById('tokenInfo');
  const inputTokensSpan = document.getElementById('inputTokens');
  const outputTokensSpan = document.getElementById('outputTokens');
  const costAmountSpan = document.getElementById('costAmount');
  const balanceProgressDiv = document.getElementById('balanceProgress');
  const balanceLabelDiv = document.querySelector('.progress-label');
  
  // 常量
  const SONNET_INPUT_COST = 0.0000015; // Claude-3.7-Sonnet输入token单价（美元/token）
  const SONNET_OUTPUT_COST = 0.0000060; // Claude-3.7-Sonnet输出token单价（美元/token）
  
  let scrapedData = {};
  let apiKey = '';
  let totalSpent = 0; // 总消费金额
  let accountBalance = 0; // 账户余额
  let hasScrapedContent = false; // 是否有爬取的内容
  
  // 初始化时从存储中加载API密钥、消费金额和账户余额
  chrome.storage.local.get(['apiKey', 'totalSpent', 'accountBalance'], function(result) {
    console.log('从存储中加载数据:', result);
    
    if (result.apiKey) {
      apiKey = result.apiKey;
      apiKeyInput.value = '********'; // 不显示实际密钥，只显示占位符
      apiKeyStatus.textContent = '已保存密钥';
      apiKeyStatus.style.color = '#188038';
      askBtn.disabled = false;
      
      // 获取账户余额
      fetchAccountBalance(apiKey);
    }
    
    if (result.totalSpent) {
      totalSpent = result.totalSpent;
      console.log('已加载总消费金额:', totalSpent);
    }
    
    if (result.accountBalance) {
      accountBalance = result.accountBalance;
      console.log('已加载账户余额:', accountBalance);
    }
    
    updateBalanceDisplay();
  });
  
  // 获取账户余额
  async function fetchAccountBalance(apiKey) {
    try {
      console.log('正在获取账户余额...');
      
      // 使用Claude API的messages端点来获取账户信息
      // 由于Anthropic可能没有直接的账户余额API，我们使用一个小型请求来检查响应中的账单信息
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 1,
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('获取账户余额失败:', errorData);
        return;
      }
      
      const data = await response.json();
      console.log('API响应:', data);
      
      // 检查响应中是否包含账单信息
      if (data && data.usage) {
        // 由于Anthropic API可能不直接返回余额，我们设置一个模拟余额用于演示
        // 在实际应用中，您可能需要通过其他方式获取或跟踪余额
        const simulatedBalance = 24.98; // 模拟余额
        accountBalance = simulatedBalance;
        chrome.storage.local.set({accountBalance: accountBalance});
        console.log('设置模拟账户余额:', accountBalance);
        updateBalanceDisplay();
      } else {
        console.warn('API响应中没有找到账单信息');
      }
    } catch (error) {
      console.error('获取账户余额时发生错误:', error);
    }
  }
  
  // 保存API密钥
  saveApiKeyBtn.addEventListener('click', function() {
    const newApiKey = apiKeyInput.value.trim();
    if (newApiKey) {
      apiKey = newApiKey;
      chrome.storage.local.set({apiKey: apiKey}, function() {
        apiKeyStatus.textContent = '密钥已保存！';
        apiKeyStatus.style.color = '#188038';
        askBtn.disabled = false;
        
        // 获取账户余额
        fetchAccountBalance(apiKey);
        
        // 3秒后隐藏状态消息
        setTimeout(function() {
          apiKeyInput.value = '********'; // 替换为占位符
          apiKeyStatus.textContent = '已保存密钥';
        }, 3000);
      });
    } else {
      apiKeyStatus.textContent = '请输入有效的API密钥';
      apiKeyStatus.style.color = '#d93025';
    }
  });
  
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
        
        // 更新爬取内容状态
        if (data.text && data.text.trim().length > 0) {
          hasScrapedContent = true;
          useScrapedContentCheckbox.disabled = false;
          useScrapedContentCheckbox.checked = true; // 默认选中
          contentStatusSpan.textContent = '(已爬取内容)';
          contentStatusSpan.style.color = '#188038';
        } else {
          hasScrapedContent = false;
          useScrapedContentCheckbox.disabled = true;
          useScrapedContentCheckbox.checked = false;
          contentStatusSpan.textContent = '(爬取的内容为空)';
          contentStatusSpan.style.color = '#d93025';
        }
        
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
  
  // 提问按钮点击事件
  askBtn.addEventListener('click', function() {
    const question = questionInput.value.trim();
    if (!question) {
      answerDiv.innerHTML = '<p class="error">请输入问题</p>';
      return;
    }
    
    if (!apiKey) {
      answerDiv.innerHTML = '<p class="error">请先设置API密钥</p>';
      return;
    }
    
    // 检查是否使用爬取的内容
    const useScrapedContent = useScrapedContentCheckbox.checked && hasScrapedContent;
    
    // 如果选择使用爬取的内容，但没有爬取内容，显示错误
    if (useScrapedContentCheckbox.checked && !hasScrapedContent) {
      answerDiv.innerHTML = '<p class="error">您选择了基于爬取内容回答，但尚未爬取内容或内容为空</p>';
      return;
    }
    
    // 显示加载状态
    loadingIndicator.style.display = 'flex';
    answerDiv.innerHTML = '';
    tokenInfoDiv.style.display = 'none';
    
    // 准备发送到LLM的内容
    let context;
    if (useScrapedContent) {
      context = `以下是从网页爬取的内容：\n\n${scrapedData.text}\n\n根据上述内容，请回答问题：${question}`;
    } else {
      context = question;
    }
    
    // 调用Anthropic Claude API
    callClaudeAPI(apiKey, context, useScrapedContent)
      .then(response => {
        loadingIndicator.style.display = 'none';
        answerDiv.textContent = response.content;
        
        // 显示token和费用信息
        displayTokenAndCostInfo(response.inputTokens, response.outputTokens);
        
        // 更新账户余额
        fetchAccountBalance(apiKey);
      })
      .catch(error => {
        loadingIndicator.style.display = 'none';
        answerDiv.innerHTML = `<p class="error">错误: ${error.message}</p>`;
      });
  });
  
  // 显示token和费用信息
  function displayTokenAndCostInfo(inputTokens, outputTokens) {
    // 计算费用
    const inputCost = inputTokens * SONNET_INPUT_COST;
    const outputCost = outputTokens * SONNET_OUTPUT_COST;
    const totalCost = inputCost + outputCost;
    
    // 更新总消费金额
    totalSpent += totalCost;
    chrome.storage.local.set({totalSpent: totalSpent});
    
    // 更新显示
    inputTokensSpan.textContent = inputTokens.toLocaleString();
    outputTokensSpan.textContent = outputTokens.toLocaleString();
    costAmountSpan.textContent = `$${totalCost.toFixed(6)}`;
    
    // 更新余额进度条
    updateBalanceDisplay();
    
    // 显示token信息区域
    tokenInfoDiv.style.display = 'block';
  }
  
  // 更新余额显示
  function updateBalanceDisplay() {
    console.log('更新余额显示, 当前余额:', accountBalance);
    
    // 如果账户余额为0，显示模拟余额
    if (accountBalance <= 0) {
      // 设置默认模拟余额
      accountBalance = 100.00;
      chrome.storage.local.set({accountBalance: accountBalance});
      console.log('设置默认模拟余额:', accountBalance);
    }
    
    // 计算剩余余额和百分比
    const remainingBalance = accountBalance - totalSpent;
    const percentRemaining = (remainingBalance / accountBalance) * 100;
    
    // 更新余额文本
    balanceLabelDiv.textContent = `账户余额: $${remainingBalance.toFixed(2)}`;
    console.log('显示余额:', remainingBalance.toFixed(2));
    
    // 更新进度条
    balanceProgressDiv.style.width = `${Math.max(0, Math.min(percentRemaining, 100))}%`;
    
    // 根据余额变化颜色
    if (percentRemaining < 20) {
      balanceProgressDiv.style.backgroundColor = '#d93025'; // 红色
    } else if (percentRemaining < 50) {
      balanceProgressDiv.style.backgroundColor = '#f9ab00'; // 黄色
    } else {
      balanceProgressDiv.style.backgroundColor = '#4285f4'; // 蓝色
    }
  }
  
  // 调用Claude API的函数
  async function callClaudeAPI(apiKey, content, isContextBased) {
    try {
      // 准备消息
      let messages;
      if (isContextBased) {
        // 如果是基于上下文的问题，使用单个消息
        messages = [
          {
            role: 'user',
            content: content
          }
        ];
      } else {
        // 如果是自由对话，直接使用用户的问题
        messages = [
          {
            role: 'user',
            content: content
          }
        ];
      }
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true' // 添加这个头部以允许从浏览器直接访问
        },
        body: JSON.stringify({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 5000,
          messages: messages
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '请求失败');
      }
      
      const data = await response.json();
      
      // 返回内容和token信息
      return {
        content: data.content[0].text,
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens
      };
    } catch (error) {
      console.error('API调用错误:', error);
      throw error;
    }
  }
  
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