import type { Platform } from "../../types";
import ACGGangWan from "./ACGGangWan";
import ACGYingYingGuai from "./ACGYingYingGuai";
import ACGYouXiJi from "./ACGYouXiJi";
// import BiAnXingLu from "./BiAnXingLu"; // 已禁用：源站返回 521（Cloudflare 回源失败），站点已宕机，故停用
import DaoHeGal from "./DaoHeGal";
import ErGouACG from "./ErGouACG";
import FuFuACG from "./FuFuACG";
// import GalgameDaWanJia from "./GalgameDaWanJia"; // 已禁用：TLS 证书 CN=cp.huyuncdn.com 不匹配域名（ERR_TLS_CERT_ALTNAME_INVALID），站长证书配错，故停用
// import GalgameX from "./GalgameX"; // 已禁用：站点改版为 Next.js SPA，.top→.net 重定向后 /api/search 返回 404，旧 API 下线，故停用
import GalTuShuGuan from "./GalTuShuGuan";
import GameNTR from "./GameNTR";
// import GGBases from "./GGBases"; // 已禁用：openresty WAF 按 searchgal UA 屏蔽，换 UA 即绕过站长主动屏蔽，故停用
import HuangXingYouXiKu from "./HuangXingYouXiKu";
import JiMengACG from "./JiMengACG";
import JiuLiACG from "./JiuLiACG";
import KisuGal from "./KisuGal";
import Koyso from "./Koyso";
import KunGalgame from "./KunGalgame";
import LiangZiACG from "./LiangZiACG";
// import LiSiTanACG from "./LiSiTanACG"; // 已禁用：已迁站 singureo.com 并改为 SPA 客户端搜索，原 search.xml 索引下线，无可调用接口，故停用
import Loioy from "./Loioy";
import MaoMaoWangPan from "./MaoMaoWangPan";
import MiaoYuanLingYu from "./MiaoYuanLingYu";
import MikiGame from "./MikiGame";
import Nysoure from "./Nysoure";
// import QingJiACG from "./QingJiACG"; // 已禁用：全站 Cloudflare 人机质询，所有 UA 均被拦截，无法抓取，故停用
import ShanYouMuXi from "./ShanYouMuXi";
import ShenShiTianTang from "./ShenShiTianTang";
import TianYouErCiYuan from "./TianYouErCiYuan";
// import TouchGal from "./TouchGal"; // 已禁用：Cloudflare 人机质询 + 源站按 searchgal UA 屏蔽，无法抓取，故停用
import VikaACG from "./VikaACG";
import VNS from "./VNS";
import WeiZhiYunPan from "./WeiZhiYunPan";
import xxacg from "./xxacg";
import YingZhiGuang from "./YingZhiGuang";
// import YouYuDeloli from "./YouYuDeloli"; // 已禁用：SSL 证书过期（CERT_HAS_EXPIRED），等站长续证后可恢复，暂停用
import YueYao from "./YueYao";
import ZeroFive from "./ZeroFive";
import ZhenHongXiaoZhan from "./ZhenHongXiaoZhan";
import ZiLingDeMiaoMiaoWu from "./ZiLingDeMiaoMiaoWu";
import ZiYuanShe from "./ZiYuanShe";

const platforms: Platform[] = [
  ACGGangWan,
  ACGYingYingGuai,
  ACGYouXiJi,
  // BiAnXingLu, // 已禁用
  DaoHeGal,
  ErGouACG,
  FuFuACG,
  // GalgameDaWanJia, // 已禁用
  // GalgameX, // 已禁用
  GalTuShuGuan,
  GameNTR,
  // GGBases, // 已禁用
  HuangXingYouXiKu,
  JiMengACG,
  JiuLiACG,
  KisuGal,
  Koyso,
  KunGalgame,
  LiangZiACG,
  // LiSiTanACG, // 已禁用
  Loioy,
  MaoMaoWangPan,
  MiaoYuanLingYu,
  MikiGame,
  Nysoure,
  // QingJiACG, // 已禁用
  ShanYouMuXi,
  ShenShiTianTang,
  TianYouErCiYuan,
  // TouchGal, // 已禁用
  VikaACG,
  VNS,
  WeiZhiYunPan,
  xxacg,
  YingZhiGuang,
  // YouYuDeloli, // 已禁用
  YueYao,
  ZeroFive,
  ZhenHongXiaoZhan,
  ZiLingDeMiaoMiaoWu,
  ZiYuanShe,
];

export default platforms;
