const { build } = require('vite');
const path = require('path');

async function buildWeb() {
  console.log('开始构建 Web 端...');

  try {
    await build({
      configFile: path.resolve(__dirname, '../packages/web/vite.config.ts'),
      mode: 'production',
    });
    console.log('Web 端构建完成!');
  } catch (error) {
    console.error('Web 端构建失败:', error);
    process.exit(1);
  }
}

buildWeb();
