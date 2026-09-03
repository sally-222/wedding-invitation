window.WEDDING_CONFIG = {
  assetVersion: "20260903-travel-typo",
  couple: {
    groom: "李辰海",
    bride: "沙雷雨馨",
    date: "2026.10.6",
    lunarDate: "农历八月廿六",
    dateISO: "2026-10-06T11:18:00+08:00",
    venue: "中原油田宾馆（二所）",
    address: "河南省濮阳市华龙区中原油田宾馆",
    dressCode: "浅色低饱和度",
    heroImage: "./assets/wedding-hero.jpg",
    invitationLine: "诚邀您见证我们的婚礼",
  },
  contacts: {
    groomPhone: "13164039297",
    bridePhone: "16639311246",
    phonePlaceholderText: "电话待补充",
  },
  map: {
    label: "打开地图导航",
    url: "https://uri.amap.com/search?keyword=%E6%B2%B3%E5%8D%97%E7%9C%81%E6%BF%AE%E9%98%B3%E5%B8%82%E5%8D%8E%E9%BE%99%E5%8C%BA%E4%B8%AD%E5%8E%9F%E6%B2%B9%E7%94%B0%E5%AE%BE%E9%A6%86&city=%E6%BF%AE%E9%98%B3&callnative=1",
  },
  music: {
    title: "点击开启背景音乐",
    audioUrl: "./assets/audio/a-thousand-years-lullaby.mp3",
    volume: 0.72,
    useBuiltInAmbientWhenNoAudio: true,
  },
  blessing: {
    apiEndpoint: "/api/wishes",
    allowAnonymousWishes: true,
    allowAnonymousReplies: true,
    pageSize: 10,
    replyPreviewSize: 2,
    replyPageSize: 100,
  },
  seatLookup: {
    apiEndpoint: "/api/seats",
    helpText: "座位信息将在婚礼前夕更新，届时请输入您的姓名查询。",
  },
  share: {
    title: "2026.10.6婚礼邀请函",
    desc: "李辰海&沙雷雨馨",
    link: "https://wedding-invitation.pages.dev/invitation/index.html",
    imgUrl: "https://mmbiz.qpic.cn/mmbiz_jpg/p1q58J1IVH5h1jyvzma5wcRcoDXhJskxtyqrCicWce4RpgrwQJjEyMibcBveofSZXYXFiaz0QI7OgcGtmXRjptz1de0lbkvsuI0KJ5xyRibcoDk/640?wx_fmt=jpeg&from=appmsg",
  },
  schedule: [
    { time: "10:00", title: "迎宾", detail: "与亲友相见、聊天、拍照。" },
    { time: "11:18", title: "仪式开始（草坪仪式）", detail: "请提前入席，将手机调至静音" },
    { time: "12:18", title: "婚礼午宴", detail: "一起举杯，慢慢享用午宴" },
  ],
  travelSpots: [],
  assetCredits: [
    {
      label: "临时首图：Devon Divine / Unsplash",
      url: "https://unsplash.com/photos/Bo3FEzGRAOY",
    },
    {
      label: "临时照片：Rene Terp / Pexels",
      url: "https://www.pexels.com/photo/10091571/",
    },
  ],
  blessingSeed: [
    {
      id: "seed-1",
      name: "匿名亲友",
      text: "愿你们在每一个普通日子里，都能把对方看成最好看的风景。十月见，我们一定准时到。",
      replies: [
        { name: "新人", text: "谢谢这份很温柔的祝福，我们婚礼见。" },
        { name: "匿名亲友", text: "这句话也太适合你们了。" },
        { name: "老同学", text: "已经开始期待那天了。" },
      ],
    },
    {
      id: "seed-2",
      name: "老同学",
      text: "从校园到婚礼，真的替你们开心。祝新婚快乐，往后的日子都顺顺利利。",
      replies: [
        { name: "韩旭", text: "这一路真的不容易，必须祝福。" },
        { name: "匿名亲友", text: "十月一起见证。" },
      ],
    },
  ],
  seatingGuests: [
    { name: "胡阳", table: "A01", seatNote: "亲友席" },
    { name: "韩旭", table: "A02", seatNote: "亲友席" },
  ],
};
