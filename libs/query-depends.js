const { encode } = require("./encode");
var fs = require('fs');
var uuidMap = {};
var rawMap = {};
function buildTree(uuid, parent) {
    if(uuidMap[uuid]){
        return uuidMap[uuid]
    }
    var fspath = Editor.assetdb.uuidToFspath(uuid);
    if (!fspath) {
        Editor.warn(uuid);
        Editor.warn(parent || parent.path);
        return;
    }
    var path = Editor.assetdb.uuidToUrl(uuid);
    var info = Editor.assetdb.assetInfoByUuid(uuid);
    var type = info.type;
    var encodeId = encode(uuid.split("-").join(""));
    var treeNode = {
        uuid: uuid,
        path: path,
        children: [],
        type: type,
        encodeId: encodeId
    };
    if (type === 'sprite-frame' ) {
        uuid = Editor.assetdb.loadMetaByUuid(uuid).rawTextureUuid;
        treeNode = buildTree(uuid,parent)
    }
    if (type === 'bitmap-font') {
        uuid = Editor.assetdb.loadMetaByUuid(uuid).textureUuid;
        treeNode = buildTree(uuid,parent)
    }

    uuidMap[uuid] = treeNode;
    if (type !== 'prefab' && type !== 'material' && type !== 'animation-clip') {
        if(type !== 'effect'){
            rawMap[uuid] = treeNode;
        }
        return treeNode;
    }




    function queryTreeJson(obj) {
        for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const element = obj[key];
            // Editor.log(typeof(element))
            if (typeof (element) === 'object') {
            queryTreeJson(element);
            }
            else if (key === '__uuid__') {
            if (element !== uuid) {
                var child = buildTree(element, treeNode);
                if (child && treeNode.children.indexOf(child)=== -1)
                treeNode.children.push(child);
            }
            }
        }
        }
    }
    var jsonString = fs.readFileSync(fspath);
    var jsonObj = JSON.parse(jsonString);
    queryTreeJson(jsonObj);
    return treeNode;
}
function getrees(list){
    var result = []
    uuidMap={}
    rawMap={}
    list.forEach(uuid => {
      var rootNode = buildTree(uuid)
      result.push(rootNode)
    });
    return result
}
function getDepList(list){
    uuidMap={}
    rawMap={}
    list.forEach(uuid => {
       buildTree(uuid)
    });
    var _uuidMap ={}
    Object.keys(uuidMap).forEach(uuid=>{
        _uuidMap[uuid] = uuidMap[uuid].path
    })
    var _rawMap ={}
    Object.keys(rawMap).forEach(uuid=>{
        _rawMap[uuid] = rawMap[uuid].path
    })
    return {uuidMap:_uuidMap,rawMap:_rawMap}
}
exports.getrees = getrees;
exports.getDepList = getDepList;
