import type { Platform } from "../../types";
import ACGGangWan from "./ACGGangWan";
import ACGYingYingGuai from "./ACGYingYingGuai";
import ACGYouXiJi from "./ACGYouXiJi";
import Acgrx from "./Acgrx";
// import BiAnXingLu from "./BiAnXingLu"; // 已禁用：源站返回 521（Cloudflare 回源失败），站点已宕机，故停用
import DaYaTuiJian from "./DaYaTuiJian";
import DaoHeGal from "./DaoHeGal";
import ErGouACG from "./ErGouACG";
// import FuFuACG from "./FuFuACG"; // 已禁用：站点改版为 Vue SPA 后搜索功能下线（原 JSON 接口移除），无法服务端聚合，故停用
// import GGBases from "./GGBases"; // 已禁用：openresty WAF 按 searchgal UA 屏蔽，换 UA 即绕过站长主动屏蔽，故停用
import GalTuShuGuan from "./GalTuShuGuan";
// import GalgameDaWanJia from "./GalgameDaWanJia"; // 已禁用：TLS 证书 CN=cp.huyuncdn.com 不匹配域名（ERR_TLS_CERT_ALTNAME_INVALID），站长证书配错，故停用
import GalgameX from "./GalgameX";
import GameBus from "./GameBus";
import GameNTR from "./GameNTR";
// import HuangXingYouXiKu from "./HuangXingYouXiKu"; // 已禁用：站点改版为 Vue SPA（服务端仅返回空壳 HTML），无法解析，故停用
import HuangYouShe from "./HuangYouShe";
// import JiMengACG from "./JiMengACG"; // 已禁用：绮梦ACG 已停站公告迁往柚盒，/api/posts 返回 HTML 而非 JSON，故停用
import JiuLiACG from "./JiuLiACG";
// import KisuGal from "./KisuGal"; // 已禁用：域名 www.kisuacg.moe 解析已失效（DNS ENOTFOUND），无可用新域名，故停用
import Koyso from "./Koyso";
import KunGalgame from "./KunGalgame";
// import LiSiTanACG from "./LiSiTanACG"; // 已禁用：已迁站 singureo.com 并改为 SPA 客户端搜索，原 search.xml 索引下线，无可调用接口，故停用
import LiangZiACG from "./LiangZiACG";
// import Loioy from "./Loioy"; // 已禁用：站点搜索接口失效（返回 404），故停用
import MaoMaoWangPan from "./MaoMaoWangPan";
import MiaoYuanLingYu from "./MiaoYuanLingYu";
// import MikiGame from "./MikiGame"; // 已禁用：站点失联（连接超时），故停用
import Nysoure from "./Nysoure";
// import QingJiACG from "./QingJiACG"; // 已禁用：全站 Cloudflare 人机质询，所有 UA 均被拦截，无法抓取，故停用
import SakuGal from "./SakuGal";
import ShanYouMuXi from "./ShanYouMuXi";
// import ShenShiTianTang from "./ShenShiTianTang"; // 已禁用：证书链缺少中间证书（unable to verify the first certificate），Workers 无法跳过 TLS 校验，故停用
import TianYouErCiYuan from "./TianYouErCiYuan";
import TouchGal from "./TouchGal";
// import VNS from "./VNS"; // 已禁用：gal.saop.cc/data.json 已 302 跳转至 sakuraav.com（站点改版），JSON 索引下线，故停用
// import VikaACG from "./VikaACG"; // 已禁用：官方接口增加客户端签名与设备校验（返回 400 非法的客户端），服务端无法直接抓取，故停用
import WeiZhiYunPan from "./WeiZhiYunPan";
// import YingZhiGuang from "./YingZhiGuang"; // 已禁用：search.xml 索引已下线（实测 404），无可用搜索接口，故停用
// import YouYuDeloli from "./YouYuDeloli"; // 已禁用：首页返回 window.location 跳转的 JS 质询（__check 参数），服务端无法直接抓取，故停用
import YueYao from "./YueYao";
import ZeroFive from "./ZeroFive";
import ZhenHongXiaoZhan from "./ZhenHongXiaoZhan";
// import ZiLingDeMiaoMiaoWu from "./ZiLingDeMiaoMiaoWu"; // 已禁用：站点开启 JS 浏览器质询，服务端无法通过，故停用
import ZiYuanShe from "./ZiYuanShe";
import xxacg from "./xxacg";

const platforms: Platform[] = [
  ACGGangWan,
  ACGYingYingGuai,
  ACGYouXiJi,
  Acgrx,
  // BiAnXingLu, // 已禁用
  DaYaTuiJian,
  DaoHeGal,
  ErGouACG,
  // FuFuACG, // 已禁用
  // GGBases, // 已禁用
  GalTuShuGuan,
  // GalgameDaWanJia, // 已禁用
  GalgameX,
  GameBus,
  GameNTR,
  // HuangXingYouXiKu, // 已禁用
  HuangYouShe,
  // JiMengACG, // 已禁用
  JiuLiACG,
  // KisuGal, // 已禁用
  Koyso,
  KunGalgame,
  // LiSiTanACG, // 已禁用
  LiangZiACG,
  // Loioy, // 已禁用
  MaoMaoWangPan,
  MiaoYuanLingYu,
  // MikiGame, // 已禁用
  Nysoure,
  // QingJiACG, // 已禁用
  SakuGal,
  ShanYouMuXi,
  // ShenShiTianTang, // 已禁用
  TianYouErCiYuan,
  TouchGal,
  // VNS, // 已禁用
  // VikaACG, // 已禁用
  WeiZhiYunPan,
  // YingZhiGuang, // 已禁用
  // YouYuDeloli, // 已禁用
  YueYao,
  ZeroFive,
  ZhenHongXiaoZhan,
  // ZiLingDeMiaoMiaoWu, // 已禁用
  ZiYuanShe,
  xxacg,
];

export default platforms;
