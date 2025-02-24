const fs = require('fs');
const path = require('path');

/**
 * 解析JSONC格式的文本内容
 * @param {string} text JSONC格式的文本
 * @returns {Object} 解析后的JavaScript对象
 */
const parseJSONC = (text) => {
  // 移除注释（单行注释和多行注释）
  const stripped = text.replace(
    /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
    (m, g) => g ? '' : m
  );
  // 处理尾逗号并解析JSON
  return JSON.parse(
    stripped.replace(/,\s*([}\]])/g, '$1')
  );
};

/**
 * 从配置文件中查找匹配的键位绑定
 * @param {string} keybinding 要查找的键位组合
 * @param {string} platform 平台(macos/windows/linux)
 * @returns {Array} 匹配的键位配置数组
 */
const findKeybindings = (keybinding, platform = 'macos') => {
  try {
    // 构建配置文件路径
    const configPath = path.join(
      process.cwd(),
      'DefaultKeybindings',
      `${platform}.jsonc`
    );

    // 读取并解析配置文件
    const rawData = fs.readFileSync(configPath, 'utf-8');
    const keybindings = parseJSONC(rawData);

    // 标准化搜索关键字
    const searchKey = keybinding.toLowerCase().replace(/\s+/g, '');

    // 使用Map进行去重
    const uniqueMap = new Map();

    // 查找完全匹配的键位并去重
    keybindings.filter(item => {
      if (!item.key) return false;
      const itemKey = item.key.toLowerCase().replace(/\s+/g, '');
      if (itemKey === searchKey) {
        const uniqueId = `${item.key}_${item.when || 'no_when'}`;
        if (!uniqueMap.has(uniqueId)) {
          uniqueMap.set(uniqueId, item);
          return true;
        }
      }
      return false;
    });

    const matches = Array.from(uniqueMap.values());
    console.log(`找到 ${matches.length} 个匹配的键位配置`);
    return matches;
  } catch (error) {
    console.error(`查找键位失败: ${error.message}`);
    return [];
  }
};

/**
 * 格式化输出键位配置
 * @param {Array} keybindings 键位配置数组
 * @returns {string} 格式化后的字符串
 */
const formatOutput = (keybindings) => {
  if (!keybindings || keybindings.length === 0) {
    return "未找到匹配的键位配置";
  }

  return JSON.stringify(keybindings, null, 4);
};

/**
 * 启动交互式命令行界面
 */
const startCLI = () => {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptUser = () => {
    readline.question('请输入要查找的快捷键（直接回车退出）: ', (input) => {
      if (!input) {
        readline.close();
        return;
      }

      const matches = findKeybindings(input);
      console.log(formatOutput(matches));
      console.log("\n" + "=".repeat(50) + "\n");
      promptUser();
    });
  };

  promptUser();
};

startCLI();
