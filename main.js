var fs =  require('fs')
var path_module = require('path')
var crypto = require("crypto");
const BASE64_KEYS= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
var SETTINGS_EXAMPLE_PATH ="packages://bundle/bundleSettings.json"
var SETTINGS_PATH =Editor.Project.path + "/bundleSettings.json"
var uuidMap ={}
var rawMap ={}
var settings
function getDep(bundleId){
  uuidMap ={}
  rawMap ={}
  if(!settings.bundleToUuid || !settings.bundleToUuid[bundleId]){
    return
  }
  settings.bundleToUuid[bundleId].forEach(uuid => {
    queryDepList(uuid)
  });
  Editor.log(uuidMap)
  Editor.log(rawMap)

}
function getTree(bundleId){
  if(!settings.bundleToUuid || !settings.bundleToUuid[bundleId]){
    return
  }
  var result =[]
  settings.bundleToUuid[bundleId].forEach(uuid => {
    var tree = buildTree(uuid)
    result.push(tree)
  });
  return result
}
function queryDepList(uuid,parent){
  var fspath = Editor.assetdb.uuidToFspath(uuid)
  var path = Editor.assetdb.uuidToUrl(uuid)
  var info = Editor.assetdb.assetInfoByUuid(uuid)
  var type =info.type
  var isSub = info.isSubAsset
  if(isSub){
    return
  }
  uuidMap[uuid] =path
  if(type === 'sprite-atlas'){
    uuid = Editor.assetdb.loadMetaByUuid(uuid).rawTextureUuid
    rawMap[uuid] = Editor.assetdb.uuidToUrl(uuid)
    uuidMap[uuid] =Editor.assetdb.uuidToUrl(uuid)
    return
  }
  if(type === 'bitmap-font'){
    uuid = Editor.assetdb.loadMetaByUuid(uuid).textureUuid
    rawMap[uuid] = Editor.assetdb.uuidToUrl(uuid)
    uuidMap[uuid] =Editor.assetdb.uuidToUrl(uuid)
    return
  }
  if(type === 'effect'){
    return
  }
  if(type !== 'prefab' && type !== 'material' && type !== 'animation-clip'){
    rawMap[uuid]=path
    return
  }
  function queryJson(obj){
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        // Editor.log(typeof(element))
        if (typeof (element) === 'object'){
          queryJson(element)
        }
        else if(key === '__uuid__'){
          if(!uuidMap[element]){
            queryDepList(element)
          }

        }
      }
    }
  }
  var jsonString = fs.readFileSync(fspath)
  var jsonObj=JSON.parse(jsonString)
  queryJson(jsonObj)
}
function loadSettings(){
  var url = SETTINGS_PATH
  var isexists =fs.existsSync(url)
  if(!isexists){
    fs.writeFileSync(url,fs.readFileSync(Editor.url(SETTINGS_EXAMPLE_PATH)))
  }
  var jsonString = fs.readFileSync(url)
  var json=JSON.parse(jsonString)
  settings = json
}
function saveSettings(){
  var url = SETTINGS_PATH
  fs.writeFileSync(url,JSON.stringify(settings))
}

function setBundle(arg){
  var info = Editor.assetdb.assetInfoByUuid(arg.uuid)
  if(info.type === "folder"){
    var filelist =fs.readdirSync(info.path)
    filelist.forEach((f=>{
      var newArg = {}
      newArg.bundleId = arg.bundleId
      var newPath = path_module.join(info.path,f)
      var newUUid =  Editor.assetdb.fspathToUuid(newPath)
      if(!newUUid) return
      newArg.uuid =newUUid
      setBundle(newArg)
    }))
    return
  }
  var orginBundleIdx  = null
  function deleteBundle(){
    settings.bundleToUuid[orginBundleIdx]= settings.bundleToUuid[orginBundleIdx].filter((b)=>{
      return b !== arg.uuid
    })
    if(settings.bundleToUuid[orginBundleIdx].length ===0){
      settings.bundleToUuid.splice(orginBundleIdx,1)
      settings.bundleIdList.splice(orginBundleIdx,1)
    }
    delete settings.uuidToBundle[arg.uuid]
  }
  function addBundle(){
    var idx = settings.bundleIdList.indexOf(arg.bundleId)
    if(idx === -1){
      settings.bundleIdList.push(arg.bundleId)
      idx = settings.bundleIdList.length -1
    }
    if(!settings.bundleToUuid[idx]){
      settings.bundleToUuid[idx] = []
    }
    settings.bundleToUuid[idx].push(arg.uuid)
    settings.uuidToBundle[arg.uuid] = idx

  }



  if(!arg || !arg.uuid ) return
  orginBundleIdx = settings.uuidToBundle[arg.uuid]
  if(!arg.bundleId && orginBundleIdx !== null){
    deleteBundle()
    return
  }
  if(orginBundleIdx ==null){
    addBundle()
    return
  }
  deleteBundle()
  addBundle()
}
function exportSettings(url){
  var l = settings.bundleToUuid.length
  var data = {}
  for(var i=0;i<l;i++){
    var node = getTree(i)
    data[settings.bundleIdList[i]]=node
  }
  if(!url){
    url ="db://assets/resources/table/t_bundle.json"
  }
  var exisit = Editor.assetdb.exists(url);
  if(exisit){
    Editor.assetdb.saveExists(url,JSON.stringify(data))
  }else{
    Editor.assetdb.create(url,JSON.stringify(data))
  }
}


