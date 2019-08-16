// panel/index.js
var logic={
  uuid:null,
  settings:null,
 }

 var myself = null


var panel ={
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

  template: `
    <h2>AssetBundle</h2>
    <hr />
    <div>uuid: <span id="label">--</span></div>
    <hr />
    <br />
    <ui-asset id="asset" class="flex-1" type="prefab" droppable="asset"></ui-asset>
    <ui-input id="input" placeholder="bundle"></ui-input>
    <ui-button id="btnAdd">set bundle</ui-button>
    <ui-button id="btnDel">delete</ui-button>
    <hr />
    <div id="area" > </div>
    <ui-select id="select" value="-1"> </ui-select>
    <ui-button id="btn">show depends</ui-button>
    <hr />
    <ui-input id="input2" placeholder="resources/table/"></ui-input>
    <ui-button id="btnExport">export</ui-button>

  `,

  $: {
    btn: '#btn',
    label: '#label',
    select:'#select',
    asset:'#asset',
    input:'#input',
    btnAdd:'#btnAdd',
    btnDel:'#btnDel',
    btnExport:'#btnExport',
    area:"#area"
  },

  ready () {
    myself = this
    this.$btn.addEventListener('confirm', () => {
      Editor.Ipc.sendToMain('bundle:showDep',this.$select.value)
    });
    this.$asset.addEventListener('change',()=>{
      this.chosen()
    })
    this.$btnAdd.addEventListener('confirm',()=>{
      if (!this.$input.value) {
        return
      }
      var msg ={
          uuid:logic.uuid,
          bundleId:this.$input.value
        }
        Editor.Ipc.sendToMain("bundle:setBundle",msg,(err,argv)=>{
          this.run(argv)
        })
    })
    this.$btnDel.addEventListener('confirm',()=>{
      if (!this.$input.value) {
        return
      }
      var msg ={
          uuid:logic.uuid,
        }
        Editor.Ipc.sendToMain("bundle:setBundle",msg,(err,argv)=>{
          this.run(argv)
        })
    })
    this.$btnExport.addEventListener('confirm',()=>{
        Editor.Ipc.sendToMain("bundle:export")
    })
  },
  run(argv){
    var settings = JSON.parse(argv)
    logic.settings = settings
    this.$select.innerHTML=""
    this.$area.innerHTML = ''
    for(var i=0;i <settings.bundleIdList.length;i++)
    {
      var option = document.createElement("option")
      option.text = settings.bundleIdList[i]
      option.value = i
      this.$select.appendChild(option)
      var csstxt = "<ui-section folded=true readonly=true>"
      csstxt+='<div class="header">'+settings.bundleIdList[i]+'</div>'
      csstxt+='<br />'
      for (var j = 0;j<settings.bundleToUuid[i].length;j++){
        var id = settings.bundleToUuid[i][j]
        csstxt += "<ui-asset value="+ id+"></ui-asset>"
        csstxt+='<br />'
      }
      csstxt+= "</ui-section>"
      this.$area.innerHTML += csstxt
    }
  },
  chosen(){
      logic.uuid =  this.$asset.value
      this.$label.innerText = logic.uuid
      var bundleId = logic.settings.uuidToBundle[logic.uuid]
      if(bundleId){
        this.$input.value = logic.settings.bundleIdList[bundleId]
      }

  },
  messages: {
    'chosen' :(_,uuid)=> {
      myself.$asset.value =uuid
      myself.chosen()
    },
  },
}
Editor.Panel.extend(panel);