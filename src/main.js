import count from './js/count';
import sum from './js/sum';
//想要打包资源，就先引入该资源
import "./css/index.css";
import './less/index.less';
import './sass/index.sass';
import "./sass/index.scss";
import "./styl/index.styl";
import "./css/iconfont.css";

//var result = count(2,1);
console.log(count(2, 1));
console.log(sum(1, 2, 3, 4));
document.getElementById("btn").onclick = function() {
    //eslint不能识别动态导入语法,需要增加配置
    //webpackChunkName:"math" webpack魔法命名
    import (
        /*webpackChunkName:"math"*/
        './js/math').then(({ mul }) => {
        console.log(mul(3, 6));

    })
}
if (module.hot) {
    module.hot.accept("./js/count");
    module.hot.accept("./js/sum");
}