function buildTree(uuid,parent){
  var fspath = Editor.assetdb.uuidToFspath(uuid)
  if(!fspath) {
    Editor.warn(uuid)
    Editor.warn(parent.path)
    return
  }
  var path = Editor.assetdb.uuidToUrl(uuid)
  var info = Editor.assetdb.assetInfoByUuid(uuid)
  var type =info.type
  var isSub = info.isSubAsset
  var encodeId = encode(uuid.split("-").join(""))
  var treeNode = {
    uuid:uuid,
    path:path,
    children:[],
    type:type,
    md5:"",
    encodeId:encodeId
  }
  if(isSub){
    return
  }

  var jsonString = fs.readFileSync(fspath)
  treeNode.md5 = crypto.createHash("md5").update(jsonString || "", "latin1").digest("hex").slice(0, 5);
  if(type === 'sprite-atlas'){
    return treeNode
  }
  if(type === 'bitmap-font'){
    return treeNode
  }
  if(type === 'effect'){
    return treeNode
  }
  if(type !== 'prefab' && type !== 'material' && type !== 'animation-clip'){
    return treeNode
  }

  function queryTreeJson(obj){
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        // Editor.log(typeof(element))
        if (typeof (element) === 'object'){
          queryTreeJson(element)
        }
        else if(key === '__uuid__'){
          if(element !== uuid){
            var child = buildTree(element,treeNode)
            if(child) treeNode.children.push(child)
          }
        }
      }
    }
  }
  var jsonObj=JSON.parse(jsonString)
  queryTreeJson(jsonObj)
  return treeNode
}
function encode(guild_str) {
    let testInput = guild_str
    let testoutput = []

    testoutput[0] = testInput[0]
    testoutput[1] = testInput[1]

    for (var i = 2, j = 2; i < 32; i += 3) {
		var l1 = testInput[i + 0]
		var l2 = testInput[i + 1]
		var l3 = testInput[i + 2]

		var n1 = parseInt(l1, 16)
		var n2 = parseInt(l2, 16)
		var n3 = parseInt(l3, 16)

		var lhs = n1 << 2 | n2 >> 2
		var rhs = (n2 & 3) << 4 | (n3 & 0xF)
		testoutput[j++] = BASE64_KEYS[lhs]
		testoutput[j++] = BASE64_KEYS[rhs]
	}

	return testoutput.join("");
}
function test(){
  // var info = Editor.assetdb.assetInfoByUuid("842b09e6-8c5f-4a15-a001-c34c88e7faa2")
  // Editor.log(info)
}

module.exports = {
  load () {
    loadSettings()
  },

  unload () {
    saveSettings()
  },

  messages: {
    'showDep' (_,bundleId) {
      getDep(bundleId);
    },
    'showTree' (_,bundleId){
      getTree(bundleId)
    },
    'open'() {
      test()
      Editor.Panel.open('bundle',JSON.stringify(settings));
    },
    'scene:enter-prefab-edit-mode'(event,arg){
      Editor.Ipc.sendToPanel("bundle","chosen",arg)
    },
    'setBundle'(event,arg){
      setBundle(arg)
      saveSettings()
      var s = JSON.stringify(settings)
      event.reply(null,s)
    },
    'export'(_,url){
      exportSettings(url)
    }
  },
};