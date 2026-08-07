window.WEDDING_CONFIG = {
  couple: {
    groom: "李辰海",
    bride: "沙雷雨馨",
    date: "2026.10.6",
    lunarDate: "农历八月廿六",
    dateISO: "2026-10-06T11:20:00+08:00",
    venue: "中原油田宾馆",
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
    apiEndpoint: "",
    allowAnonymousWishes: true,
    allowAnonymousReplies: true,
    pageSize: 10,
    replyPreviewSize: 2,
    replyPageSize: 100,
  },
  seatLookup: {
    apiEndpoint: "",
    invitationCodeLength: 6,
    helpText: "婚礼前夕，我们将发送专属邀请码，届时即可查看您的座位安排。",
  },
  cloudbaseApi: {
    envId: "wedding-invitation-d8cw19676945d",
    region: "ap-shanghai",
    functionName: "weddingApiEvent",
    anonymousLogin: true,
  },
  share: {
    title: "2026.10.6婚礼邀请函",
    desc: "李辰海&沙雷雨馨",
    link: "https://wedding-invitation-d8cw19676945d-1463852299.tcloudbaseapp.com/",
    imgUrl: "https://wedding-invitation-d8cw19676945d-1463852299.tcloudbaseapp.com/assets/share-card.jpg",
  },
  schedule: [
    { time: "10:00", title: "迎宾", detail: "请在签到处领取座位信息" },
    { time: "11:20", title: "仪式开始", detail: "请提前入席，将手机调至静音" },
    { time: "12:20", title: "婚礼午宴", detail: "一起举杯，慢慢享用午宴" },
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
      text: "愿你们在每一个普通日子里，都能把对方看成最好看的风景。",
      replies: [{ name: "新人", text: "谢谢这份很温柔的祝福。" }],
    },
    {
      id: "seed-2",
      name: "老同学",
      text: "祝新婚快乐，十月见！",
      replies: [],
    },
  ],
  seatingGuests: [
    { name: "胡阳", invitationCode: "728416", table: "A01", seatNote: "亲友席" },
    { name: "韩旭", invitationCode: "593827", table: "A02", seatNote: "亲友席" },
  ],
};
