function _1(md){return(
md`# 合并单元格`
)}

function _container(html){return(
html`
<div>
  列数：<input type="number" min=1 max=30 v-model.number="cols" style="width:59px;" />
  行数：<input type="number" min=1 max=30 v-model.number="rows" style="width:59px;" />
  表头行数：<input type="number" min=0 max=30 v-model.number="hrows" style="width:59px;" />
  table宽度：<input v-model="width" style="width:59px;" />
</div>
<div>
  <div>合并列表</div>
  <div>
    <div v-for="(item,index) in merges">
      {{index+1}}. {{item}} 
      <span class="merge-item-del" @click="delMergeItemByIndex(index)">x</span>
    </div>
  </div>
</div>
<div>
  <div>使用鼠标选择要合并的单元格，然后点击 合并 按钮</div>
  <div>
    <button @click="btn_merge_click">合并</button>
  </div>
  <div style="padding:8px;">
    <table :style="{width:width}">
      <thead>
        <tr v-for="trs in outdata.thead">
          <th v-for="td in trs" v-bind="td.attrs"
            :class="{sel:showsel(td.type,td.rowindex,td.colindex)}" 
            @mousedown="th_mouse_keydown(td.rowindex,td.colindex)" 
            @mouseenter="th_mouse_move(td.rowindex,td.colindex)"
            @mouseup="th_mouse_keyup(td.rowindex,td.colindex)"
          >
            <template v-if="showsel(td.type,td.rowindex,td.colindex)">
              <input v-model="texts[td.type+'-'+td.rowindex+'-'+td.colindex]"/>
            </template>
            <template v-else>{{td.text||"&nbsp;"}}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trs in outdata.tbody">
          <td v-for="td in trs" v-bind="td.attrs"
            :class="{sel:showsel(td.type,td.rowindex,td.colindex)}" 
            @mousedown="td_mouse_keydown(td.rowindex,td.colindex)" 
            @mouseenter="td_mouse_move(td.rowindex,td.colindex)"
            @mouseup="td_mouse_keyup(td.rowindex,td.colindex)"
          >
            <template v-if="showsel(td.type,td.rowindex,td.colindex)">
              <input v-model="texts[td.type+'-'+td.rowindex+'-'+td.colindex]"/>
            </template>
            <template v-else>{{td.text||"&nbsp;"}}</template>
          </td>
        </tr>
      </tbody>
    </table>
    <textarea v-model="outhtml" style="height:300px;width:640px;"></textarea>
  </div>
</div>
`
)}

