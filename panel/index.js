// panel/index.js
var logic={
  label:null,
  uuid:null,
  select:null,
  asset:null,
  settings:null,
 }
var panel ={
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

  template: `
    <h2>AssetBundle</h2>
    <hr />
    <div>uuid: <span id="label">--</span></div>
    <br />
    <ui-asset id="asset" class="flex-1" type="prefab" droppable="asset"></ui-asset>
    <ui-input id="input" placeholder="bundle"></ui-input>
    <ui-button id="btnAdd">set bundle</ui-button>
    <hr />
    <select id="select" value="-1"> </select>
    <ui-button id="btn">show depends</ui-button>
    <hr />
  `,

  $: {
    btn: '#btn',
    label: '#label',
    select:'#select',
    asset:'#asset',
    input:'#input',
    btnAdd:'#btnAdd'
  },

  ready () {
    logic.label= this.$label
    logic.select = this.$select
    logic.asset = this.$asset
    this.$btn.addEventListener('confirm', () => {
      Editor.Ipc.sendToMain('bundle:showDep',logic.select.value)
    });
    this.$asset.addEventListener('change',()=>{
      Editor.log(this.$asset.value)
      logic.uuid =  this.$asset.value
      this.$label.innerText = logic.uuid
      var bundleId = logic.settings.uuidToBundle[logic.uuid]
      if(bundleId){
        this.$input.value = logic.settings.bundleIdList[bundleId]
      }
    })
    this.$btnAdd.addEventListener('confirm',()=>{
        Editor.Ipc.sendToMain("setBundle",{uuid:logic.uuid,bundleId:this.$input.value},(argv)=>{
          this.run(argv)
        })
    })
  },
  run(argv){
    Editor.log(argv)
    // temp.select.empty()
    var settings = JSON.parse(argv)
    logic.settings = settings
    var optionLength= logic.select.options.length;
    for(var i=0;i <optionLength;i++)
    {
      logic.select.remove(i);
    }
    for(var i=0;i <settings.bundleIdList.length;i++)
    {
      var option = document.createElement("option")
      option.text = settings.bundleIdList[i]
      option.value = i
      logic.select.add(option)
    }
  },
  messages: {
    'chosen' :(_,uuid)=> {
      logic.asset.value =uuid
    },
  },
}
Editor.Panel.extend(panel);