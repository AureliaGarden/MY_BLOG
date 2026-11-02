(() => {
  const config = window.BLOG;
  const data = window.BLOG_DATA || {profile:{},activity:{}};
  if (Array.isArray(data.posts)) config.posts = data.posts;
  if (Array.isArray(data.moments)) config.moments = data.moments;
  if (Array.isArray(data.projects)) config.projects = data.projects;
  for (const key of ['title','description','about','interests','timeline','github']) if (data.settings && Object.hasOwn(data.settings,key)) config[key] = data.settings[key];
  const app = document.querySelector('#app');
  let isNight = false;
  try { isNight = localStorage.getItem('blog-theme') === 'night'; } catch {}
  function applyTheme() {
    document.body.classList.toggle('night-mode', isNight);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => { button.setAttribute('aria-pressed', String(isNight)); button.querySelector('.theme-name').textContent = isNight ? '日间模式' : '夜间模式'; button.querySelector('.theme-symbol').textContent = isNight ? '☀' : '☾'; });
  }
  applyTheme();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = value => /^(https?:\/\/|mailto:)/i.test(value || '') ? esc(value) : '';
  const imageUrl = value => /^\/personal\/uploads\/[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(value || '') ? esc(value) : '';
  const date = value => esc(value).replaceAll('-', ' / ');
  const tags = post => post.tags || [];
  const postSection = post => post?.section === 'talk' ? 'talk' : 'posts';
  // 台词与署名来自用户提供的摘录；保留原文及原有署名。
  const pageQuotes = [["努力是不会背叛自己的，虽然梦想会背叛。努力不一定能实现梦想，但是曾经努力过的事实却足以安慰自己。","比企谷八幡"],["人类的成长即是如此无可奈何的事情。附上创伤、遭到贬低、受完侮蔑后才第一次得到成长。爱和友情和勇气可改变不了一个人。","比企谷八幡"],["温柔正确的人总是难以生存，因为这世界既不温柔，也不正确。","比企谷八幡"],["这世上真正的好人和坏人都很少，大部分都是普通人。平时随波逐流，关键时刻则会出于自我保护而露出獠牙——然而正是因为这样才可怕。","比企谷八幡"],["孤独的人不会伤害别人，只会不断地伤害自己罢了。","比企谷八幡"],["独行侠是以孤傲真正地确立自我。","比企谷八幡"],["游荡的孤高灵魂不需要羁绊之地。","比企谷八幡"],["我不渴求语言。我想要的东西，确实存在。我并不想让别人来理解我，而是想要去了解。想了解，想明白，想弄明白之后安心度日，想得到一份平静，因为一无所知这一点让我极其畏惧。……即使如此我也……我也想要真物！","比企谷八幡"],["吃不到的葡萄，一定是酸的。但是，我并不需要什么如同谎言一样甘甜的果实。充斥着虚妄的理解和欺瞒的关系，我并不需要。我想要的，就是那酸味的葡萄。就算满是酸涩，就算苦似黄连，就算味同嚼蜡，就算苛毒无比，就算如同空中楼阁，就算只是镜花水月。","比企谷八幡"],["『世界无法改变，自己可以改变』这种说法，不过是对这个混账垃圾一样、冷淡又残酷的世界的顺应、适应、承认自己失败的隶属行为而已。这不过是动用着华丽的辞藻装饰的，连自己都骗个昏头转向的欺瞒而已。","比企谷八幡"],["『人』字经常被解释为人和人互相支持，但写起来不是往一边倒么？我觉得容忍他人的牺牲才是『人』这个概念。","比企谷八幡"],["要让一群人团结起来，需要的不是英明的领导，而是共同的敌人。","比企谷八幡"],["如果每个人都堕落，那就没人算是堕落。","比企谷八幡"],["谄媚时舍弃尊严全力谄媚，这就是我的尊严。","比企谷八幡"],["如果随便说句话就能解决烦恼的话，就没有烦恼这种东西存在了。","比企谷八幡"],["误解是解不开的。既然『解』已经得出了，那么问题就到此为止了。再解下去也解不了。","比企谷八幡"],["通过语言进行的人际交流只有三成。剩下来的七成就要通过眼睛的活动和细微的动作来收集。","比企谷八幡"],["人心的距离是被实际的距离所具象化表现的事物。","比企谷八幡"],["人们被搭话时会感到高兴，最大的理由在于自我认同的欲求获得满足。他们藉此确定对方认同自己这个人、接受自己存在于这个世界。","比企谷八幡"],["就算看谁的脸色、讨谁的欢心、保持联络、迎合话题，不得不做那么多才能维系的友情，那种东西根本就不是友情。","比企谷八幡"],["我虽然会妄言和失言，但我绝不虚言。","雪之下雪乃"],["人可以不必化作星星，只要有容身之处，就不必迎来燃烧殆尽的悲惨结局。","雪之下雪乃"],["帮助他人，不能成为你伤害自己也觉得无所谓的理由哦。","平冢静"],["以你的做法，当你遇到真正想要帮助的人时，你是无能为力的。","平冢静"],["就算平时没人留意，只要他在那里，人就会安心……真正能救人的，是人啊。","惠比寿"],["神是为人类而存在的，绝不是为了自己。","惠比寿"],["伤害别人也没关系。这世上哪有从不伤害任何人的人。","毘沙门天"],["我想成为能让人幸福的存在！","夜斗"],["一个人就够了。去找那个独一无二的人吧。","夜斗"],["不管别人怎么说——你做过的事，是善。","夜斗"],["要逃的话，就向未来逃吧。","雪音"],["愤怒和悔恨，只有俯瞰它们，才能变成武器。","网代慎平"],["迷茫的时候，就想想未来的自己会怎么选，然后做决定。这样就不会后悔。","根津银次郎"],["重要的不是活了多久，而是把命用得多彻底。","南方日鹤"],["与其后悔没做，不如后悔做过。","网代慎平"],["他只是在为救重要的人而不择手段吧。换作是我，我没自信说不会做同样的事。","网代慎平"],["真正强大的人不会伤害任何人。你的双手不是用来施暴的，而应该与他人握手、抚摸他人、拥抱他人。","人渕佳苗"],["时间一长，不只是才能和环境，连努力也能争到发言权。","佐久间学"],["想赢的话，就需要为达成它而付出努力。","风间龙一"],["说到底，才能这东西并不是只赐给那些去追求它的人的。","风间龙一"],["站上顶点，才有非站上去看不见的风景。","小泉丈"],["我只想开心就好，有趣就够了。我不想为了赢而牺牲什么，或把谁拽下来。","月本诚"],["不想打的话，放弃就好了。没必要勉强自己继续。","月本诚"],["绝对不输的唯一办法就是——不去战斗。","佐久间学"],["英雄会超越道理。英雄推翻常识，把黑暗一脚踢飞——总之单纯、明亮、快乐地发光。","月本诚"],["怕了就会输，怯了就会死。","星野裕"],["乒乓球这东西啊，超级、超级好玩的！","星野裕"],["其实我觉得，把人生押在乒乓球上，也不坏。","月本诚"],["正因我们软弱，才更能够选择高洁、选择再次站起来。","远野汉娜"],["死与恶衔接黑暗之环。生与善敲响末日之钟。我手持镰刀将万物收割。繁荣国土终将归于虚空。","特莉波卡"],["即使回坑里休息，也在全身心地思考着工作，与其这样在焦虑中失眠，不如一开始就舍弃掉『睡眠』这种行为。","特莉波卡"],["虫子这种生物，可以是『漂亮』的吗？","特莉波卡"],["那些心很硬的大人，小时候也会为小狗哭泣吗？","特莉波卡"],["那么漫长痛苦的黑暗和这么短暂的飞翔，应该是置于天平两段的对等的体验吧。否则无以理解这规则。","特莉波卡"],["人类的理性，似乎拥有一定的自我保护机制。他们会对自己看到但无法理解的东西进行裁剪。","特莉波卡"],["太阳只不过是一颗星辰。但是，太阳是离我们最近的星辰。","特莉波卡"],["嗯……我已经获得幸福了。","小叶子"],["是暗淡的记忆中璀璨的光芒。","小叶子"],["挑战艰难的勇气，和灵光闪现的创造性。","小叶子"],["我注意到……很多连通的梦境。随着心意的变动，可以从一个梦境跨越到另一个梦境。","小叶子"],["……那种感觉，就好像我一瞬间能够完全理解了另一颗心。","小叶子"],["别担心，我们会回家的。","小叶子"],["此乃真理，远离虚妄之真理。","耶芙娜"],["下如同上，上如同下；依此成全太一的奇迹。","耶芙娜"],["一生万物，万物皆从唯一分化。","耶芙娜"],["太阳为父，太阴为母，从风孕育，从地养护。","耶芙娜"],["世间一切完美之源泉，归于大地。","耶芙娜"],["从土中炼出火，从粗粝中炼出精粹。","耶芙娜"],["从地升天，又从天而降，获得其上、其下之能力。如此可得世界的荣耀、远离黑暗蒙昧。","耶芙娜"],["此为万力之原力，摧坚拔韧。","耶芙娜"],["世界即如此创造，依此可达奇迹。","耶芙娜"],["我被称为三重伟大的赫尔墨斯，因我拥有世界三部分的智慧。","耶芙娜"],["我被称为『三重伟大的赫尔墨斯』，因我拥有世界三部分的智慧。","赫尔墨斯"],["即使你已经拥有『三重伟大』之名，也无法与那门的意志匹敌。","特莉波卡"],["即不顾一切的傻气，和乱七八糟的创造性啊！！","耶芙娜"],["科学上并不存在绝对的『不可能』，关键在于我们需要……非常多的能量。","张析木"],["丧失理智的智慧依然是智慧。","张隐辰"],["曲木不材，得终天年。","张析木"],["过于漫长的生命，对过于脆弱的人类而言是诅咒。比起你给予的，我更想去自己塑造人生的意义。","张隐辰"],["比起这道门通往的无限世界，无尽知识，一切的终极真理……我选择——我已经拥有的有限人生。","张隐辰"],["我们度过的人生也一样，根本不存在什么完美的一天。可是……我更喜欢与你度过的，磕磕碰碰的不完美的每一天。","张隐辰"],["学会爱自己比较重要吧。就算你约会过的人不爱你，这个孩子不爱你，其他人不爱你。可至少你爱你自己，会珍惜你自己，也会找出自己生存的意义吧？","张隐辰"],["希望在未来的某个林间，我斩绝了世间的『恶』，再次与你相逢。","霞露零"],["沉溺于悲伤的时候，你就会错过眼前的光了。","霓克斯"],["对于糟糕的命运最大的礼赞就是干翻它！","耶芙娜"],["一旦窥视过一眼，就再也无法返回平凡。","西瓦特尔"],["你已经做到了。不论是为了我，还是为了你自己，或者是为了这世界——不美好，但闪光的世界。你，成为了独一无二的大死神。","张隐辰"],["不管多少次，我和特莉波卡也会相遇，这是我的预言。","修洛特尔"],["门之主的证明，在无数的时光后，它回到了你的手中。","超凡物品【银匙】"],["我们将在林间重逢。","成就【斩绝恶】"],["这是一个幸福的终点。","成就【一切开始的地方】"],["这世上的道路有许多条，而每个人都有属于自己的那条。","齐夏"],["这世上只要有人对我付出『真心』，我便不可能让他得到『欺骗』。我想要对付的人，从来只有那些充满谎言的骗子。","齐夏"],["我从来不在乎身边的人是不是『够资格站在我身边』，我只在乎我身边的人拿出几分真心对我。我做事，很少依靠别人的力量。","齐夏"],["来找我。不管你是看到、听到、想到还是感受到这里的变故，请来找我，无论过去多少年，我都在这里等你。","齐夏"],["如果我成功了，我所说的都是真话；如果我失败了，我所说的都是假话。","齐夏"],["道法三千六百门，而人人各执一苗根。","终焉之地"],["这世上的道路有许多条，每个人都有属于自己的那条。选择不同，但终点相同，只要坚持，总会到达。","终焉之地"],["当有一个人开始说谎，剩下的人也都会变成说谎的羊。","终焉之地"],["『双生花』，一花绽，双花放。一花枯，双花死。","终焉之地"],["在好人遍地的世界我想当恶人；在坏人遍地的世界我想当好人。","终焉之地"],["如果我能成功，不需要什么葬礼，只需要你们给我一瓶好酒。若我不能成功，同样不要葬礼，就让我烂在街上吧。","乔家劲"],["风花雪月本闲，而扰攮者自冗。","九仔"]];
  let currentQuoteRoute = '', currentQuote;
  function addPageQuote(route) {
    if (route !== currentQuoteRoute || !currentQuote) {
      currentQuoteRoute = route;
      currentQuote = pageQuotes[Math.floor(Math.random() * pageQuotes.length)];
    }
    const figure = document.createElement('figure');
    figure.className = 'page-quote';
    const quote = document.createElement('blockquote');
    quote.textContent = currentQuote[0];
    const author = document.createElement('figcaption');
    author.textContent = `— ${currentQuote[1]}`;
    figure.append(quote, author);
    app.append(figure);
  }

  const cards = posts => posts.map(post => `<div class="post-timeline-item"><a class="post-timeline-card glass" href="#post/${encodeURIComponent(post.slug)}">${imageUrl(post.cover) ? `<div class="post-timeline-cover"><img src="${imageUrl(post.cover)}" alt="" loading="lazy"></div>` : ''}<div class="post-timeline-copy"><div class="post-meta"><span class="category">${esc(post.category)}</span><span>${date(post.date)}</span></div><h3>${esc(post.title)}</h3><div class="card-tags">${tags(post).map(t => `<span># ${esc(t)}</span>`).join('')}</div><p>${esc(post.excerpt)}</p><div class="card-bottom"><span>${esc(post.reading)}</span><span class="read-link">阅读文章 ↗</span></div></div></a></div>`).join('');
  const heading = (eyebrow, title, description) => `<div class="section-heading"><div><div class="eyebrow"><span></span>${eyebrow}</div><h2>${title}</h2></div><p>${description}</p></div>`;
  function profileCard() {
    const profile = data.profile || {};
    const avatar = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(profile.avatar || '') ? `<img src="${esc(profile.avatar)}" alt="个人头像">` : '<span aria-hidden="true">✳</span>';
    return `<section class="profile-panel glass"><div class="profile-avatar">${avatar}</div><div class="profile-copy"><div class="eyebrow"><span></span> MY PROFILE</div><h2>${esc(profile.name || '你的名字')}</h2><p>${esc(profile.signature || '个性签名，留给以后的自己。')}</p><div class="profile-tags">${(profile.tags || []).map(t => `<span>${esc(t)}</span>`).join('') || '<span class="tag-empty">你的标签</span>'}</div></div></section>`;
  }
  const contributionStart = '2026-10-30', contributionFirstYear = 2026;
  let contributionYear = Math.max(contributionFirstYear, new Date().getFullYear());
  function contributionPanel(year = contributionYear) {
    const activity = data.activity || {};
    const today = new Date();
    const lastToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const first = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const offset = first.getDay();
    const days = Array.from({length:offset}, () => '<span class="contribution-placeholder" aria-hidden="true"></span>');
    const labels = [];
    let active = 0, index = offset;
    for (let cursor = new Date(first); cursor <= end; cursor.setDate(cursor.getDate()+1), index++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`;
      const beforeStart = key < contributionStart, future = cursor > lastToday;
      const raw = Number(activity[key]);
      const count = !beforeStart && !future && Number.isFinite(raw) ? Math.max(0,raw) : 0;
      if (count > 0) active++;
      const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
      const label = beforeStart ? `${key}：建站之前` : future ? `${key}：尚未到来` : `${key}：${count} 次博客内容发布或更新`;
      days.push(`<span class="contribution-day level-${level}${future ? ' is-future' : ''}${beforeStart ? ' is-before-start' : ''}" data-date="${key}" title="${label}" aria-label="${label}"></span>`);
      if (cursor.getDate() === 1) labels.push(`<span style="grid-column:${Math.floor(index/7)+1}">${cursor.getMonth()+1}月</span>`);
    }
    const isCurrentYear = year >= today.getFullYear();
    return `<section class="contribution-panel glass"><div class="contribution-header"><div><div class="eyebrow"><span></span> BLOG ACTIVITY</div><h2>博客贡献度</h2><p>记录每一次内容的发布与更新</p></div><div class="contribution-summary"><div class="contribution-year"><button type="button" data-year-step="-1" aria-label="查看上一年"${year <= contributionFirstYear ? ' disabled' : ''}>‹</button><span class="contribution-year-label" tabindex="-1">${year} 年</span><button type="button" data-year-step="1" aria-label="查看下一年"${isCurrentYear ? ' disabled' : ''}>›</button></div><span class="active-days">${active} 个活跃日</span></div></div><div class="contribution-scroll" tabindex="0" aria-label="左右滚动查看 ${year} 年全年贡献度"><div class="contribution-inner"><div class="contribution-months">${labels.join('')}</div><div class="contribution-grid" aria-label="${year} 年博客贡献度">${days.join('')}</div></div></div><p class="contribution-scroll-hint">左右滑动查看全年</p><div class="contribution-legend"><span>少</span>${[0,1,2,3,4].map(n => `<i class="contribution-day level-${n}"></i>`).join('')}<span>多</span></div></section>`;
  }
  function home() {
    const profile = data.profile || {}, settings = data.settings || {};
    const avatar = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(profile.avatar || '') ? `<img src="${esc(profile.avatar)}" alt="个人头像">` : '✳';
    const wallpaper = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(settings.coverWallpaper || '') ? ` style="background-image:url('${settings.coverWallpaper}')"` : '';
    const title = settings.coverQuote || '我所热爱的，\n就是我的生活';
    const author = settings.coverAuthor || '— 将心之所向，写进每一天';
    const tagsList = Array.isArray(profile.tags) ? profile.tags : [];
    const post = config.posts.find(item => postSection(item) === 'posts'), moment = (config.moments || [])[0], album = (data.albums || [])[0];
    const panels = [
      {type:'articles', href:'#posts', label:'研习录', heading:post?.title || '最近写下的故事', text:post?.excerpt || '阅读学习、生活与灵感', image:imageUrl(post?.cover)},
      {type:'albums', href:'#albums', label:'光影集', heading:album?.title || '收藏眼前的风景', text:album?.description || '把喜欢的画面留在这里', image:imageUrl(album?.images?.[0])},
      {type:'moments', href:'#moments', label:'浮生记', heading:moment?.text || '记录此刻的心情', text:moment ? date(moment.date) : '一些生活里的小片刻', image:imageUrl(moment?.images?.find(imageUrl))}
    ].map(item => `<a class="home-window home-window--${item.type}${item.image ? ' has-image' : ''}" href="${item.href}">${item.image ? `<img src="${item.image}" alt="" loading="lazy">` : ''}<div class="home-window-copy"><span>${item.label}</span><h3>${esc(item.heading)}</h3><p>${esc(item.text)}</p><small>进入${item.label} ↗</small></div></a>`).join('');
    app.innerHTML = `<div class="chosen-home"><section class="cover" id="cover"><div class="cover-picture"${wallpaper}></div><div class="cover-shade"></div><header class="nav"><a class="wordmark" href="#home">${esc(config.name)}<span>’</span>s space<small>PERSONAL JOURNAL</small></a><nav aria-label="首页导航"><a href="#home" class="nav-current">首页</a><a href="#posts">研习录</a><a href="#moments">浮生记</a><a href="#talk">世间谈</a><a href="#projects">造物集</a><a href="#albums">光影集</a><a href="#about">关于</a></nav><span class="nav-end">✳</span></header><div class="cover-center"><div class="cover-kicker"><span></span> A LITTLE WORLD OF MY OWN <span></span></div><h1>${esc(title)}</h1><p>${esc(author)}</p><div class="cover-mark">✳</div></div><div class="cover-bottom"><span>01 / A PLACE TO BEGIN</span><button class="scroll-down" type="button"><span>向下探索</span><b>⌄</b></button><span>COLLECT THE LITTLE THINGS</span></div></section><main id="home-content" class="home"><div class="home-inner"><div class="section-overline"><span>✳</span><span>WELCOME TO MY LITTLE SPACE</span><span class="overline-line"></span><span>01 / HOME</span></div><section class="intro"><div class="intro-text"><div class="profile-line"><a class="profile-avatar profile-avatar-link" href="#about" aria-label="查看关于我">${avatar}</a><div><strong>${esc(profile.name || config.name)}</strong><small>YOUR PERSONAL SPACE</small></div></div><div class="small-label"><span></span> A NOTE FROM ME</div><h2>你好，<br>欢迎来到我的<span>小小世界。</span></h2>${String(config.description || '').split(/\r?\n/).filter(line => line.trim()).map(line => `<p>${esc(line)}</p>`).join('')}<div class="interest-tags">${tagsList.map(t=>`<span>${esc(t)}</span>`).join('')}</div><button class="text-link discover-jump" type="button">从最近的故事开始 <span>↗</span></button></div><div class="art-space"><div class="art-halo"></div><div class="art-frame"></div><img class="character" src="/personal/character.png" alt="首页角色" onerror="this.hidden=true"><div class="art-caption"><span>THE THINGS I LOVE</span><b>与你共享的<br>小小风景</b><i>✳</i></div><div class="art-number">FIG. 01 &nbsp; / &nbsp; A QUIET COMPANY</div></div></section><section class="home-discover"><div class="journal-heading"><div><div class="small-label"><span></span> A LITTLE WORLD</div><h2>在这里<span>慢慢发现</span></h2></div></div><div class="home-window-grid">${panels}<button class="home-theme" type="button" data-theme-toggle aria-pressed="false"><span class="theme-symbol" aria-hidden="true">☾</span><span class="theme-name">夜间模式</span><small>切换光影氛围</small></button></div></section><section class="home-activity">${contributionPanel()}</section><section class="little-note"><span>✳</span><div><small>A LITTLE NOTE</small><p>谢谢你来到这里，愿我们都能认真生活，自由喜欢。</p></div><a href="#home" aria-label="返回顶部">↑</a></section><div class="home-footer"><span>© ${new Date().getFullYear()} ${esc(config.name)}’S SPACE</span><span>MADE WITH LITTLE MOMENTS ✳</span></div></div></main></div>`;
    applyTheme();
    app.querySelector('[data-theme-toggle]').addEventListener('click', () => { isNight = !isNight; try { localStorage.setItem('blog-theme', isNight ? 'night' : 'day'); } catch {} applyTheme(); });
    const character = app.querySelector('.character');
    fetch('/personal/character-mask.png').then(res => { if (res.ok && character.isConnected) character.classList.add('has-mask'); }).catch(() => {});
    app.querySelector('.scroll-down').addEventListener('click', () => document.getElementById('home-content').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
    app.querySelector('.discover-jump').addEventListener('click', () => app.querySelector('.home-discover').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
    app.querySelector('.home-activity').addEventListener('click', event => {
      const button = event.target.closest('[data-year-step]');
      if (!button || button.disabled) return;
      const step = Number(button.dataset.yearStep), year = contributionYear + step;
      if (year < contributionFirstYear || year > Math.max(contributionFirstYear, new Date().getFullYear())) return;
      contributionYear = year;
      const container = app.querySelector('.home-activity');
      container.innerHTML = contributionPanel(year);
      const sameButton = container.querySelector(`[data-year-step="${step}"]`);
      if (sameButton && !sameButton.disabled) sameButton.focus();
      else container.querySelector('.contribution-year-label').focus();
    });
  }
  function postsPage(section = 'posts') {
    const sectionPosts = config.posts.filter(p => postSection(p) === section);
    const categories = [...new Set(sectionPosts.map(p => p.category).filter(Boolean))];
    const allTags = [...new Set(sectionPosts.flatMap(tags))];
    app.innerHTML = `<section class="inner-page">${section === 'talk' ? heading('OPEN THOUGHTS','世间谈','态度是心的面具') : heading('THE ARCHIVE','研习录',`杂学旁收的废物<br><span class="section-total">共 ${sectionPosts.length} 篇研习目录</span>`)}<label class="search"><span>⌕</span><input type="search" placeholder="${section === 'talk' ? '在纷纷话语间，寻一种声音…' : '在字里行间，寻找一点灵感…'}" aria-label="${section === 'talk' ? '搜索闲谈' : '搜索文章'}"></label><div class="filter-row"><span>分类</span><div id="category-filters" class="filter-buttons"></div></div><div class="filter-row"><span>标签</span><div id="tag-filters" class="filter-buttons"></div></div><p class="result-count" aria-live="polite"></p><div class="post-timeline" id="post-list"></div><p class="empty" hidden>没有找到相关文章，试试其他关键词或筛选条件。</p></section>`;
    let category = '', tag = '';
    const input = app.querySelector('input');
    function update() {
      const query = input.value.trim().toLowerCase();
      const filtered = sectionPosts.filter(p => (!category || p.category === category) && (!tag || tags(p).includes(tag)) && [p.title,p.category,p.excerpt,...tags(p)].some(v => String(v || '').toLowerCase().includes(query)));
      app.querySelector('#post-list').innerHTML = cards(filtered);
      app.querySelector('.empty').hidden = filtered.length > 0;
      app.querySelector('.result-count').textContent = `共 ${filtered.length} 篇文章`;
      const buttons = (values, selected) => ['', ...values].map((v,i) => `<button type="button" data-index="${i}" class="filter-chip${v === selected ? ' selected' : ''}" aria-pressed="${v === selected}">${esc(v || '全部')}</button>`).join('');
      app.querySelector('#category-filters').innerHTML = buttons(categories,category);
      app.querySelector('#tag-filters').innerHTML = buttons(allTags,tag);
    }
    input.addEventListener('input', update);
    app.querySelector('#category-filters').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { category = ['',...categories][Number(b.dataset.index)]; update(); } });
    app.querySelector('#tag-filters').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { tag = ['',...allTags][Number(b.dataset.index)]; update(); } });
    update();
  }
  function momentsPage() {
    const moments = config.moments || [];
    app.innerHTML = `<section class="inner-page">${heading('LITTLE MOMENTS','浮生记','日常发癫报复社会')}<label class="search"><span>⌕</span><input type="search" placeholder="翻一翻，那些零碎的日常…" aria-label="搜索随笔"></label><div class="moment-grid"></div><p class="empty moment-empty" hidden></p></section>`;
    const input = app.querySelector('input'), grid = app.querySelector('.moment-grid'), empty = app.querySelector('.moment-empty');
    function update() {
      const query = input.value.trim().toLowerCase();
      const matches = moments.filter(m => [m.text,...(m.tags || [])].some(value => String(value || '').toLowerCase().includes(query)));
      grid.innerHTML = matches.map(m => `<article class="moment-card glass"><div class="moment-card-header"><span class="moment-mark">✳</span><time>${date(m.date)}</time></div><p>${esc(m.text).replace(/\n/g,'<br>')}</p>${Array.isArray(m.images) && m.images.some(imageUrl) ? `<div class="moment-images ${m.images.length === 1 ? 'single' : ''}">${m.images.filter(imageUrl).map((src,i) => `<a href="${imageUrl(src)}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl(src)}" alt="动态图片 ${i+1}" loading="lazy"></a>`).join('')}</div>` : ''}<div class="card-tags">${(m.tags || []).map(t => `<span># ${esc(t)}</span>`).join('')}</div></article>`).join('');
      empty.hidden = matches.length > 0; empty.textContent = moments.length ? '没有找到匹配的随笔。' : '还没有动态，期待第一条记录。';
    }
    input.addEventListener('input', update); update();
  }
  function albumsPage() {
    const albums = Array.isArray(data.albums) ? data.albums : [];
    app.innerHTML = `<section class="inner-page photo-wall">${heading('PHOTOGRAPHIC NOTES','光影集','人们无法判断一个瞬间的价值<br>直到它成为回忆')}<div class="album-grid"></div><p class="empty album-empty" hidden>没有找到相册。</p></section>`;
    const grid = app.querySelector('.album-grid'), empty = app.querySelector('.album-empty');
    const update = () => { const matches = albums.map((album,index) => ({album,index}));
      grid.innerHTML = matches.map(({album,index}) => { const images = Array.isArray(album.images) ? album.images.filter(imageUrl) : []; const cover = imageUrl(images[0]); return `<a class="album-card" href="#album/${index}"><div class="album-stack"><div class="album-sheet album-sheet-back"></div><div class="album-sheet album-sheet-mid"></div>${cover ? `<img class="album-photo" src="${cover}" alt="" loading="lazy">` : '<div class="album-photo album-placeholder">✳</div>'}</div><div class="album-caption"><h2>${esc(album.title)}</h2><span>${date(album.date)}</span><p>${esc(album.description || '')}</p><small>${images.length} 张照片</small></div></a>`; }).join(''); empty.hidden = matches.length > 0; empty.textContent = albums.length ? '没有找到相册。' : '还没有相册，点击编辑此页添加第一组照片。'; };
    update();
  }
  function albumPage(index) {
    const album = (data.albums || [])[index];
    if (!album) { albumsPage(); return; }
    const images = Array.isArray(album.images) ? album.images.filter(imageUrl) : [];
    app.innerHTML = `<section class="inner-page album-detail"><a class="back" href="#albums">← 返回光影集</a><div class="section-heading"><div><div class="eyebrow"><span></span> PHOTO ALBUM</div><h1>${esc(album.title)}</h1><p>${esc(album.description || '')}</p></div></div><div class="album-photos">${images.map((src,i) => `<a href="${imageUrl(src)}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl(src)}" alt="${esc(album.title)}，照片 ${i+1}" loading="lazy"></a>`).join('')}</div></section>`;
  }
  function projectsPage() {
    const projects = config.projects || [];
    app.innerHTML = `<section class="inner-page">${heading('A COLLECTION OF THINGS','造物集','把灵感写成现实，<br>让想法慢慢成形。')}<label class="search"><span>⌕</span><input type="search" placeholder="循着灵感，找一件小作品…" aria-label="搜索项目"></label><div class="project-grid"></div><p class="empty project-empty" hidden></p></section>`;
    const input = app.querySelector('input'), grid = app.querySelector('.project-grid'), empty = app.querySelector('.project-empty');
    function update() {
      const query = input.value.trim().toLowerCase();
      const matches = projects.filter(p => [p.title,p.category,p.description].some(value => String(value || '').toLowerCase().includes(query)));
      grid.innerHTML = matches.map(p => { const url = safeUrl(p.url); const content = `<div class="project-top"><span class="project-icon">✺</span><span>${url ? '↗' : '✧'}</span></div><span class="category">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>`; return url ? `<a class="project-card glass" href="${url}" target="_blank" rel="noopener noreferrer">${content}</a>` : `<article class="project-card glass">${content}</article>`; }).join('');
      empty.hidden = matches.length > 0; empty.textContent = projects.length ? '没有找到匹配的项目。' : '还没有收藏，慢慢添加吧。';
    }
    input.addEventListener('input', update); update();
  }
  function about() {
    const profile = data.profile || {}, settings = data.settings || {};
    const avatar = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(profile.avatar || '') ? `<img src="${esc(profile.avatar)}" alt="个人头像">` : '<span aria-hidden="true">✳</span>';
    const wallpaper = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(settings.coverWallpaper || '') ? ` style="background-image:url('${settings.coverWallpaper}')"` : '';
    const name = profile.name || config.name;
    app.innerHTML = `<section class="inner-page about-page">${heading('A LITTLE ABOUT ME','关于我','')}<article class="about-profile glass"><div class="about-cover"${wallpaper}></div><div class="about-content"><div class="about-profile-avatar">${avatar}</div><div class="about-title"><p>HELLO, I'M ${esc(name)}</p></div><div class="about-introduction"><h2>个人简介</h2><p>${esc(config.about || '在这里写下关于自己的故事。').replace(/\n/g,'<br>')}</p>${profile.signature ? `<p class="about-signature">${esc(profile.signature)}</p>` : ''}<div class="interest-list">${(config.interests || []).map(i => `<span>${esc(i)}</span>`).join('')}</div></div><div class="about-timeline"><div class="eyebrow"><span></span> ALONG THE WAY</div><h2>一路走来</h2><div class="history-list">${(config.timeline || []).map(item => `<div class="history-item"><span>${esc(item.date)}</span><div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div></div>`).join('') || '<p class="empty">故事正在书写中。</p>'}</div></div><a class="button primary" href="${safeUrl(config.github) || '#home'}" target="_blank" rel="noopener noreferrer">访问我的 GitHub <span>↗</span></a></div></article></section>`;
  }
  function markdown(source) {
    const headings = [];
    const inline = value => {
      const tokens = [];
      let text = esc(value).replace(/`([^`]+)`/g, (_, code) => { tokens.push(`<code>${code}</code>`); return `\u0000${tokens.length - 1}\u0000`; });
      text = text.replace(/!\[([^\]]*)\]\((\/personal\/uploads\/[a-f0-9-]{36}\.(?:png|jpg|webp|gif))\)/g, (_, alt, url) => { tokens.push(`<img src="${imageUrl(url)}" alt="${alt}" loading="lazy">`); return `\u0000${tokens.length - 1}\u0000`; });
      text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/~~(.+?)~~/g,'<del>$1</del>');
      return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
    };
    const lines = source.replace(/\r\n?/g,'\n').split('\n'); let html = '', list = '', code = null;
    const closeList = () => { if (list) { html += `</${list}>`; list = ''; } };
    lines.forEach(line => {
      if (/^\s*```/.test(line)) { closeList(); if (code === null) code = []; else { html += `<pre><code>${esc(code.join('\n'))}</code></pre>`; code = null; } return; }
      if (code !== null) { code.push(line); return; }
      const item = line.match(/^\s*(?:([-*+])\s+|(\d+)\.\s+)(.*)$/);
      if (item) { const type = item[1] ? 'ul' : 'ol'; if (list !== type) { closeList(); list = type; html += `<${type}>`; } html += `<li>${inline(item[3])}</li>`; return; }
      closeList(); const h = line.match(/^(#{1,3})\s+(.+)$/);
      if (h) { const level = h[1].length, id = `section-${headings.length + 1}`; headings.push({id, title:h[2], level}); html += `<h${level} id="${id}">${inline(h[2])}</h${level}>`; }
      else if (/^>\s?/.test(line)) html += `<blockquote>${inline(line.replace(/^>\s?/,''))}</blockquote>`;
      else if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) html += '<hr>';
      else if (line.trim()) html += `<p>${inline(line)}</p>`;
    });
    closeList(); if (code !== null) html += `<pre><code>${esc(code.join('\n'))}</code></pre>`;
    return {html, headings};
  }
  async function postPage(slug) {
    const post = config.posts.find(p => p.slug === slug);
    if (!post) { app.innerHTML = `<section class="inner-page glass message"><h1>文章没有找到</h1><a href="#posts">← 返回文章列表</a></section>`; return; }
    const profile = data.profile || {};
    const avatar = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(profile.avatar || '') ? `<img src="${esc(profile.avatar)}" alt="">` : '<span aria-hidden="true">✳</span>';
    const cover = imageUrl(post.cover);
    const section = postSection(post);
    const recent = config.posts.filter(p => p.slug !== slug && postSection(p) === section).slice(0, 4);
    app.innerHTML = `<section class="inner-page article-page"><div class="article-page-grid"><article class="glass article-paper">${cover ? `<div class="article-cover"><img src="${cover}" alt="${esc(post.title)}的封面"></div>` : ''}<div class="article-content"><a class="back" href="#${section}">← 返回${section === 'talk' ? '世间谈' : '研习录'}列表</a><header class="article-header"><h1>${esc(post.title)}</h1><div class="post-meta"><span class="category">${esc(post.category || '随笔')}</span><span>${date(post.date)}</span>${post.reading ? `<span>${esc(post.reading)}</span>` : ''}</div><div class="card-tags">${tags(post).map(t => `<span># ${esc(t)}</span>`).join('')}</div>${post.excerpt ? `<p class="article-excerpt">${esc(post.excerpt)}</p>` : ''}</header><details class="article-mobile-toc" hidden><summary>文章目录</summary><nav aria-label="文章目录"></nav></details><div class="article-body">正在加载文章…</div><div class="article-neighbors"></div><div class="comments-placeholder"><span>✧</span><div><h3>留言</h3><p>留言功能预留中，接入服务后即可在这里交流。</p></div></div></div></article><aside class="article-sidebar" aria-label="文章导航"><div class="article-side-stack"><section class="glass article-side-card article-author"><a class="article-author-avatar" href="#about" aria-label="查看关于我">${avatar}</a><h2>${esc(profile.name || config.name)}</h2><p>${esc(profile.signature || config.description || '')}</p><a href="#about">了解我 ↗</a></section><nav class="glass article-side-card article-shortcuts" aria-label="快速访问"><h2>去看看</h2><div><a href="#about">关于我 ↗</a><a href="#posts">研习录 ↗</a><a href="#moments">浮生记 ↗</a><a href="#talk">世间谈 ↗</a><a href="#projects">造物集 ↗</a><a href="#albums">光影集 ↗</a></div></nav>${recent.length ? `<section class="glass article-side-card article-recent"><h2>最近文章</h2>${recent.map(p => `<a href="#post/${encodeURIComponent(p.slug)}"><strong>${esc(p.title)}</strong><small>${date(p.date)}</small></a>`).join('')}</section>` : ''}<nav class="glass article-side-card article-toc" aria-label="文章目录" hidden></nav></div></aside></div></section>`;
    try {
      let content = post.body; if (typeof content !== 'string') { const res = await fetch(post.file); if (!res.ok) throw new Error('无法读取文章'); content = await res.text(); }
      if (location.hash !== `#post/${encodeURIComponent(slug)}`) return;
      const rendered = markdown(content); app.querySelector('.article-body').innerHTML = rendered.html;
      const entries = rendered.headings;
      if (entries.length) {
        const links = entries.map(h => `<button type="button" class="toc-level-${h.level}" data-id="${h.id}">${esc(h.title)}</button>`).join('');
        const toc = app.querySelector('.article-toc'); toc.hidden = false; toc.innerHTML = `<h2>文章目录</h2>${links}`;
        const mobile = app.querySelector('.article-mobile-toc'); mobile.hidden = false; mobile.querySelector('nav').innerHTML = links;
        [toc, mobile].forEach(container => container.addEventListener('click', e => { const button = e.target.closest('button[data-id]'); if (!button) return; const target = document.getElementById(button.dataset.id); if (target) target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'}); }));
      }
      const group = config.posts.filter(p => postSection(p) === section), index = group.indexOf(post), neighbors = [group[index - 1],group[index + 1]];
      app.querySelector('.article-neighbors').innerHTML = neighbors.map((p,i) => p ? `<a href="#post/${encodeURIComponent(p.slug)}"><small>${i ? '下一篇 →' : '← 上一篇'}</small><strong>${esc(p.title)}</strong></a>` : '<span></span>').join('');
    } catch { const body = app.querySelector('.article-body'); if (body && location.hash === `#post/${encodeURIComponent(slug)}`) body.textContent = '文章加载失败。请通过本地服务器打开网站，并检查文章文件是否存在。'; }
  }
  function render(preserveScroll = false) { const route = location.hash.slice(1) || 'home'; const foundPost = route.startsWith('post/') ? config.posts.find(p => encodeURIComponent(p.slug) === route.slice(5)) : null; const section = route.startsWith('post/') ? postSection(foundPost) : route.startsWith('album/') ? 'albums' : route; document.body.classList.toggle('home-active',route === 'home'); document.querySelectorAll('[data-nav]').forEach(a => { const active = a.dataset.nav === section; a.classList.toggle('active', active); if (active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); }); if (route === 'home') home(); else if (route === 'posts' || route === 'talk') postsPage(route); else if (route === 'moments') momentsPage(); else if (route === 'albums') albumsPage(); else if (/^album\/\d+$/.test(route)) albumPage(Number(route.slice(6))); else if (route === 'projects') projectsPage(); else if (route === 'about') about(); else if (route.startsWith('post/')) { try { postPage(decodeURIComponent(route.slice(5))); } catch { postsPage(); } } else home(); if (!app.querySelector('.chosen-home')) addPageQuote(route); addEditButton(section, route); if (!preserveScroll) window.scrollTo(0,0); }
  function addEditButton(section, route) {
    if (location.hostname !== '127.0.0.1' || location.port !== '4173') return;
    const panel = ({home:'profile',posts:'posts',talk:'posts',moments:'moments',albums:'albums',projects:'projects',about:'about'})[section];
    if (!panel) return;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'page-edit'; button.textContent = '✎ 编辑此页';
    button.addEventListener('click', () => {
      const dialog = document.createElement('dialog'); dialog.className = 'edit-dialog';
      const close = document.createElement('button'); close.className = 'dialog-close'; close.type = 'button'; close.textContent = '关闭 ×';
      const frame = document.createElement('iframe'); frame.title = '编辑此页面';
      const slug = route.startsWith('post/') ? `&slug=${encodeURIComponent(decodeURIComponent(route.slice(5)))}` : '';
      frame.src = `/editor?panel=${panel}${slug}${section === 'talk' ? '&section=talk' : ''}&embedded=1`;
      let saved = false;
      const onMessage = event => { if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'blog-editor-saved') saved = true; };
      window.addEventListener('message', onMessage);
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', async () => {
        window.removeEventListener('message', onMessage); dialog.remove();
        if (!saved) return;
        try {
          const res = await fetch('/api/data', {cache:'no-store'}); if (!res.ok) throw new Error('读取失败');
          const latest = await res.json(); Object.assign(data, latest);
          for (const key of ['posts','moments','projects']) if (Array.isArray(data[key])) config[key] = data[key];
          for (const key of ['title','description','about','interests','timeline','github']) if (data.settings && Object.hasOwn(data.settings,key)) config[key] = data.settings[key];
          document.querySelector('#brand-name').textContent = config.name || 'Aurelia';
          document.querySelector('.github').href = safeUrl(config.github) || '#about';
          const y = window.scrollY; render(true); window.scrollTo({top:y,behavior:'instant'});
        } catch { alert('内容已保存，但页面更新失败，请手动刷新查看。'); }
      });
      dialog.append(close, frame); document.body.append(dialog); dialog.showModal();
    });
    app.prepend(button);
  }
  let homeScrolling = false, homeScrollDirection = '', homeScrollTimer = null, homeTouch = null;
  function scrollHomeSection(target, direction) {
    homeScrolling = true; homeScrollDirection = direction;
    clearTimeout(homeScrollTimer);
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    homeScrollTimer = setTimeout(() => { homeScrolling = false; homeScrollDirection = ''; }, 1000);
  }
  window.addEventListener('wheel', event => {
    if (!document.body.classList.contains('home-active') || document.querySelector('dialog[open]')) return;
    const cover = document.getElementById('cover'); if (!cover) return;
    if (homeScrolling) {
      event.preventDefault();
      if (event.deltaY < -5 && homeScrollDirection === 'down') scrollHomeSection(cover, 'up');
      else if (event.deltaY > 5 && homeScrollDirection === 'up') scrollHomeSection(document.getElementById('home-content'), 'down');
      return;
    }
    const bottom = cover.getBoundingClientRect().bottom;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const downward = event.deltaY > 0 && bottom > 35 && bottom <= innerHeight + 2;
    const upward = event.deltaY < 0 && bottom >= -4 && bottom < innerHeight - 35;
    if (downward || upward) {
      event.preventDefault();
      const target = downward ? document.getElementById('home-content') : cover;
      scrollHomeSection(target, downward ? 'down' : 'up');
    }
  }, {passive:false});
  window.addEventListener('touchstart', event => {
    if (!document.body.classList.contains('home-active') || document.querySelector('dialog[open]') || event.touches.length !== 1) { homeTouch = null; return; }
    const cover = document.getElementById('cover');
    homeTouch = cover ? {y:event.touches[0].clientY, bottom:cover.getBoundingClientRect().bottom, direction:''} : null;
  }, {passive:true});
  window.addEventListener('touchmove', event => {
    if (!homeTouch || event.touches.length !== 1) return;
    const delta = event.touches[0].clientY - homeTouch.y;
    if (delta < -10 && homeTouch.bottom > 35 && homeTouch.bottom <= innerHeight + 2) homeTouch.direction = 'down';
    else if (delta > 10 && homeTouch.bottom >= -4 && homeTouch.bottom < innerHeight - 35) homeTouch.direction = 'up';
    if (homeTouch.direction) event.preventDefault();
  }, {passive:false});
  window.addEventListener('touchend', event => {
    if (!homeTouch || !event.changedTouches.length) { homeTouch = null; return; }
    const delta = event.changedTouches[0].clientY - homeTouch.y, direction = homeTouch.direction;
    homeTouch = null;
    if (Math.abs(delta) < 40 || !direction) return;
    scrollHomeSection(document.getElementById(direction === 'down' ? 'home-content' : 'cover'), direction);
  }, {passive:true});
  // Personal wallpapers stay local; missing images leave the existing background intact.
  function startWallpaperBackground() {
    const images = Array.from({length:12}, (_, i) => `/personal/wallpapers/wallpaper-${String(i + 1).padStart(2, '0')}.png`);
    let index = Math.floor(Math.random() * images.length), current = 0, failures = 0;
    const layer = document.createElement('div');
    layer.className = 'wallpaper-ambience'; layer.setAttribute('aria-hidden', 'true');
    const panels = [document.createElement('div'), document.createElement('div')];
    layer.append(...panels); document.body.prepend(layer);
    function next() {
      const url = images[index++ % images.length], image = new Image();
      image.onload = () => {
        failures = 0;
        const target = panels[current];
        target.style.backgroundImage = `url("${url}")`;
        target.classList.add('visible'); panels[1-current].classList.remove('visible');
        document.body.classList.add('has-wallpaper-background'); current = 1-current;
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(next, 18000);
      };
      image.onerror = () => { if (++failures < images.length) next(); };
      image.src = url;
    }
    next();
  }
  startWallpaperBackground();
  const fireflies = document.createElement('div'); fireflies.className = 'night-fireflies'; fireflies.setAttribute('aria-hidden','true');
  for (let i=0; i<24; i++) { const spark = document.createElement('i'); spark.style.left = `${(i * 47 + 7) % 97}%`; spark.style.top = `${(i * 67 + 11) % 94}%`; spark.style.setProperty('--spark-delay', `${-(i % 9)}s`); spark.style.setProperty('--spark-duration', `${3.5 + (i % 5) * 0.5}s`); fireflies.append(spark); }
  document.body.append(fireflies);
  // Decorative atmosphere never intercepts input or changes site content.
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let atmosphere;
  function updateAtmosphere() {
    atmosphere?.remove();
    atmosphere = null;
    if (motionPreference.matches) return;
    const weather = Math.random() < .5 ? 'rain' : 'snow';
    atmosphere = document.createElement('div');
    atmosphere.className = `atmosphere atmosphere--${weather}`;
    atmosphere.setAttribute('aria-hidden', 'true');
    const count = matchMedia('(max-width: 760px)').matches ? (weather === 'rain' ? 30 : 22) : (weather === 'rain' ? 50 : 36);
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('i');
      particle.style.setProperty('--x', `${Math.random() * (weather === 'rain' ? 122 : 100)}%`);
      particle.style.setProperty('--delay', `${-Math.random() * 14}s`);
      particle.style.setProperty('--duration', `${weather === 'rain' ? 1.8 + Math.random() * 1.6 : 8 + Math.random() * 7}s`);
      particle.style.setProperty('--drift', `${weather === 'rain' ? -innerHeight * .22 : (Math.random() - .5) * 65}px`);
      particle.style.setProperty('--size', `${10 + Math.random() * 7}px`);
      atmosphere.append(particle);
    }
    document.body.append(atmosphere);
  }
  updateAtmosphere();
  motionPreference.addEventListener('change', updateAtmosphere);
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || motionPreference.matches) return;
    const ripple = document.createElement('span');
    ripple.className = 'click-spark';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), {once:true});
  });
  document.querySelector('#year').textContent = new Date().getFullYear(); document.querySelector('#brand-name').textContent = config.name || 'Aurelia'; const githubLink = document.querySelector('.github'); githubLink.href = safeUrl(config.github) || '#about'; window.addEventListener('hashchange', () => {
    render();
    if (app.getAnimations) app.getAnimations().forEach(animation => animation.cancel());
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && app.animate) {
      app.animate([{opacity:0,transform:'translateY(14px)',offset:0},{opacity:1,transform:'translateY(-3px)',offset:.68},{opacity:1,transform:'translateY(0)',offset:1}], {duration:560,easing:'ease-out'});
    }
  }); render();
})();
