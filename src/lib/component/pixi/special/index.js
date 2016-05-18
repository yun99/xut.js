/**
 * 特殊pixi精灵动画
 * @param  {[type]} Utils   [description]
 * @param  {[type]} Config) {}          [description]
 * @return {[type]}         [description]
 */

import {
    Factory
} from '../factory'
import {
    parseJSON
}
from '../../../util/index'
/**
 * 创建高级精灵动画
 * @param  {[type]} data          [description]
 * @param  {[type]} contentPrefix [description]
 * @param  {[type]} path          [description]
 * @return {[type]}               [description]
 */
function spiritAni(data, path) {
    this.imagesArray = new Array();
    this.maskArray = new Array();
    //默认png格式资源
    this.resType = 0;
    //默认循环播放
    this.loop = 0;
    this.data = data;
    //this.contentPrefix = contentPrefix;
    this.ResourcePath = path;
    //this.action = this.data.params["actList"].split(",")[0];
    this.FPS = parseInt(data.fps);
    this.imageList = data.ImageList;
    //jpg+mask格式资源
    if (this.imageList[0].name.split(".")[1] == "jpg") {
        this.resType = 1;
    }
    this.dataWidth = data.width;
    this.firstTime = true;
    this.imageIndex = 0;
    //得到图片集合
    this.parseSpiritImages(data, path);
}

/**
 * 解析数据
 * @param  {[type]} data          [description]
 * @param  {[type]} contentPrefix [description]
 * @param  {[type]} path          [description]
 * @return {[type]}               [description]
 */
spiritAni.prototype.parseSpiritImages = function(data, path) {
    for (var i = 0; i < this.imageList.length; i++) {
        var temp = this.imageList[i];
        this.imagesArray.push(path + temp.name);
        if (this.resType) {
            this.maskArray.push(path + temp.name.split(".")[0] + "_mask.png")
        }
    }
}

/**
 * 绘制第一帧
 * @param  {[type]} canvasRelated [description]
 * @return {[type]}               [description]
 */
spiritAni.prototype.init = function(canvasRelated) {
    //初始化位置信息
    this.initPosition();

    //精灵场景容器
    var stage = new PIXI.Container();
    //加入容器
    canvasRelated.addChild(stage);

    this.texture = new Array();
    this.maskTexture = new Array();

    //jpg+mask蒙板
    if (this.resType) {
        for (var i = 0; i < this.maskArray.length; i++) {
            this.maskTexture[i] = PIXI.Texture.fromImage(this.maskArray[i]);
        }
        this.maskSprite = new PIXI.Sprite(this.maskTexture[0]);
        this.maskSprite.position.x = this.startPoint.x;
        this.maskSprite.position.y = this.startPoint.y;
        this.maskSprite.width = this.spiritWidth;
        this.maskSprite.height = this.spiritHeight;
        stage.addChild(this.maskSprite);
    }


    //png
    for (var i = 0; i < this.imagesArray.length; i++) {
        this.texture[i] = PIXI.Texture.fromImage(this.imagesArray[i]);
    }

    this.advSprite = new PIXI.Sprite(this.texture[0]);
    this.advSprite.position.x = this.startPoint.x;
    this.advSprite.position.y = this.startPoint.y;
    this.advSprite.width = this.spiritWidth;
    this.advSprite.height = this.spiritHeight;
    stage.addChild(this.advSprite);

    this.stage = stage;
};


//初始化位置信息
spiritAni.prototype.initPosition = function() {
    this.spiritWidth = parseInt(this.data.width);
    this.spiritHeight = parseInt(this.data.height);
    this.startPoint = {
        x: this.imageList[0].X,
        y: this.imageList[0].Y,
        w: parseInt(this.data.width),
        h: parseInt(this.data.height)
    };
};


//修正图片位置
spiritAni.prototype.changePosition = function(currentFrame) {
    var x = this.imageList[currentFrame].X;
    var y = this.imageList[currentFrame].Y;
    if (this.resType) {
        this.maskSprite.position.x = x;
        this.maskSprite.position.y = y;
    }
    this.advSprite.position.x = x;
    this.advSprite.position.y = y;
};


/**
 * 运动
 * @return {[type]} [description]
 */
spiritAni.prototype.runAnimate = function() {
    //第一次不运行
    if (!this.firstTime) {

        this.countNewFrame();
        var imageIndex = this.imageIndex;
        this.changePosition(imageIndex);


        //切换精灵的图片对象
        this.advSprite.texture = this.texture[imageIndex];

        if (this.resType) {
            this.maskSprite.texture = this.maskTexture[imageIndex];
        }
    }

    this.firstTime = false;
};


spiritAni.prototype.countNewFrame = function() {
    this.imageIndex++;
    if (this.imageIndex > this.imagesArray.length - 1) {
        if (this.loop == 0) {
            this.imageIndex = 0;
        } else {
            this.imageIndex = this.imagesArray.length - 1;
        }

    }
};


function getSpiritAni(inputPara, data) {
    var path = data.resourcePath;
    if (typeof inputPara == "object") {
        return new spiritAni(inputPara, path);
    } else {
        console.log("inputPara undefine Spirit")
        return {};
    }
}


function getResources(data) {
    var option;
    var ResourcePath = "content/gallery/" + data.md5 + "/";
    var xhr = new XMLHttpRequest();
    data.resourcePath = ResourcePath;

    xhr.open('GET', ResourcePath + 'app.json', false);
    xhr.send(null);
    try {
        option = parseJSON(xhr.responseText);
    } catch (e) {
        console.log("app.json get error:" + e);
    }
    return option;
}

var specialSprite = Factory.extend({

    /**
     * 初始化
     * @param  {[type]} data          [description]
     * @param  {[type]} canvasRelated [description]
     * @return {[type]}               [description]
     */
    constructor: function(successCallback, failCallback, data, canvasRelated) {
        var self = this;
        this.data = data;
        this.canvasRelated = canvasRelated;
        //id标示
        //可以用来过滤失败的pixi对象
        this.contentId = data._id;


        this.option = getResources(this.data);
        this.canvasRelated = canvasRelated;

        var spiritList = this.option.spiritList;

        this.sprObjs = [];

        for (var i = 0; i < spiritList.length; i++) {
            var paramObj = spiritList[i].params;
            var actLists = paramObj.actList.split(',');
            for (var k = 0; k < actLists.length; k++) {
                this.sprObjs.push(getSpiritAni(paramObj[actLists[k]], this.data));
            }

        }

        //运行状态
        this.animState = false;
        this.first = true;

        //初始化子对象
        this.sprObjs.forEach(function(obj) {
            obj.init(canvasRelated);
        })

        successCallback(this.contentId);

    },

    /**
     * 运行动画
     * @return {[type]} [description]
     */
    play: function() {
        //绘制页面
        var sprObjs = this.sprObjs;
        var self = this;
        this.uuid = this.canvasRelated.play('sprite', function() {
            sprObjs.forEach(function(obj, index) {
                self.timer = setTimeout(function() {
                    obj.runAnimate();
                }, 1000 / (obj.FPS || 10))
            })
        })

    },

    /**
     * 停止动画
     * @return {[type]} [description]
     */
    stop: function() {
        this.canvasRelated.stop(this.uuid)
    },


    /**
     * 销毁动画
     * @return {[type]} [description]
     */
    destroy: function() {
        //销毁添加到画布上的containers
        var addedContainers = this.canvasRelated.containerStage.children;
        for (var i = 0; i < addedContainers.length; i++) {
            var temp = addedContainers[i];
            temp.destroy(true);
        }
        this.canvasRelated.destroy();
    }


})


export {
    specialSprite
}