function _3(Vue,container){return(
new Vue({
  el:container,
  data(){
    return {
      width:'640px',
      hrows:1,
      rows:5,
      cols:5,
      seling:false,
      seltype:0, // 0 未选择 1 td 2 th
      begin_col:-1,
      begin_row:-1,
      end_col:-1,
      end_row:-1,
      merges:[
         [ 1, 1, 1, 2, 2 ]
      ],
      texts:{}
    }
  },
  computed:{
    sel_row_min(){
      return Math.min(this.begin_row,this.end_row)
    },
    sel_row_max(){
      return Math.max(this.begin_row,this.end_row)
    },
    sel_col_min(){
      return Math.min(this.begin_col,this.end_col)
    },
    sel_col_max(){
      return Math.max(this.begin_col,this.end_col)
    },
    isHasBegin(){
      
      return (this.begin_row>-1) && (this.begin_col > -1)
    },
    isHasEnd(){
      return (this.end_row>-1) && (this.end_col > -1)
    },
    outhtml(){
      let split="    ";
      return "<table>\n"+[
        [this.outdata.thead,"thead"],[this.outdata.tbody,"tbody"]
      ].filter(item=>item[0].length>0).map(([trs,tag])=>{
        return split+"<"+tag+">\n"+trs.map(tr=>{
          return split+split+"<tr>\n"+tr.map(td=>{
            let attr = "";
            td.attrs.rowspan && (attr+=` rowspan="${td.attrs.rowspan}"`)
            td.attrs.colspan && (attr+=` colspan="${td.attrs.colspan}"`)
            return split+split+split+`<td${attr}>${this.getText(td.type,td.rowindex,td.colindex)}</td>`
          }).join("\n")+"\n"+split+split+"</tr>"
        }).join("\n")+"\n"+split+"</"+tag+">"
      }).join("\n")+"\n</table>"
    },
    outdata(){
      let table = {
        thead:[],
        tbody:[]
      };
      [
        [2,this.hrows,this.cols,table.thead],
        [1,this.rows,this.cols,table.tbody]
      ].forEach(([type,rows,cols,trs])=>{
        for(var ridx =0;ridx<rows;ridx++){
          let tr = [];
          for(var cidx =0;cidx<cols;cidx++){
            if(!this.isCellVisibled(type,ridx,cidx)){continue;}
            tr.push({
              attrs:this.getAttr(type,ridx,cidx),
              type:type,
              colindex:cidx,
              rowindex:ridx,
              text:this.getText(type,ridx,cidx)
            })
          }
          trs.push(tr);
        }
      })
      return table;
    }
  },
  methods:{
    setText(type,ridx,cidx,text){
        this.$set(this.texts,`${type}-${ridx}-${cidx}`,text)
    },
    getText(type,ridx,cidx){
      if(this.texts[`${type}-${ridx}-${cidx}`]===undefined){
        this.$set(this.texts,`${type}-${ridx}-${cidx}`,"")
      }
      return this.texts[`${type}-${ridx}-${cidx}`];
    },
    getAttr(type,ridx,cidx){
      let item = this.findMergeCell(type,ridx,cidx);
      let attrs = {};
      if(item){
        attrs.rowspan = item[3]-item[1]+1;
        attrs.colspan = item[4]-item[2]+1;
      }
      return attrs;
    },
    findMergeCell(type,ridx,cidx){https://observablehq.com/@zq1988626/merge-table-cell/safe
      return this.merges.find(item=>item[0]===type&&item[1]===ridx&&item[2]===cidx)
    },
    isCellVisibled(type,ridx,cidx){
      var item = this.merges.find(item=>item[0]===type&&ridx>=item[1]&&ridx<=item[3]&&cidx>=item[2]&&cidx<=item[4]);
      return item&&(item[1]!==ridx||item[2]!==cidx)?false:true
    },
    btn_merge_click(){
      this.merges.push(this.getCurrentSel());
    },
    delMergeItemByIndex(index){
      this.merges.splice(index,1);
    },
    getCurrentSel(){
      return [
        this.seltype,
        this.sel_row_min,
        this.sel_col_min,
        this.sel_row_max,
        this.sel_col_max
      ]
    },
    cellIsSelected(type,rowidx,colidx){
      return rowidx>=this.sel_row_min && rowidx<=this.sel_row_max 
        && colidx>=this.sel_col_min && colidx<=this.sel_col_max 
    },
    showsel(type,rowidx,colidx){
      return type == this.seltype 
        && this.isHasBegin
        && this.isHasEnd
        && this.cellIsSelected(type,rowidx,colidx)
    },
    setEnd(ridx,cidx){
      this.end_row = ridx;
      this.end_col = cidx;
      this.$emit("sel");
      this.$emit("selend");
    },
    setBegin(ridx,cidx){
      this.begin_row = ridx;
      this.begin_col = cidx;
      this.$emit("sel");
      this.$emit("selbegin");
    },
    startSel(type){
      this.seltype = type;
      this.seling = true;
    },
    stopSel(){
      this.seling = false;
    },
    
    td_mouse_keydown(rowidx,colidx){
      this.startSel(1);
      this.setBegin(rowidx,colidx);
      this.setEnd(rowidx,colidx);
    },
    td_mouse_move(rowidx,colidx){
      if(!this.seling){return;}
      this.setEnd(rowidx,colidx);
    },
    td_mouse_keyup(rowidx,colidx){
      this.setEnd(rowidx,colidx);
      this.stopSel();
    },
    th_mouse_keydown(rowidx,colidx){
      this.startSel(2);
      this.setBegin(rowidx,colidx);
      this.setEnd(rowidx,colidx);
    },
    th_mouse_move(rowidx,colidx){
      if(!this.seling){return;}
      this.setEnd(rowidx,colidx);
    },
    th_mouse_keyup(rowidx,colidx){
      this.setEnd(rowidx,colidx);
      this.stopSel();
    }
  }
}),""
)}

function _Vue(require){return(
require("vue@2")
)}

function _5(html){return(
html`
<style>
table{
  color: #212529;
  border-collapse: collapse;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  border: 1px solid #dee2e6;
  user-select: none;
  table-layout:fixed;
}
th:hover,td:hover{
  background:#ddd;
}
th{
  background:#eee;
}
th.sel,td.sel{
  background:#00f3;
}
th,td{
  text-align:center;
  border: 1px solid #dee2e6;
  padding: .25rem;
  vertical-align: top;
  border-top: 1px solid #dee2e6;
  box-sizing: border-box;
  min-width:50px;
  vertical-align: middle;
}
.merge-item-del{
  color:#f00;
  margin-left:1rem;
  cursor: pointer;
}
table td.sel,
table th.sel{

}

table td.sel input,
table th.sel input{
  background:transparent;
  border:0;
  box-sizing: border-box;
  width:100%;
  height:100%;
  text-align:center;
}
</style>
`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("container")).define("container", ["html"], _container);
  main.variable(observer()).define(["Vue","container"], _3);
  main.variable(observer("Vue")).define("Vue", ["require"], _Vue);
  main.variable(observer()).define(["html"], _5);
  return main;
}
