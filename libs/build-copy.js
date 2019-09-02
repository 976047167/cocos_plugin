var fs =  require('fs')
function copyFile(dest,uuidList,callback)
{
    if(!fs.existsSync(dest+"/res/raw-assets1")){
        fs.mkdirSync(dest+"/res/raw-assets1")
    }
    uuidList.forEach(uuid=>{
        var path = dest+"/res/raw-assets/"+uuid.slice(0,2)
                // Editor.log(path2)
        var isexists =fs.existsSync(path)
        if(!isexists) return
        var rawList =fs.readdirSync(path)
        rawList.forEach(r=>{
            if(r.indexOf(uuid)===-1) return
            var dir =dest+"/res/raw-assets1/"+uuid.slice(0,2)+"/"
            try{
                if(!fs.existsSync(dir)){
                    fs.mkdirSync(dir)
                }
                fs.writeFileSync(dir+r,fs.readFileSync(path+"/"+r))
            }catch(e){
                Editor.log(e)
                //
            }
        })
    })
    callback()
}

exports.copyFile=copyFile;