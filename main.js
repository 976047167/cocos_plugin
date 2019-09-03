const { getrees,getDepList } = require("./libs/query-depends");
const { copyFile } = require("./libs/build-copy");
var fs = require('fs')
var path_module = require('path')
var SETTINGS_EXAMPLE_PATH = "packages://bundle/bundleSettings.json"
var SETTINGS_PATH = Editor.Project.path + "/bundleSettings.json"
var settings={
  "bundleIdList":[],
  "uuidToBundle":{},
  "bundleToUuid":[],
  "bundleKeepMark":[]
}
function getDep(bundleId) {
  if (!settings.bundleToUuid || !settings.bundleToUuid[bundleId]) {
    return
  }
  var result = getDepList(settings.bundleToUuid[bundleId])
  Editor.log(result.uuidMap)
  Editor.log(result.rawMap)

}
function getRootList(bundleId) {
  if (!settings.bundleToUuid || !settings.bundleToUuid[bundleId]) {
    return
  }
  var result = getrees(settings.bundleToUuid[bundleId])
  return result
}
function loadSettings() {
  var url = SETTINGS_PATH
  var isexists = fs.existsSync(url)
  if (!isexists) {
    fs.writeFileSync(url, settings)
    return
  }
  var jsonString = fs.readFileSync(url)
  var json = JSON.parse(jsonString)
  settings = json
}
function saveSettings() {
  var url = SETTINGS_PATH
  fs.writeFileSync(url, JSON.stringify(settings))
}

function setBundle(arg) {
  var info = Editor.assetdb.assetInfoByUuid(arg.uuid)
  if (info.type === "folder") {
    var filelist = fs.readdirSync(info.path)
    filelist.forEach((f => {
      var newArg = {}
      newArg.bundleId = arg.bundleId
      var newPath = path_module.join(info.path, f)
      var newUUid = Editor.assetdb.fspathToUuid(newPath)
      if (!newUUid) return
      newArg.uuid = newUUid
      setBundle(newArg)
    }))
    return
  }
  var orginBundleIdx = undefined
  function deleteBundle() {
    settings.bundleToUuid[orginBundleIdx] = settings.bundleToUuid[orginBundleIdx].filter((b) => {
      return b !== arg.uuid
    })
    if (settings.bundleToUuid[orginBundleIdx].length === 0) {
      settings.bundleToUuid.splice(orginBundleIdx, 1)
      settings.bundleIdList.splice(orginBundleIdx, 1)
    }
    delete settings.uuidToBundle[arg.uuid]
  }
  function addBundle() {
    if (arg.bundleId === null || arg.bundleId === undefined) {
      return
    }
    var idx = settings.bundleIdList.indexOf(arg.bundleId)
    if (idx === -1) {
      settings.bundleIdList.push(arg.bundleId)
      idx = settings.bundleIdList.length - 1
    }
    if (!settings.bundleToUuid[idx]) {
      settings.bundleToUuid[idx] = []
    }
    settings.bundleToUuid[idx].push(arg.uuid)
    settings.uuidToBundle[arg.uuid] = idx

  }


  if (!arg || !arg.uuid) return
  orginBundleIdx = settings.uuidToBundle[arg.uuid]
  if (!arg.bundleId && orginBundleIdx !== undefined) {
    deleteBundle()
    return
  }
  if (orginBundleIdx == undefined) {
    addBundle()
    return
  }
  deleteBundle()
  addBundle()
}
function exportSettings(url) {
  var l = settings.bundleToUuid.length
  var data = {}
  for (var i = 0; i < l; i++) {
    var rootList = getRootList(i)
    data[settings.bundleIdList[i]] = rootList
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
}


function test() {
  // var info = Editor.assetdb.assetInfoByUuid("842b09e6-8c5f-4a15-a001-c34c88e7faa2")
  // Editor.log(info)
}
function keepFile(options, callback) {
  if (!settings.bundleToUuid ||
     !settings.bundleKeepMark) {
    return
  }
  var uuidlist=[]
  for (const key in settings.bundleKeepMark) {
    if (settings.bundleKeepMark.hasOwnProperty(key)) {
      const f = !!settings.bundleKeepMark[key];
      if(f){
        settings.bundleToUuid[key].forEach(uuid => {
          uuidlist.push(uuid)
        });
      }

    }
  }
  var rawMap= getDepList(uuidlist).rawMap
  copyFile(options.dest,Object.keys(rawMap),callback)


}

module.exports = {
  load() {
    Editor.Builder.on('build-finished', keepFile);
    loadSettings()
  },

  unload() {
    Editor.Builder.removeListener('build-finished', keepFile);
  },

  messages: {
    'showDep'(_, bundleId) {
      getDep(bundleId);
    },
    'showTree'(_, bundleId) {
      var result = getRootList(bundleId)
      Editor.log(result)
    },
    'open'() {
      test()
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
      settings.bundleKeepMark[arg.bundleId] = arg.keep
    },
    'clear'(event,arg){
      settings={
        "bundleIdList":[],
        "uuidToBundle":{},
        "bundleToUuid":[],
        "bundleKeepMark":[]
      }
      var s = JSON.stringify(settings)
      event.reply(null, s)
    },
    'analyse'(_, uuid) {
      var result = {}
      function queryChildren(node,uuid){
        if(node.children.length === 0) return
        node.children.forEach(child=>{
          if(child.uuid === uuid){
            result[node.path] =settings.bundleIdList[settings.uuidToBundle[node.uuid]]
            return
          }
          queryChildren(child,uuid)
        })

      }
      var l = settings.bundleToUuid.length
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