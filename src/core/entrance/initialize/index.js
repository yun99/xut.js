/**
 * app初始化功能
 * @return {[type]} [description]
 */
import { initAsyn } from './asyn'
import { initRootNode } from '../../expand/root-node'
import { initGlobalEvent } from './golbal-event'
import { nextTick, $warn } from '../../util/index'

import { initAudio } from '../../component/audio/api'
import { initVideo } from '../../component/video/api'
import { initGlobalAPI } from '../../api/global-api/index'

/**
 * 代码初始化
 */
initAudio()
initVideo()
initGlobalAPI()

export default function initApp(options, callback) {
  /*针对异步的代码以前检测出来*/
  initAsyn(() => {
    //全局的一些事件处理
    initGlobalEvent();
    //根节点
    const { $rootNode, $contentNode } = initRootNode(options);
    $warn('logic', '初始化设置参数完成')
    nextTick({
      container: $rootNode,
      content: $contentNode
    }, callback)
  })
}