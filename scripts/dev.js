const { build } = require('esbuild')
const { resolve } = require('path')

// minimist用来解析命令行参数的
// args { _: [ 'reactivity' ], f: 'global' }
const args = require('minimist')(process.argv.slice(2))

// 打包的目标
const target = args._[0] || 'reactivity'
// 打包的格式
const format = args.f || 'global'

// 找到包的package.json
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))

// iife 立即执行函数 (function(){})()
// cjs node中的模块 module.exports
// esm 浏览器的esModule模块 import
const outputFormat = format.startsWith('global') // 输出的格式
  ? 'iife'
  : format === 'cjs'
  ? 'cjs'
  : 'esm'

// 输出的文件
const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)

build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true, // 把所有的包全部打包到一起
  sourcemap: true,
  format: outputFormat, // 输出的格式
  globalName: pkg.buildOptions?.name, // 打包的全局的名字
  platform: format === 'cjs' ? 'node' : 'browser', // 平台
  watch: {
    // 监控文件变化
    onRebuild(error) {
      if (!error) console.log(`rebuilt~~~~`)
    },
  },
}).then(() => {
  console.log('watching~~~')
})
