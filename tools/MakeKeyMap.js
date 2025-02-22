const fs = require('fs');
const path = require('path');

/**
 * 加载所有DefaultKeybindings目录下的配置文件并合并其内容
 * @returns {Array} 合并后的键位配置数组
 */
const loadAllKeybindings = () => {
    try {
        // 获取DefaultKeybindings目录
        const keymapDir = path.join(process.cwd(), 'DefaultKeybindings');
        const files = fs.readdirSync(keymapDir);
        
        // 过滤出所有jsonc文件
        const keymapFiles = files.filter(file => file.endsWith('.jsonc'));

        // 用于存储所有文件的键位配置
        let mergedKeybindings = [];
        
        // 遍历每个文件并合并内容
        for (const file of keymapFiles) {
            const filePath = path.join(keymapDir, file);
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const fileBindings = parseJSONC(rawData);
            console.log(`从 ${file} 读取到 ${fileBindings.length} 条键位`);
            mergedKeybindings = mergedKeybindings.concat(fileBindings);
        }

        console.log(`总共合并了 ${mergedKeybindings.length} 条键位配置`);
        return mergedKeybindings;
    } catch (error) {
        console.error(`键位加载失败: ${error.message}`);
        return [];
    }
};

/**
 * 创建新的键位配置数组，保留key和when字段，command设为空
 * @param {Array} keybindings 原始键位配置数组
 * @returns {Array} 处理后的键位配置数组
 */
const createEmptyKeybindings = (keybindings) => {
    // 使用Map来去重，key+when的组合作为唯一键
    const keyMap = new Map();
    
    keybindings.forEach(binding => {
        const identifier = `${binding.key}_${binding.when || ''}`;
        if (!keyMap.has(identifier)) {
            keyMap.set(identifier, {
                key: binding.key,
                command: '',
                // 保留原始when字段（如果存在）
                ...(binding.when && { when: binding.when })
            });
        }
    });

    const newBindings = Array.from(keyMap.values());
    console.log(`处理后的唯一键位数量：${newBindings.length}`);
    return newBindings;
};

/**
 * 更新package.json文件中的contributes.keybindings字段
 * @param {Array} keybindings 要写入的键位配置数组
 */
const updatePackageJson = (keybindings) => {
    try {
        // 读取package.json文件
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

        // 确保contributes对象存在
        packageJson.contributes = packageJson.contributes || {};
        // 更新keybindings配置
        packageJson.contributes.keybindings = keybindings;

        // 写入文件，保持JSON格式化（2空格缩进）
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        console.log('已更新 package.json 文件');
    } catch (error) {
        console.error(`更新 package.json 失败: ${error.message}`);
    }
};

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

// 主执行流程
const results = loadAllKeybindings();          // 1. 加载所有键位配置
const emptyBindings = createEmptyKeybindings(results);  // 2. 创建空命令的键位配置
updatePackageJson(emptyBindings);              // 3. 更新到package.json
