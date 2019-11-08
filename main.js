const { getrees,getDepList } = require("./libs/query-depends");
const { copyFile } = require("./libs/build-copy");
var fs = require('fs')
var path_module = require('path')
var SETTINGS_PATH = Editor.Project.path + "/config/bundleSettings.json"
var settings={
  "bundleIdList":[],
  "bundleAsset":[],
  "bundleKeepMark":[]
}
var bundleInfo={}
function getDep(bundleId) {
  if (!bundleInfo.bundleToUuid || !bundleInfo.bundleToUuid[bundleId]) {
    return
  }
  var result = getDepList(bundleInfo.bundleToUuid[bundleId])
  Editor.log(result.uuidMap)
  Editor.log(result.rawMap)

}
function getRootList(bundleId) {
  if (!bundleInfo.bundleToUuid || !bundleInfo.bundleToUuid[bundleId]) {
    return
  }
  var result = getrees(bundleInfo.bundleToUuid[bundleId])
  return result
}
function loadSettings() {
  var url = SETTINGS_PATH
  var isexists = fs.existsSync(url)
  if (!isexists) {
    fs.writeFileSync(url, JSON.stringify(settings))

  }else{
    var jsonString = fs.readFileSync(url)
    var json = JSON.parse(jsonString)
    settings = json

  }
  try{
    loadBundleInfo()
  }catch(e){
    Editor.log(e)
  }
}
function loadBundleInfo(){
  bundleInfo.bundleIdList = settings.bundleIdList
  bundleInfo.bundleKeepMark = settings.bundleKeepMark
  bundleInfo.uuidToBundle ={}
  bundleInfo.bundleToUuid =[]

  function parseInfo(idx,uuid) {
    if (!bundleInfo.bundleToUuid[idx]) {
      bundleInfo.bundleToUuid[idx] = []
    }
    bundleInfo.bundleToUuid[idx].push(uuid)
    bundleInfo.uuidToBundle[uuid] = idx
  }

  for (var i =0 ;i<settings.bundleIdList.length;i++){
    for (var j = 0;j<settings.bundleAsset[i].length;j++){
      var uuid = settings.bundleAsset[i][j]
      var info = Editor.assetdb.assetInfoByUuid(uuid)
      if(!info){
        Editor.log(uuid)
        return
      }
      if (info.type === "folder"){
        var filelist = fs.readdirSync(info.path)
        filelist.forEach(f=>{
          var subPath = path_module.join(info.path, f)
          var subUuid = Editor.assetdb.fspathToUuid(subPath)
          if (!subUuid) return
          var subInfo = Editor.assetdb.assetInfoByUuid(subUuid)
          if (subInfo.type === "folder"){
            return
          }
          parseInfo(i,subUuid)
        })
      }else{
        parseInfo(i,uuid)
      }
    }
  }

}
function saveSettings() {
  var url = SETTINGS_PATH
  fs.writeFileSync(url, JSON.stringify(settings))
}

function setBundle(arg) {
  settings.bundleAsset = settings.bundleAsset.map(bundle=>{
    return bundle.filter(uuid=>{return uuid !== arg.uuid })
  }).filter((bundle1,idx)=>{
    if(bundle1.length !==0)return true
    settings.bundleIdList[idx] = false
    return false
  })
  settings.bundleIdList = settings.bundleIdList.filter(id=>{
    return !!id
    }
  )
  if(!arg.bundleId && arg.bundleId!==0){
    return
  }
  var idx = settings.bundleIdList.indexOf(arg.bundleId)
  if(idx === -1){
    settings.bundleIdList.push(arg.bundleId)
    idx = settings.bundleIdList.length -1
  }
  if(!settings.bundleAsset[idx]){
    settings.bundleAsset[idx]=[]
  }
  settings.bundleAsset[idx].push(arg.uuid)
  loadBundleInfo()
}
function exportSettings(url) {
  var l = bundleInfo.bundleToUuid.length
  var data = {}
  Editor.log("Exporting bundles start")
  for (var i = 0; i < l; i++) {
    Editor.log("Exporting bundle"+bundleInfo.bundleIdList[i])
    var rootList = getRootList(i)
    data[bundleInfo.bundleIdList[i]] = rootList
  }
  if (!url) {
    url = "db://assets/resources/t_bundle.json"
  }
  if (!url.startsWith("db://")) {
    url = "db://" + url
  }
  var exisit = Editor.assetdb.exists(url);
  if (exisit) {
    Editor.assetdb.saveExists(url, JSON.stringify(data))
  } else {
    Editor.assetdb.create(url, JSON.stringify(data))
  }
  Editor.log("Exporting bundles finished")
}


