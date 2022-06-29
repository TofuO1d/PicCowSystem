const os = require("os");
const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const PreloadWebpackPlugin = require("@vue/preload-webpack-plugin");
const threads = os.cpus().length; //cps核数
// 获取处理样式的Loaders
const getStyleLoaders = (preProcessor) => {
    return [
        MiniCssExtractPlugin.loader,
        "css-loader",
        {
            loader: "postcss-loader",
            options: {
                postcssOptions: {
                    plugins: [
                        "postcss-preset-env", // 能解决大多数样式兼容性问题
                    ],
                },
            },
        },
        preProcessor,
    ].filter(Boolean);
};

module.exports = {
    entry: "./src/main.js",
    output: {
        path: path.resolve(__dirname, "../dist"), // 生产模式需要输出
        filename: "static/js/[name].js", // 将 js 文件输出到 static/js 目录中
        // [contenthash:8]使用contenthash，取8位长度
        filename: "static/js/[name].[contenthash:8].js", // 入口文件打包输出资源命名方式
        chunkFilename: "static/js/[name].[contenthash:8].chunk.js", // 动态导入输出资源命名方式
        clean: true,
    },
    module: {
        rules: [{
            oneOf: [{
                    // 用来匹配 .css 结尾的文件
                    test: /\.css$/,
                    // use 数组里面 Loader 执行顺序是从右到左
                    use: getStyleLoaders(),
                },
                {
                    test: /\.less$/,
                    use: getStyleLoaders("less-loader"),
                },
                {
                    test: /\.s[ac]ss$/,
                    use: getStyleLoaders("sass-loader"),
                },
                {
                    test: /\.styl$/,
                    use: getStyleLoaders("stylus-loader"),
                },
                {
                    test: /\.(png|jpe?g|gif|webp)$/,
                    type: "asset",
                    parser: {
                        dataUrlCondition: {
                            maxSize: 10 * 1024, // 小于10kb的图片会被base64处理
                        },
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
                    test: /\.(ttf|woff2?)$/,
                    type: "asset/resource",
                    // generator: {
                    //     filename: "static/media/[hash:8][ext][query]",
                    // },
                },
                {
                    test: /\.js$/,
                    //exclude: /node_modules/, // 排除node_modules代码不编译,其他的处理
                    include: path.resolve(__dirname, "../src"), //只处理src下面的文件，其他的不处理
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
    plugins: [
        new ESLintWebpackPlugin({
            // 指定检查文件的根目录
            context: path.resolve(__dirname, "../src"),
            exclude: "node_modules",
            cache: true,
            cacheLocation: path.resolve(__dirname, "../node_modules/.cache/eslintcache"),
            threads, //开启多进程,对eslint进行处理
        }),
        new HtmlWebpackPlugin({
            // 以 public/index.html 为模板创建文件
            // 新的html文件有两个特点：1. 内容和源文件一致 2. 自动引入打包生成的js等资源
            template: path.resolve(__dirname, "../public/index.html"),
        }),
        // 提取css成单独文件
        new MiniCssExtractPlugin({
            // 定义输出文件名和目录
            filename: "static/css/[name].css",
            chunkFilename: "static/css/[name].chunk.css"
        }),
        new PreloadWebpackPlugin({
            rel: "preload", // preload兼容性更好
            as: "script",
            // rel: 'prefetch' // prefetch兼容性更差
        }),
        // // css压缩
        // new CssMinimizerPlugin(),
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
            }),
            // 压缩图片
            new ImageMinimizerPlugin({
                minimizer: {
                    implementation: ImageMinimizerPlugin.imageminGenerate,
                    options: {
                        plugins: [
                            ["gifsicle", { interlaced: true }],
                            ["jpegtran", { progressive: true }],
                            ["optipng", { optimizationLevel: 5 }],
                            [
                                "svgo",
                                {
                                    plugins: [
                                        "preset-default",
                                        "prefixIds",
                                        {
                                            name: "sortAttrs",
                                            params: {
                                                xmlnsOrder: "alphabetical",
                                            },
                                        },
                                    ],
                                },
                            ],
                        ],
                    },
                },
            }),
        ],
        //代码分割操作
        splitChunks: {
            chunks: 'all'
        }
    },

    // devServer: {
    //   host: "localhost", // 启动服务器域名
    //   port: "3000", // 启动服务器端口号
    //   open: true, // 是否自动打开浏览器
    // },
    mode: "production",
    devtool: "source-map",
};