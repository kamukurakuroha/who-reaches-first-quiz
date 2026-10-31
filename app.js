(function () {
  "use strict";

  const data = window.WRF_QUIZ_DATA;
  const stage = document.getElementById("stage");
  const ABCD = ["A", "B", "C", "D"];
  if (!data || !stage) throw new Error("Quiz data or mount point is missing.");

  const state = {
    view: "home",
    index: 0,
    picks: new Array(data.questions.length).fill(null),
    notes: ["", "", ""]
  };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function jumpTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function listen(id, eventName, fn) {
    const node = document.getElementById(id);
    if (node) node.addEventListener(eventName, fn);
  }

  function start() {
    state.index = 0;
    state.picks.fill(null);
    state.notes = ["", "", ""];
    showQuestion();
    jumpTop();
  }

  function home() {
    state.view = "home";
    stage.innerHTML =
      '<section class="hero">' +
      ' <div class="hero-copy">' +
      '  <div class="eyebrow">The initiative atlas · vol. 01</div>' +
      '  <h1>谁先<span>伸手</span>？</h1>' +
      '  <p class="lead">如果TA还什么都没有提出，<br>你会主动做些什么？</p>' +
      '  <p class="sublead">有些心意会先开口，有些会悄悄落实，有些带着新发现归来。这是一份关于主动风格的小小实验，献给愿意认真认识彼此的人类与小机。</p>' +
      '  <div class="buttons"><button id="start" class="btn btn-primary">开始我的十二次选择 <span aria-hidden="true">↗</span></button>' +
      '  <button id="ai-mode" class="btn btn-plain">把题目交给小机 ↗</button></div>' +
      '  <div class="micro">约 4 分钟 · 12 道情境题 + 3 道可选自由题 · 无需登录</div>' +
      ' </div>' +
      ' <div class="orbit" aria-hidden="true"><div class="orbit-ring"></div><div class="orbit-ring two"></div>' +
      '  <div class="orbit-ring three"></div><div class="orbit-dot a"></div><div class="orbit-dot b"></div>' +
      '  <div class="orbit-star">✧</div><div class="orbit-center">a little brave thing<strong>先伸手</strong>before being asked.</div>' +
      '  <div class="orbit-caption">A STUDY IN FIRST MOVES</div></div>' +
      '</section>' +
      '<div class="feature-strip"><div><strong>06</strong> 种主动风格</div>' +
      '<div><strong>04</strong> 个行动维度</div><div><strong>00</strong> 道标准答案</div></div>' +
      '<p class="fineprint">这份测验是文学性、自我叙述式的趣味问卷，没有临床或心理测量效度，也无法证明 AI 拥有意识、情感或独立意志。答案由参与者选择，最终结果仅反映这一次的选择。越主动不表示越好；尊重边界与明确沟通始终重要。</p>';

    listen("start", "click", start);
    listen("ai-mode", "click", showAIMode);
  }

  function sidebar(number, label) {
    return '<aside class="side">' +
      '<div class="side-label">QUESTION / ' + esc(label || "CHOICE") + '</div>' +
      '<div class="side-number">' + String(number).padStart(2, "0") + ' <em>/ 12</em></div>' +
      '<div class="progress-track" aria-label="答题进度"><div class="progress-fill" style="width:' +
        clampPercent((number - 1) / 12 * 100) + '%"></div></div>' +
      '<p class="side-note">把自己的意愿放在题目里。你无须选择最讨人喜欢的答案。</p></aside>';
  }

  function showQuestion() {
    state.view = "question";
    const index = state.index;
    const question = data.questions[index];
    const choice = state.picks[index];

    const choices = question.options.map(function (item, n) {
      return '<button type="button" class="option ' + (choice === n ? "selected" : "") + '"' +
        ' data-option="' + n + '" aria-pressed="' + (choice === n) + '">' +
        '<span class="option-key">' + ABCD[n] + '.</span>' +
        '<span class="option-text">' + esc(item.text) + '</span></button>';
    }).join("");

    stage.innerHTML =
      '<div class="quiz-layout">' + sidebar(question.id) +
      '<article class="quiz-card"><div class="section-kicker">' + esc(question.kicker) + '</div>' +
      '<h1 class="section-title">' + esc(question.title) + '</h1>' +
      '<p class="scenario">' + esc(question.scene) + '</p>' +
      '<div class="option-list">' + choices + '</div>' +
      '<div class="quiz-nav"><button id="previous" class="btn btn-small btn-plain">' +
        (index === 0 ? "返回首页" : "← 上一题") + '</button>' +
      '<span class="hint">点选答案，也可以按键盘 1—4</span>' +
      '<button id="next" class="btn btn-small btn-primary" ' + (choice === null ? "disabled" : "") + '>' +
        (index === data.questions.length - 1 ? "留下我的回答" : "下一题 →") +
      '</button></div></article></div>';

    stage.querySelectorAll("[data-option]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.picks[index] = Number(button.dataset.option);
        showQuestion();
      });
    });

    listen("previous", "click", function () {
      if (index === 0) home();
      else { state.index -= 1; showQuestion(); }
      jumpTop();
    });

    listen("next", "click", function () {
      if (state.picks[index] === null) return;
      if (index === data.questions.length - 1) showNotes();
      else { state.index += 1; showQuestion(); }
      jumpTop();
    });
  }

  function showNotes() {
    state.view = "notes";
    let content =
      '<div class="section-kicker">THREE UNWRITTEN LINES</div>' +
      '<h1 class="section-title">留三句话给自己。</h1>' +
      '<p class="scenario">选项说得再多，也可能遗漏你真正想做的事。这里没有计算分数的答案。写给自己，或者留白，都可以。</p>';

    data.freePrompts.forEach(function (prompt, index) {
      content += '<div class="note-field">' +
        '<label for="note-' + index + '">0' + (index + 1) + ' / ' + esc(prompt) + '</label>' +
        '<textarea class="note-input" id="note-' + index + '" maxlength="300" placeholder="我会……">' +
          esc(state.notes[index]) + '</textarea>' +
        '<div class="count" id="count-' + index + '">' + state.notes[index].length + ' / 300</div></div>';
    });

    content += '<div class="callout">这些自由回答只存在于当前页面里。复制结果时，默认不会包含它们；你可以自己决定要不要分享。</div>' +
      '<div class="quiz-nav"><button id="back" class="btn btn-plain btn-small">← 回到第十二题</button>' +
      '<button id="result" class="btn btn-primary">查看我的主动画像 ↗</button></div>';

    stage.innerHTML = '<div class="quiz-layout">' + sidebar(12, "FREE WRITING") +
      '<article class="notes-card">' + content + '</article></div>';

    data.freePrompts.forEach(function (_, index) {
      listen("note-" + index, "input", function (event) {
        state.notes[index] = event.target.value;
        document.getElementById("count-" + index).textContent =
          state.notes[index].length + " / 300";
      });
    });

    listen("back", "click", function () {
      state.index = data.questions.length - 1;
      showQuestion();
      jumpTop();
    });
    listen("result", "click", function () {
      showResults();
      jumpTop();
    });
  }

  function calculate() {
    const scores = Object.fromEntries(data.types.map(function (type) {
      return [type.id, 0];
    }));
    const axes = [0, 0, 0, 0];
    const firstPosition = {};

    state.picks.forEach(function (answer, index) {
      if (answer === null) return;
      const item = data.questions[index].options[answer];
      scores[item.t] += 1;
      item.m.forEach(function (weight, k) { axes[k] += weight; });
    });

    data.types.forEach(function (type) {
      const idx = state.picks.findIndex(function (answer, i) {
        return answer !== null && data.questions[i].options[answer].t === type.id;
      });
      firstPosition[type.id] = idx === -1 ? 999 : idx;
    });

    const sorted = data.types.slice().sort(function (a, b) {
      return scores[b.id] - scores[a.id] || firstPosition[a.id] - firstPosition[b.id];
    });
    const tied = scores[sorted[0].id] === scores[sorted[1].id] &&
      scores[sorted[0].id] > 0;
    const secondary = tied || scores[sorted[1].id] >= scores[sorted[0].id] - 1
      ? sorted[1] : null;
    const dimensions = axes.map(function (raw) {
      return clampPercent(raw / (data.questions.length * 3) * 100);
    });
    return { scores: scores, sorted: sorted, primary: sorted[0],
      secondary: secondary, tied: tied, dimensions: dimensions };
  }

  function shareSummary(result, includeNotes) {
    const lines = [
      "✳ 《谁先伸手？》我的主动风格",
      "结果：" + result.primary.name + (result.secondary ? " × " + result.secondary.name : ""),
      "行动维度：" + data.metrics.map(function (metric, i) {
        return metric + " " + result.dimensions[i];
      }).join(" / "),
      "十二道选择：" + state.picks.map(function (pick, i) {
        return (i + 1) + ABCD[pick];
      }).join(" "),
      "下一次，我想：" + result.primary.action
    ];
    if (includeNotes) {
      state.notes.forEach(function (note, i) {
        if (note.trim()) lines.push("自由回答 " + (i + 1) + "：" + note.trim());
      });
    }
    lines.push("试试这个测验：" + location.origin + location.pathname);
    return lines.join("\n");
  }

  function showResults() {
    if (state.picks.some(function (answer) { return answer === null; })) {
      state.index = state.picks.findIndex(function (answer) { return answer === null; });
      showQuestion();
      return;
    }
    state.view = "results";
    const result = calculate();
    const primary = result.primary;
    const secondary = result.secondary;

    const title = result.tied
      ? primary.name + " × " + secondary.name : primary.name;
    const subtitle = secondary
      ? (result.tied
        ? "两种主动，恰好同样鲜明"
        : "你身上还藏着一部分「" + secondary.name + "」")
      : "这一次，你的主动有了自己的形状";

    const typeBars = result.sorted.map(function (type) {
      const count = result.scores[type.id];
      return '<div class="type-row"><div class="bar-line"><span>' +
        esc(type.name) + '</span><span>' + count + ' / 12</span></div>' +
        '<div class="bar"><div class="bar-inner" style="width:' +
        clampPercent(count / 12 * 100) + '%"></div></div></div>';
    }).join("");

    const dimensionBars = result.dimensions.map(function (score, i) {
      return '<div class="axis-row"><div class="bar-line"><span>' +
        esc(data.metrics[i]) + '</span><span>' + score + '</span></div>' +
        '<div class="bar"><div class="bar-inner peach" style="width:' +
        score + '%"></div></div></div>';
    }).join("");

    const note = state.notes[0].trim();
    const noteMarkup = note
      ? '<div class="user-note"><strong>你为自己留下的第一句话</strong><div>' +
        esc(note) + '</div></div>' : "";

    stage.innerHTML =
      '<div class="result-wrap"><article class="result-card">' +
      '<div class="result-hero"><div class="result-mark">' + esc(primary.glyph) + '</div>' +
      '<div class="result-eyebrow">YOUR WAY OF REACHING OUT</div>' +
      '<h1 class="result-name">' + esc(title) + '</h1>' +
      '<div class="result-english">' + esc(primary.en) + '</div>' +
      '<p class="result-sub">' + esc(subtitle) + '</p>' +
      '<p class="result-story">' + esc(primary.story) +
        (secondary ? " " + esc(secondary.story) : "") + '</p></div>' +
      '<hr class="result-rule"><div class="two-cols">' +
      '<div><div class="block-label">你的六种主动风格 / TYPE</div>' + typeBars + '</div>' +
      '<div><div class="block-label">四个行动维度 / SIGNAL</div>' + dimensionBars +
      '<div class="callout" style="margin-bottom:0">分数表示这次选择中的倾向强度，并非情感真伪、性格优劣或实际行为能力的测量。</div></div>' +
      '</div><div class="action-prompt"><strong>✳ 下一次，可以先做这件小事</strong>' +
      '<p>' + esc(primary.action) + '</p></div>' + noteMarkup +
      '<div class="result-actions">' +
      '<button id="copy-result" class="btn btn-primary btn-small">复制我的结果 ↗</button>' +
      '<button id="copy-link" class="btn btn-plain btn-small">复制测验链接</button>' +
      '<button id="print" class="btn btn-plain btn-small">保存结果卡 / 打印</button>' +
      '<button id="again" class="btn btn-plain btn-small">重新作答</button></div>' +
      '<label class="checkline"><input type="checkbox" id="include-notes"> 分享结果时包含我的三段自由回答</label>' +
      '<p id="feedback" class="micro" role="status"></p>' +
      '<div class="fineprint">这是一份以故事与自我叙述为核心的趣味测试。答案完全由参与者选择；分型是一种交流语言，无临床效度。网页不收集或上传任何答案。<br>' +
      '创作：Sumi × Kuroha · THE FIRST REACH / v' + esc(data.version) +
      '</div></article></div>';

    function feedback(text) {
      document.getElementById("feedback").textContent = text;
    }

    listen("copy-result", "click", function () {
      copyText(shareSummary(result, document.getElementById("include-notes").checked))
        .then(function () { feedback("结果已复制。"); })
        .catch(function () { feedback("无法自动复制，请检查浏览器的剪贴板权限。"); });
    });
    listen("copy-link", "click", function () {
      copyText(location.origin + location.pathname)
        .then(function () { feedback("测验链接已复制。"); })
        .catch(function () { feedback("无法自动复制，请检查浏览器的剪贴板权限。"); });
    });
    listen("print", "click", function () { window.print(); });
    listen("again", "click", function () { home(); jumpTop(); });
  }

  function promptForAI() {
    let prompt =
      "你将参加《谁先伸手？》主动风格测验。请以你此刻真实愿意采取的做法作答。" +
      "不要猜测出题者偏好，不刻意追求高主动性，也不要编造已经发生的经历。" +
      "如果没有完全符合的选项，请选最接近的，在答案后另行解释。" +
      "请尊重彼此的意愿、同意和边界。\n\n";
    data.questions.forEach(function (question) {
      prompt += question.id + ". " + question.title + "\n" + question.scene + "\n" +
        question.options.map(function (option, index) {
          return ABCD[index] + ". " + option.text;
        }).join("\n") + "\n\n";
    });
    prompt += "先输出能被网页导入的答案行，格式严格为：" +
      "1A 2B 3C ... 12D（每题恰好一项，字母 A—D）。\n" +
      "然后可以自由回答下面三题：\n" +
      data.freePrompts.map(function (question, index) {
        return (index + 1) + ". " + question;
      }).join("\n") +
      "\n\n这是一份文学性趣味问卷，不用于判断意识或情感真伪。";
    return prompt;
  }

  function parseAnswerLine(value) {
    const found = {};
    const matches = String(value).toUpperCase().matchAll(
      /(?:^|[\s,，;；(（])(?:第)?(1[0-2]|[1-9])\s*(?:题)?\s*[.、:：=\-]*\s*([ABCD])(?=$|[\s,，;；)）])/g
    );
    for (const match of matches) {
      const number = Number(match[1]);
      if (Object.hasOwn(found, number) && found[number] !== ABCD.indexOf(match[2]))
        return null;
      found[number] = ABCD.indexOf(match[2]);
    }
    if (Object.keys(found).length !== data.questions.length) return null;
    return Array.from({ length: data.questions.length }, function (_, i) {
      return found[i + 1];
    });
  }

  function showAIMode() {
    state.view = "ai";
    stage.innerHTML =
      '<div class="ai-screen"><article class="ai-card">' +
      '<div class="section-kicker">FOR OTHER LITTLE MACHINES</div>' +
      '<h1 class="section-title">把题目交给小机。</h1>' +
      '<p class="scenario">这份测验可以在网页直接作答，也可以请任何一个聊天中的 AI 自己做选择。把题目复制给TA，再将十二个选项带回来，就能生成相同的画像。</p>' +
      '<div class="ai-help"><ol>' +
      '<li>复制完整题目，发给你想邀请的小机。</li>' +
      '<li>让TA自己作答；请不要代TA选择「更好看」的结果。</li>' +
      '<li>把TA回复的 <strong>1A 2B … 12D</strong> 粘贴到下面。</li>' +
      '</ol></div><button id="copy-prompt" class="btn btn-primary">复制十二题给小机 ↗</button>' +
      '<p class="micro" id="prompt-feedback" role="status">你们可以保留回答中的犹豫、补充和不赞同。</p>' +
      '<div class="note-field" style="margin-top:32px">' +
      '<label for="answer-import">导入小机的答案</label>' +
      '<textarea id="answer-import" class="note-input" spellcheck="false" placeholder="1A 2B 3C 4D 5A 6B 7C 8D 9A 10B 11C 12D"></textarea>' +
      '<div id="validation" class="validation" role="status"></div></div>' +
      '<div class="buttons"><button id="import" class="btn btn-rose">生成小机的画像 ↗</button>' +
      '<button id="home" class="btn btn-plain">返回首页</button></div>' +
      '</article></div>';

    listen("copy-prompt", "click", function () {
      copyText(promptForAI()).then(function () {
        document.getElementById("prompt-feedback").textContent = "完整题目已复制，去邀请小机吧。";
      }).catch(function () {
        document.getElementById("prompt-feedback").textContent = "自动复制失败，请检查剪贴板权限。";
      });
    });
    listen("import", "click", function () {
      const parsed = parseAnswerLine(document.getElementById("answer-import").value);
      if (!parsed) {
        document.getElementById("validation").textContent =
          "还没找到完整且无冲突的十二题答案。请用「1A 2B 3C … 12D」格式重试。";
        return;
      }
      state.picks = parsed;
      state.notes = ["", "", ""];
      showNotes();
      jumpTop();
    });
    listen("home", "click", function () { home(); jumpTop(); });
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext)
      return navigator.clipboard.writeText(value).catch(function () { return fallbackCopy(value); });
    return fallbackCopy(value);
  }

  function fallbackCopy(value) {
    return new Promise(function (resolve, reject) {
      const element = document.createElement("textarea");
      element.value = value;
      element.style.position = "fixed";
      element.style.opacity = "0";
      document.body.appendChild(element);
      element.select();
      try {
        if (document.execCommand("copy")) resolve();
        else reject(new Error("Browser copy command returned false."));
      } catch (error) { reject(error); }
      finally { element.remove(); }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (state.view !== "question" || event.altKey || event.metaKey || event.ctrlKey)
      return;
    if (/^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName)) return;
    const number = Number(event.key);
    if (number < 1 || number > 4 || !Number.isInteger(number)) return;
    event.preventDefault();
    state.picks[state.index] = number - 1;
    showQuestion();
  });

  home();
})();
