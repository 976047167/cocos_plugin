var fs =  require('fs')
var SETTINGS_EXAMPLE_PATH ="packages://bundle/bundleSettings.json"
var SETTINGS_PATH =Editor.Project.path+"/bundleSettings.json"
var uuidMap ={}
var rawMap ={}
var settings
function showDep(bundleId){
  uuidMap ={}
  rawMap ={}
  if(!settings.bundleToUuid || !settings.bundleToUuid[bundleId]){
    return
  }
  settings.bundleToUuid[bundleId].forEach(uuid => {
    getDepList(uuid)
  });
  Editor.log(uuidMap)
  Editor.log(rawMap)

}
function getDepList(uuid){
  var fspath = Editor.assetdb.uuidToFspath(uuid)
  var path = Editor.assetdb.uuidToUrl(uuid)
  var info = Editor.assetdb.assetInfoByUuid(uuid)
  var type =info.type
  var isSub = info.isSubAsset
  if(isSub){
    return
  }
  // Editor.log(uuid)
  // Editor.log(type)
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
            getDepList(element)
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
function exportSettings(){
  var l = settings.bundleToUuid.length
  var data = {}
  for(var i=0;i<l;i++){
    showDep(i)
    // var list =[]
    // for (var key in rawMap) {
    //   if (rawMap.hasOwnProperty(key)) {
    //     var element = rawMap[key];
    //     list.push(element)

    //   }
    // }
    data[settings.bundleIdList[i]]=uuidMap
  }
  var url ="db://assets/resources/table/t_bundle.json"
  var exisit = Editor.assetdb.exists(url);
  if(exisit){
    Editor.assetdb.saveExists(url,JSON.stringify(data))
  }else{
    Editor.assetdb.create(url,JSON.stringify(data))
  }
}


function buildTree(uuid,parent,tree){
        // if (tree.length === 1) {
        //     return tree[0];
        // }
        // const left = tree.pop();
        // const right = tree.pop();
        // const newTreeNode = {
        //     left,
        //     right,
        //     char: -1,
        //     value: newValue,
        // };
        // let i = 0;
        // while (i < tree.length && newValue < tree[i].value ) {
        //     i++;
        // }
        // tree.splice(i, 0, newTreeNode);
        // return buildTree(tree);
}


module.exports = {
  load () {
    loadSettings()
  },

  unload () {
    saveSettings()
  },

  messages: {
    'showDep' (_,uuid) {
      showDep(uuid);
    },
    'open'() {
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
    'export'(){
      exportSettings()
    }
  },
};