function test() {
}
function keepFile(options, callback) {
  Editor.log(JSON.stringify(options))
  if(options.platform !== "wechatgame"){
    callback()
    return
  }
  loadSettings()
  if (!bundleInfo.bundleToUuid ||
     !bundleInfo.bundleKeepMark) {
    return
  }
  var uuidlist=[]
  for (const key in bundleInfo.bundleKeepMark) {
    if (bundleInfo.bundleKeepMark.hasOwnProperty(key)) {
      const f = !!bundleInfo.bundleKeepMark[key];
      if(f){
        bundleInfo.bundleToUuid[key].forEach(uuid => {
          uuidlist.push(uuid)
        });
      }

    }
  }
  var rawMap= getDepList(uuidlist).rawMap
  copyFile(options.dest,Object.keys(rawMap),callback)


}
function exportOnBuild(options,callback){
  loadSettings()
  exportSettings()
  callback()
}

module.exports = {
  load() {
    Editor.Builder.on('build-start', exportOnBuild);
    Editor.Builder.on('build-finished', keepFile);

  },

  unload() {
    Editor.Builder.removeListener('build-start', exportOnBuild);
    Editor.Builder.removeListener('build-finished', keepFile);
  },

  messages: {
    'scene:ready'(){
      loadSettings()
      exportSettings()
    },
    'showDep'(_, bundleId) {
      getDep(bundleId);
    },
    'showTree'(_, bundleId) {
      var result = getRootList(bundleId)
      Editor.log(result)
    },
    'open'() {
      test()
      loadSettings()
      Editor.Panel.open('bundle', JSON.stringify(settings));
    },
    'scene:enter-prefab-edit-mode'(event, arg) {
      Editor.Ipc.sendToPanel("bundle", "chosen", arg)
    },
    'setBundle'(event, arg) {
      setBundle(arg)
      var s = JSON.stringify(settings)
      event.reply(null, s)
    },
    'export'(_, url) {
      exportSettings(url)
    },
    'save'() {
      saveSettings()
    },
    'cancel'(event) {
      loadSettings()
      var s = JSON.stringify(settings)
      event.reply(null, s)
    },
    'keep'(_, arg) {
      bundleInfo.bundleKeepMark[arg.bundleId] = arg.keep
    },
    'clear'(event,arg){
      settings={
        "bundleIdList":[],
        "bundleAsset":[],
        "bundleKeepMark":[]
      }
      loadBundleInfo()
      var s = JSON.stringify(settings)
      event.reply(null, s)
    },
    'analyse'(_, uuid) {
      var result = {}
      function queryChildren(node,uuid){
        if(node.children.length === 0) return
        node.children.forEach(child=>{
          if(child.uuid === uuid){
            result[node.path] =bundleInfo.bundleIdList[bundleInfo.uuidToBundle[node.uuid]]
            return
          }
          queryChildren(child,uuid)
        })

      }
      var l = bundleInfo.bundleToUuid.length
      for (var i = 0; i < l; i++) {
        var list = getRootList(i)
        list.forEach((node)=>{
          queryChildren(node,uuid)
        })
      }
      Editor.log(result)
    },

  },
};