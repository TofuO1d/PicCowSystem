const os = require("os");
const ESLintWebpackPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const path = require('path'); //nodejs
const threads = os.cpus().length; //cps核数
module.exports = {
    //entry为入口，指定从哪个开始打包
    entry: './src/main.js', //相对路径
    //指定打包到哪里去
    output: {
        //开发模式没有输出
        path: undefined, //绝对路径(说明所有东西都在dist下面)
        // filename:'static/js/main.js',
        filename: "static/js/[name].js", // 将 js 文件输出到 static/js 目录中
        // [contenthash:8]使用contenthash，取8位长度
        filename: "static/js/[name].[contenthash:8].js", // 入口文件打包输出资源命名方式
        chunkFilename: "static/js/[name].[contenthash:8].chunk.js", // 动态导入输出资源命名方式
        clean: true, // 自动将上次打包目录资源清空,即path整个目录清空
    },
    //loader模块，帮助识别webpack本身不能识别的文件，如css、less、jepg等
    module: {
        rules: [{
            oneOf: [{
                    test: /\.css$/, //检测xx文件，\为转义字符
                    use: [ //执行顺序是从右到左（从下到上）
                        "style-loader", //将js中css通过创建style标签添加到html文件中生效
                        "css-loader" //将css资源编译成commonjs模块到js中
                    ]
                },
                {
                    test: /\.less$/,
                    //loader：只能一个loader，而use：[]则可以多个loader
                    use: ["style-loader", "css-loader", "less-loader"], //多了less变成css的一步（less-loader）
                },
                {
                    test: /\.s[ac]ss$/,
                    use: ["style-loader", "css-loader", "sass-loader"],
                },
                {
                    test: /\.styl$/,
                    use: ["style-loader", "css-loader", "stylus-loader"],
                },
                {
                    test: /\.(png|jpe?g|gif|webp)$/,
                    type: "asset", //"asset"->转成base64
                    parser: {
                        dataUrlCondition: {
                            maxSize: 1024 * 1024 // 小于10kb的图片会被base64处理
                        }
                    },
                    // generator: {
                    //     // 将图片文件输出到 static/imgs 目录中
                    //     // 将图片文件命名 [hash:8][ext][query]
                    //     // [hash:8]: hash值取8位
                    //     // [ext]: 使用之前的文件扩展名
                    //     // [query]: 添加之前的query参数
                    //     filename: "static/imgs/[hash:8][ext][query]",
                    // },
                },
                {
                    test: /\.(ttf|woff2|mp3|mp4|avi?)$/,
                    type: "asset/resource", //"asset/resource"->将资源原封不动输出
                    // generator: {
                    //     // [query]: 添加之前的query参数
                    //     filename: "static/media/[hash:8][ext][query]",
                    // },
                },
                {
                    //babel编译es6语法，向下兼容，解决个别浏览器的兼容问题
                    test: /\.js$/,
                    exclude: /node_modules/, // 排除node_modules代码不编译
                    use: [{
                            loader: "thread-loader", //开启多进程,对babel进行处理(多进程模拟多线程)
                            options: {
                                works: threads,
                            }
                        },
                        {
                            loader: "babel-loader",
                            options: {
                                cacheDirectory: true, //开启babel缓存
                                cacheCompression: false, //关闭缓存压缩(连缓存都压缩的话会变慢)
                                plugins: ["@babel/plugin-transform-runtime"], // 减少代码体积
                            },

                        }
                    ]
                },
            ]
        }],
    },
    //扩展webpack功能
    plugins: [
        new ESLintWebpackPlugin({
            //检测哪些文件的文件路径
            context: path.resolve(__dirname, '../src'),
            exclude: "node_modules",
            cache: true,
            cacheLocation: path.resolve(__dirname, "../node_modules/.cache/eslintcache"),
            threads, //开启多进程,对eslint进行处理
        }),
        new HtmlWebpackPlugin({
            //模板，以public/index.html文件创建新的html文件
            //新建的html文件特点：1、结构与原来一致;2、自动引入打包输出的资源
            template: path.resolve(__dirname, "../public/index.html")
        })
    ],
    optimization: {
        //放置压缩的操作
        minimize: true,
        minimizer: [
            // css压缩也可以写到optimization.minimizer里面，效果一样的
            new CssMinimizerPlugin(),
            // 当生产模式会默认开启TerserPlugin，但是我们需要进行其他配置，就要重新写了
            new TerserPlugin({
                parallel: threads // 开启多进程
            })
        ],
    },
    // 开发服务器，实现自动化打包更新
    devServer: {
        host: "localhost", // 启动服务器域名
        port: "3000", // 启动服务器端口号
        open: true, // 是否自动打开浏览器
        hot: true, // 开启HMR功能（只能用于开发环境，生产环境不需要了,默认设置）
    },
    mode: "development",
    devtool: "cheap-module-source-map",
}