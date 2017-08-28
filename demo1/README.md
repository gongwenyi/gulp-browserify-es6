# ES6 + Babel + Browserify + Gulp demo project

使用gulp+browserify搭建es6前端开发环境

本项目包含两个例子，分别在demo1和demo2目录下，下面介绍这两个demo的不同之处


## demo1
这种方式每个页面都有一个入口文件，在html页面中需要引入对应的入口文件，这种方式的缺点是如果两个入口文件都引入了相同的模块，那么这个模块的源码在打包完成后就会存在于这两个文件中，比如a.js和b.js都引入了jQuery，那么打包完后a.js和b.js都会包含jQuery源码，会造成资源浪费。
* cd demo1
* run `npm install`
* run gulp
执行完上述命令之后，会打包项目文件到dist目录，

## demo2
demo2是为了解决demo1中的公共模块被多次加载的问题，demo2只有一个endty.js入口文件，这个入口文件引入项目中用到的所有js文件，打包完成后每个页面都只需要引入这一个文件就行了，这种和单页应用非常类似，这种方式的缺点是首页加载比较慢，但是整体性能比demo1这种方式要好。

* cd demo2
* run `npm install`
* run gulp
