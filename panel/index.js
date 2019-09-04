// panel/index.js
var section = Editor.UI.registerElement('seting-section', {
  bundleId:0,
  style:`
    :host { margin: 5px; }
    .contain {
      flex-direction :column;
      display: flex;
      height: 80%;
      overflow: scroll;
    } `,
  template: `
    <ui-section folded=true readonly=true>
    <div class="header" id="title">
    </div>
    <ui-checkbox id="checkbox">keep</ui-checkbox>
    <div class="contain" id="list">
    <br />
    </div>
    </ui-section>
  `,

  $: {
    checkbox:"#checkbox",
    title:"#title",
    list:"#list"
  },

  factoryImpl (settings ,i) {
    this.bundleId =i
    this.$checkbox.checked = !!settings.bundleKeepMark[i]
    this.$title.innerHTML=settings.bundleIdList[i]+this.$title.innerHTML
    let csstxt =""
    for (var j = 0;j<settings.bundleAsset[i].length;j++){
      var id = settings.bundleAsset[i][j]
      csstxt+= "<ui-asset value="+ id+"></ui-asset><br />"
    }
    this.$list.innerHTML+=csstxt
  },
  ready(){
      this.$checkbox.addEventListener('change',()=>{
      const arg={
        bundleId:this.bundleId,
        keep:this.$checkbox.checked
      }
      Editor.Ipc.sendToMain("bundle:keep",arg)
    })
  }
});

var logic={
  uuid:null,
  settings:null,
 }

 var myself = null


var panel ={
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    .mid {
      flex: 1;
      height: 60%;
      overflow: scroll;
    }
  `,

  template: `
    <h2>AssetBundle</h2>
    <hr />
    uuid: <span id="label">--</span>
    <hr />
    <br />
    <ui-asset id="asset" type="folder" droppable="asset"></ui-asset>
    <ui-input id="input" placeholder="bundle"></ui-input>
    <ui-button id="btnAdd">set bundle</ui-button>
    <ui-button id="btnDel">delete</ui-button>
    <br />
    <ui-asset id="asset2" type="cc.Asset" droppable="asset"></ui-asset>
    <ui-input id="input2" placeholder="bundle"></ui-input>
    <ui-button id="btnAdd2">set bundle</ui-button>
    <ui-button id="btnDel2">delete</ui-button>
    <ui-button id="btnAnalyse">analyse</ui-button>
    <hr />
    <div id="area" class="mid" > </div>
    <ui-select id="select" value="0"> </ui-select>
    <ui-button id="btn">show depends</ui-button>
    <ui-button id="btnTree">show tree</ui-button>
    <hr />
    <ui-input id="input2" placeholder="resources/table/"></ui-input>
    <ui-button id="btnExport">export</ui-button>
    <hr />
    <ui-button id="btnSave">save</ui-button>
    <ui-button id="btnCancel">cancel</ui-button>
    <ui-button id="btnClear">clear</ui-button>
  `,

  $: {
    btn: '#btn',
    label: '#label',
    select:'#select',
    asset:'#asset',
    asset2:'#asset2',
    input:'#input',
    input2:'#input2',
    btnAdd:'#btnAdd',
    btnAdd2:'#btnAdd2',
    btnDel:'#btnDel',
    btnDel2:'#btnDel2',
    btnExport:'#btnExport',
    area:"#area",
    btnTree:"#btnTree",
    input2:"#input2",
    btnSave:"#btnSave",
    btnClear:"#btnClear",
    btnCancel:"#btnCancel",
    btnAnalyse:"#btnAnalyse"
  },

  ready () {
    myself = this
    this.$btn.addEventListener('confirm', () => {
      Editor.Ipc.sendToMain('bundle:showDep',this.$select.value)
    });
    this.$asset.addEventListener('change',()=>{
      this.$asset2.value =""
      this.chosen(this.$asset.value)
    })
    this.$asset2.addEventListener('change',()=>{
      this.$asset.value =""
      this.chosen(this.$asset2.value)
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
    this.$btnAdd2.addEventListener('confirm',()=>{
      if (!this.$input2.value) {
        return
      }
      var msg ={
          uuid:logic.uuid,
          bundleId:this.$input2.value
        }
        Editor.Ipc.sendToMain("bundle:setBundle",msg,(err,argv)=>{
          this.run(argv)
        })
    })
    this.$btnDel.addEventListener('confirm',()=>{
      var msg ={
          uuid:logic.uuid,
        }
        Editor.Ipc.sendToMain("bundle:setBundle",msg,(err,argv)=>{
          this.run(argv)
        })
    })
    this.$btnDel2.addEventListener('confirm',()=>{
      var msg ={
          uuid:logic.uuid,
        }
        Editor.Ipc.sendToMain("bundle:setBundle",msg,(err,argv)=>{
          this.run(argv)
        })
    })
    this.$btnExport.addEventListener('confirm',()=>{
        Editor.Ipc.sendToMain("bundle:export",this.$input2.value)
    })
    this.$btnTree.addEventListener('confirm',()=>{
        Editor.Ipc.sendToMain('bundle:showTree',this.$select.value)
    })
    this.$btnSave.addEventListener('confirm',()=>{
        Editor.Ipc.sendToMain('bundle:save')
    })
    this.$btnClear.addEventListener('confirm',()=>{
        Editor.Ipc.sendToMain('bundle:clear',(err,argv)=>{
          this.run(argv)
        })
    })
    this.$btnCancel.addEventListener('confirm',()=>{
        Editor.Ipc.sendToMain('bundle:cancel',(err,argv)=>{
          this.run(argv)
        })
    })
    this.$btnAnalyse.addEventListener('confirm',()=>{
        Editor.Ipc.sendToMain("bundle:analyse",this.$asset2.value)
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
      let sec = new section(settings,i);
      this.$area.appendChild(sec)
    }
  },
  chosen(uuid){
      logic.uuid = uuid
      this.$label.innerText = logic.uuid
  },
  messages: {
    'chosen' :(_,uuid)=> {
      myself.$asset.value =uuid
      myself.chosen(uuid)
    },
  },
}
Editor.Panel.extend(panel);