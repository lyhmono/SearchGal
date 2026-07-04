import fs from 'fs';

const src = fs.readFileSync('src/html.ts', 'utf8');
const m = src.match(/export const HTML = `([\s\S]*)`;\s*$/);
const html = new Function('return `' + m[1] + '`')();

const mock = `
<script>
window.addEventListener('load', function(){
  q.value='千恋万花';ucl();
  sbz(true);
  var mp=[
    {name:'VNS',color:'#53e0a8',tags:['NoReq','SuDrive'],items:[
      {name:'千恋＊万花',url:'https://gal.saop.cc/p/12345'},
      {name:'千恋万花 汉化版',url:'https://gal.saop.cc/p/12346'},
      {name:'千恋万花 全CG存档',url:'https://gal.saop.cc/p/12347'},
      {name:'千恋＊万花 8合1整合包',url:'https://gal.saop.cc/p/12348'},
      {name:'千恋万花 + DLC',url:'https://gal.saop.cc/p/12349'},
      {name:'千恋＊万花 (英文版)',url:'https://gal.saop.cc/p/12350'},
      {name:'千恋万花 修補档',url:'https://gal.saop.cc/p/12351'},
      {name:'千恋＊万花 存档',url:'https://gal.saop.cc/p/12352'},
      {name:'千恋万花 全语音包',url:'https://gal.saop.cc/p/12353'},
      {name:'千恋＊万花 1080p CG',url:'https://gal.saop.cc/p/12354'},
      {name:'千恋万花 OST',url:'https://gal.saop.cc/p/12355'},
      {name:'千恋＊万花 攻略本',url:'https://gal.saop.cc/p/12356'}
    ]},
    {name:'真红小站',color:'#53e0a8',tags:['NoReq','SuDrive'],items:[
      {name:'千恋＊万花',url:'https://shinnku.com/game/senren-banka'},
      {name:'千恋万花 汉化版',url:'https://shinnku.com/game/senren-banka-cn'},
      {name:'千恋＊万花 + DLC',url:'https://shinnku.com/game/senren-banka-dlc'},
      {name:'千恋万花 全CG存档',url:'https://shinnku.com/game/senren-banka-cg'},
      {name:'千恋＊万花 整合包',url:'https://shinnku.com/game/senren-banka-pack'},
      {name:'千恋万花 修補档',url:'https://shinnku.com/game/senren-banka-patch'},
      {name:'千恋＊万花 存档',url:'https://shinnku.com/game/senren-banka-save'},
      {name:'千恋万花 语音包',url:'https://shinnku.com/game/senren-banka-voice'}
    ]},
    {name:'KisuGal',color:'#53e0a8',tags:['NoReq','SuDrive'],items:[
      {name:'千恋万花',url:'https://kisuacg.moe/gal/120'},
      {name:'千恋＊万花 汉化',url:'https://kisuacg.moe/gal/121'},
      {name:'千恋万花 整合包',url:'https://kisuacg.moe/gal/122'},
      {name:'千恋＊万花 DLC',url:'https://kisuacg.moe/gal/123'},
      {name:'千恋万花 存档',url:'https://kisuacg.moe/gal/124'}
    ]},
    {name:'鲲Galgame',color:'#53e0a8',tags:['NoReq','SuDrive'],items:[
      {name:'千恋＊万花',url:'https://www.kungal.com/zh-cn/galgame/42'},
      {name:'千恋万花 汉化版',url:'https://www.kungal.com/zh-cn/galgame/43'},
      {name:'千恋＊万花 整合',url:'https://www.kungal.com/zh-cn/galgame/44'}
    ]},
    {name:'煌星游戏库',color:'#53e0a8',tags:['NoReq'],items:[
      {name:'千恋＊万花',url:'https://galgames.vip/game/2001'},
      {name:'千恋万花 汉化',url:'https://galgames.vip/game/2002'}
    ]},
    {name:'GalgameDaWanJia',color:'#ff6f91',tags:['NoReq'],items:[],error:'证书错误 (ERR_TLS_CERT_ALTNAME_INVALID)'},
    {name:'ACG港湾',color:'#53e0a8',tags:['NoReq','SuDrive'],items:[
      {name:'千恋＊万花',url:'https://www.acggw.me/301'}
    ]},
    {name:'二狗ACG',color:'#53e0a8',tags:['NoReq'],items:[
      {name:'千恋万花',url:'https://2gouacg.com/155'}
    ]},
    {name:'ACG游戏姬',color:'#53e0a8',tags:['NoReq'],items:[]},
    {name:'Galgame大玩家',color:'#ff6f91',tags:['NoReq'],items:[],error:'连接超时'},
    {name:'Loioy',color:'#ffd166',tags:['magic'],items:[]},
    {name:'VikaACG',color:'#ffd166',tags:['magic'],items:[]},
    {name:'Nysoure',color:'#ffd166',tags:['magic'],items:[]}
  ];
  pm({total:mp.length});
  var i=0;
  function next(){
    if(i>=mp.length){pm({done:true});return}
    pm({progress:{completed:i+1,total:mp.length},result:mp[i]});
    i++;
    setTimeout(next,250);
  }
  setTimeout(next,400);
});
</script>
</body>`;

const preview = html.replace('</body>', mock);
fs.writeFileSync('preview.html', preview);
console.log('preview.html generated:', preview.length, 'bytes');
