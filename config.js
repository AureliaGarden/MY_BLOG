// 在这里修改博客基本信息和文章目录。
window.BLOG = {
  name: "Aurelia",
  title: "留住生活的微光",
  description: "记录生活、分享想法，也收藏那些闪闪发光的瞬间。",
  about: "你好，我是 Aurelia。这里是我的个人空间，记录生活中的点滴、学习中的发现，以及一路上的奇思妙想。",
  github: "https://github.com/AureliaGarden",
  interests: ["阅读", "生活记录", "探索新事物"],
  timeline: [
    { date: "现在", title: "开始记录", text: "在这里慢慢收集生活与成长中的片刻。" }
  ],
  moments: [
    { date: "2026-10-29", text: "新空间的第一条动态。以后可以在这里分享日常的小心情。", tags: ["日常", "示例"] }
  ],
  projects: [
    { title: "我的博客", description: "一个正在慢慢成长的个人空间。", category: "项目", url: "https://github.com/AureliaGarden/MY_BLOG" },
    { title: "收藏夹", description: "在这里添加喜欢的网站和有趣的发现。", category: "收藏", url: "" }
  ],
  // 待确定服务后再接入：不要在前端配置文件中填写密钥。
  music: { enabled: false },
  comments: { enabled: false },
  posts: [
    { slug: "hello-world", title: "你好，世界", date: "2026-10-29", category: "随笔", tags: ["生活", "开始"], excerpt: "从这里开始，慢慢记录生活中的点滴和那些值得收藏的想法。", file: "posts/hello-world.md", reading: "2 分钟阅读" }
  ]
};
