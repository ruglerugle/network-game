"use strict";

/* =========================================================
   状態管理
========================================================= */
const state = {
  stageIndex: -1,
  maxReached: 0,
  completed: new Set(),
  score: 0
};

const gameArea = document.getElementById("game-area");
const stageIndicator = document.getElementById("stage-indicator");
const scoreIndicator = document.getElementById("score-indicator");
const backBtn = document.getElementById("back-btn");
const navToggleBtn = document.getElementById("nav-toggle-btn");
const sideToggleBtn = document.getElementById("side-toggle-btn");
const stepList = document.getElementById("step-list");
const appEl = document.getElementById("app");
const sideBackdrop = document.getElementById("side-backdrop");

function addScore(points) {
  state.score += points;
  scoreIndicator.textContent = state.score;
}

function updateHud() {
  const total = STAGES.length;
  const current = Math.min(Math.max(state.stageIndex, 0) + 1, total);
  stageIndicator.textContent = `ステージ ${current} / ${total}`;
  backBtn.disabled = state.stageIndex <= 0;
}

function toggleSidebar() {
  appEl.classList.toggle("side-collapsed");
}
navToggleBtn.onclick = toggleSidebar;
sideToggleBtn.onclick = toggleSidebar;
sideBackdrop.onclick = toggleSidebar;

backBtn.onclick = () => {
  if (state.stageIndex > 0) {
    startStage(state.stageIndex - 1);
  }
};

function renderSideNav() {
  stepList.innerHTML = STAGES.map((stage, i) => {
    const reached = i <= state.maxReached;
    const isActive = i === state.stageIndex;
    const isDone = state.completed.has(i);
    const classes = ["side-step"];
    if (isActive) classes.push("active");
    if (isDone) classes.push("done");
    if (!reached) classes.push("locked");
    const statusIcon = isDone ? '<span class="check">✔</span>' : !reached ? '<span class="lock">🔒</span>' : "";
    return `<div class="${classes.join(" ")}" data-index="${i}">
      <span class="paw">${stage.icon}</span>
      <div>
        <div class="step-main">ステージ${i + 1}</div>
        <div class="step-sub">${stage.title}</div>
      </div>
      <div>${statusIcon}</div>
    </div>`;
  }).join("");

  stepList.querySelectorAll(".side-step").forEach((el) => {
    const i = Number(el.dataset.index);
    if (i <= state.maxReached) {
      el.addEventListener("click", () => startStage(i));
    }
  });
}

/* =========================================================
   解説モーダル
========================================================= */
const explainModal = document.getElementById("explain-modal");
const explainTitle = document.getElementById("explain-title");
const explainBody = document.getElementById("explain-body");
const explainNextBtn = document.getElementById("explain-next-btn");

function showExplain(title, bodyHtml, onNext) {
  explainTitle.textContent = title;
  explainBody.innerHTML = bodyHtml;
  explainModal.classList.remove("hidden");
  explainNextBtn.onclick = () => {
    explainModal.classList.add("hidden");
    onNext();
  };
}

/* =========================================================
   ステージ進行
========================================================= */
function startStage(index) {
  state.stageIndex = index;
  state.maxReached = Math.max(state.maxReached, index);
  updateHud();
  renderSideNav();
  window.scrollTo(0, 0);
  gameArea.innerHTML = "";
  const stage = STAGES[index];
  const header = document.createElement("div");
  header.className = "stage-header";
  header.innerHTML = `<h2>ステージ${index + 1}: ${stage.title}</h2>${stage.layer ? `<span class="layer-badge">${stage.layer}</span>` : ""}<p class="stage-sub">${stage.sub}</p>`;
  gameArea.appendChild(header);

  if (stage.dialogue) {
    const dialogScene = document.createElement("div");
    dialogScene.className = "dialog-scene";
    dialogScene.innerHTML = renderDialogue(stage.dialogue);
    gameArea.appendChild(dialogScene);
  }

  const body = document.createElement("div");
  gameArea.appendChild(body);

  stage.render(body, () => {
    showExplain(stage.explainTitle, stage.explainBody, () => {
      state.completed.add(index);
      renderSideNav();
      const next = index + 1;
      if (next >= STAGES.length) {
        finishGame();
      } else {
        startStage(next);
      }
    });
  });
}

function finishGame() {
  state.stageIndex = STAGES.length;
  updateHud();
  renderSideNav();
  window.scrollTo(0, 0);
  gameArea.innerHTML = "";
  document.getElementById("end-score").textContent = `最終スコア: ${state.score} 点`;
  document.getElementById("end-summary").innerHTML = `
    <div class="dialog-scene">${renderDialogue(CLEAR_DIALOGUE)}</div>
    <ul class="explain-list">
      <li><b>OSI参照モデル</b>：通信を7つの階層（L1〜L7）に分けて役割分担する考え方</li>
      <li><b>DNS（L7）</b>：ドメイン名をIPアドレスに変換する「電話帳」の役割</li>
      <li><b>ルーティング（L3）</b>：宛先IPのサブネットを見て次の転送先を決める仕組み</li>
      <li><b>TCP 3ウェイハンドシェイク（L4）</b>：SYN → SYN/ACK → ACK で接続を確立</li>
      <li><b>ポート番号（L4）</b>：同じIPでもアプリごとに異なる「窓口」で通信を受け付ける</li>
      <li><b>パケットロス＆再送（L4）</b>：届かなかったデータはタイムアウト後に再送される</li>
      <li><b>ファイアウォール（L3〜L4）</b>：プロトコルとポート番号のルールで通信を許可／拒否する</li>
    </ul>`;
  document.getElementById("end-modal").classList.remove("hidden");
}

/* =========================================================
   共通ユーティリティ
========================================================= */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ipToInt(ip) {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function matchesCidr(ip, cidr) {
  const [base, bits] = cidr.split("/");
  const mask = bits === "0" ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(base) & mask);
}

function renderDialogue(dialogue) {
  return dialogue
    .map((d) => {
      const isRabbit = d.who === "rabbit";
      return `<div class="dialog-row${isRabbit ? " right" : ""}">
        <div class="dialog-character">
          <img src="images/${d.img}.png" alt="${isRabbit ? "うさ美" : "ねこ先生"}">
          <div class="dialog-name ${d.who}">${isRabbit ? "うさ美" : "ねこ先生"}</div>
        </div>
        <div class="dialog-bubble">${d.text}</div>
      </div>`;
    })
    .join("");
}

function appendNextButton(parent, onClick) {
  const wrap = document.createElement("div");
  wrap.style.textAlign = "center";
  wrap.style.marginTop = "14px";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn primary";
  btn.textContent = "次へ";
  btn.onclick = onClick;
  wrap.appendChild(btn);
  parent.appendChild(wrap);
}

/* =========================================================
   ステージ1: OSI参照モデル
========================================================= */
const OSI_LAYERS = [
  { num: 7, name: "アプリケーション層", example: "HTTP・DNS・メールなど、アプリが使う通信規約" },
  { num: 6, name: "プレゼンテーション層", example: "文字コードの変換、暗号化・圧縮の形式を揃える" },
  { num: 5, name: "セッション層", example: "通信の開始から終了までのやり取り（セッション）を管理" },
  { num: 4, name: "トランスポート層", example: "TCP/UDP、ポート番号で通信の信頼性・区別を担当" },
  { num: 3, name: "ネットワーク層", example: "IPアドレスを見て、ルーターが宛先までの転送経路を決める" },
  { num: 2, name: "データリンク層", example: "MACアドレスを使い、同じネットワーク内でデータを届ける" },
  { num: 1, name: "物理層", example: "LANケーブルの電気信号やWi-Fiの電波そのもの" }
];

const OSI_QUIZ = [
  { clue: "Webブラウザが<b>HTTP</b>でページをリクエストする", correctNum: 7 },
  { clue: "ルーターが<b>IPアドレス</b>を見て転送先を決める", correctNum: 3 },
  { clue: "<b>TCP/UDPのポート番号</b>でどのアプリ宛てかを区別する", correctNum: 4 },
  { clue: "LANケーブルや<b>Wi-Fiの電波信号</b>そのもの", correctNum: 1 },
  { clue: "同じネットワーク内で<b>MACアドレス</b>宛てにデータを届ける", correctNum: 2 },
  { clue: "送受信する文字コードや<b>暗号化・圧縮</b>の形式を揃える", correctNum: 6 },
  { clue: "通信の開始から終了までの<b>セッション</b>を管理する", correctNum: 5 }
];

function buildOsiDiagram() {
  const rows = OSI_LAYERS.map((l) => `
    <div class="osi-layer">
      <span class="osi-num">L${l.num}</span>
      <div class="osi-info">
        <div class="osi-name">${l.name}</div>
        <div class="osi-example">${l.example}</div>
      </div>
    </div>`).join("");
  return `<div class="osi-stack">${rows}</div>`;
}

function renderOsiStage(container, onComplete) {
  const diagramPanel = document.createElement("div");
  diagramPanel.className = "panel";
  diagramPanel.innerHTML = `<p>まずは全体像を確認しよう。通信は<b>7つの階層（レイヤー）</b>に分かれていて、上の層ほど人間に近く、下の層ほど物理的な信号に近い。</p>${buildOsiDiagram()}`;
  container.appendChild(diagramPanel);

  const quizHost = document.createElement("div");
  container.appendChild(quizHost);

  let round = 0;

  function renderRound() {
    quizHost.innerHTML = "";
    const q = OSI_QUIZ[round];
    const correctLayer = OSI_LAYERS.find((l) => l.num === q.correctNum);
    const distractors = shuffle(OSI_LAYERS.filter((l) => l.num !== q.correctNum)).slice(0, 3);
    const options = shuffle([correctLayer, ...distractors]);

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <p>次の内容は、どの層の役割？</p>
      <div class="scenario-box">${q.clue}</div>
      <div class="card-row" id="osi-choices"></div>
      <div class="feedback" id="osi-feedback"></div>
    `;
    quizHost.appendChild(panel);

    const choicesEl = panel.querySelector("#osi-choices");
    const feedback = panel.querySelector("#osi-feedback");
    let answered = false;

    options.forEach((layer) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = `L${layer.num} ${layer.name}`;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        if (layer.num === q.correctNum) {
          btn.classList.add("correct");
          feedback.textContent = `正解！ L${correctLayer.num} ${correctLayer.name}の役割です。`;
          feedback.className = "feedback ok";
          addScore(10);
        } else {
          btn.classList.add("wrong");
          feedback.textContent = `不正解。正しくは L${correctLayer.num} ${correctLayer.name} でした。`;
          feedback.className = "feedback ng";
          [...choicesEl.children].forEach((c) => (c.disabled = true));
          const correctBtn = [...choicesEl.children].find((c) => c.textContent.startsWith(`L${correctLayer.num}`));
          if (correctBtn) correctBtn.classList.add("correct");
        }
        appendNextButton(panel, advance);
      };
      choicesEl.appendChild(btn);
    });
  }

  function advance() {
    round++;
    if (round >= OSI_QUIZ.length) {
      onComplete();
    } else {
      renderRound();
    }
  }

  renderRound();
}

/* =========================================================
   ステージ2: DNS解決
========================================================= */
const DNS_ROUNDS = [
  { type: "lookup", domain: "www.example.com", ip: "93.184.216.34" },
  { type: "cache", domain: "www.example.com", ip: "93.184.216.34" },
  { type: "lookup", domain: "shop.example.net", ip: "198.51.100.7" }
];

function renderDnsStage(container, onComplete) {
  let round = 0;

  function renderRound() {
    container.innerHTML = "";
    const r = DNS_ROUNDS[round];
    if (r.type === "cache") {
      renderCacheRound(r);
    } else {
      renderLookupRound(r);
    }
  }

  function renderLookupRound(r) {
    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <div class="topology">
        <div class="node"><span class="node-icon">🖥️</span>クライアント</div>
        <span class="arrow">→</span>
        <div class="node" id="dns-server-node"><span class="node-icon">📖</span>DNSサーバー</div>
        <span class="arrow">→</span>
        <div class="node target"><span class="node-icon">🌐</span>${r.domain}</div>
      </div>
      <p>「<b>${r.domain}</b>」にアクセスしたい。まだIPアドレスが分からないので、DNSサーバーに問い合わせてみよう。</p>
      <div style="text-align:center;">
        <button type="button" class="btn primary" id="dns-query-btn">DNSサーバーに問い合わせる</button>
      </div>
      <div class="feedback" id="dns-feedback" style="text-align:center;"></div>
      <div style="text-align:center;" id="dns-next-wrap"></div>
    `;
    container.appendChild(panel);

    const queryBtn = panel.querySelector("#dns-query-btn");
    const feedback = panel.querySelector("#dns-feedback");
    const serverNode = panel.querySelector("#dns-server-node");
    const nextWrap = panel.querySelector("#dns-next-wrap");

    queryBtn.onclick = () => {
      queryBtn.disabled = true;
      serverNode.classList.add("active");
      feedback.textContent = "問い合わせ中…";
      feedback.className = "feedback";
      setTimeout(() => {
        feedback.innerHTML = `DNSサーバーが回答: <b>${r.domain}</b> のIPアドレスは <b style="color:var(--accent)">${r.ip}</b> です。`;
        feedback.className = "feedback ok";
        addScore(10);
        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "btn primary";
        nextBtn.style.marginTop = "14px";
        nextBtn.textContent = "次へ";
        nextBtn.onclick = advance;
        nextWrap.appendChild(nextBtn);
      }, 700);
    };
  }

  function renderCacheRound(r) {
    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <div class="scenario-box">少し前に <b>${r.domain}</b>（IP: ${r.ip}）へアクセスしたばかりです。今、もう一度同じサイトにアクセスします。</div>
      <p>ブラウザやOSは、一度調べたドメインの結果を一定時間（TTL）保存しています。今回、実際に起きるのはどちら？</p>
      <div class="card-row" id="cache-choices" style="justify-content:center;"></div>
      <div class="feedback" id="cache-feedback" style="text-align:center;"></div>
    `;
    container.appendChild(panel);

    const choicesEl = panel.querySelector("#cache-choices");
    const feedback = panel.querySelector("#cache-feedback");
    let answered = false;

    const options = shuffle([
      { key: "cache", label: "キャッシュ済みのIPアドレスをそのまま使う（DNSサーバーに問い合わせない）" },
      { key: "query", label: "もう一度DNSサーバーに問い合わせる" }
    ]);

    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = opt.label;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        if (opt.key === "cache") {
          btn.classList.add("correct");
          feedback.textContent = "正解！ TTL（有効期限）が切れるまではキャッシュされたIPアドレスを再利用し、DNSサーバーへの問い合わせを省略します。通信が速くなり、DNSサーバーの負荷も減ります。";
          feedback.className = "feedback ok";
          addScore(10);
        } else {
          btn.classList.add("wrong");
          feedback.textContent = "実際はキャッシュが使われます。TTLが切れるまでは、同じドメインに毎回問い合わせる必要はありません。";
          feedback.className = "feedback ng";
          [...choicesEl.children].forEach((c) => (c.disabled = true));
          const correctBtn = [...choicesEl.children].find((c) => c.textContent.includes("キャッシュ済み"));
          if (correctBtn) correctBtn.classList.add("correct");
        }
        appendNextButton(panel, advance);
      };
      choicesEl.appendChild(btn);
    });
  }

  function advance() {
    round++;
    if (round >= DNS_ROUNDS.length) {
      onComplete();
    } else {
      renderRound();
    }
  }

  renderRound();
}

/* =========================================================
   ステージ3: ルーティング
========================================================= */
const ROUTING_ROUNDS = [
  {
    destIP: "192.168.10.25",
    routers: [
      { id: "ルーターA", cidr: "192.168.10.0/24" },
      { id: "ルーターB", cidr: "192.168.20.0/24" },
      { id: "ルーターC", cidr: "10.0.0.0/8" }
    ]
  },
  {
    destIP: "10.4.55.2",
    routers: [
      { id: "ルーターA", cidr: "192.168.10.0/24" },
      { id: "ルーターB", cidr: "10.0.0.0/8" },
      { id: "ルーターC", cidr: "172.16.0.0/16" }
    ]
  },
  {
    destIP: "172.16.8.200",
    routers: [
      { id: "ルーターA", cidr: "172.16.0.0/16" },
      { id: "ルーターB", cidr: "192.168.0.0/16" },
      { id: "ルーターC", cidr: "10.0.0.0/8" }
    ]
  }
];

function renderRoutingStage(container, onComplete) {
  let round = 0;

  function renderRound() {
    container.innerHTML = "";
    const r = ROUTING_ROUNDS[round];
    const correctRouter = r.routers.find((rt) => matchesCidr(r.destIP, rt.cidr));

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <p>宛先IPアドレス <b>${r.destIP}</b> 宛てのパケットが届いた。担当ネットワーク（サブネット）に合うルーターはどれ？</p>
      <div class="card-row" id="router-choices"></div>
      <div class="feedback" id="routing-feedback"></div>
    `;
    container.appendChild(panel);

    const choicesEl = panel.querySelector("#router-choices");
    const feedback = panel.querySelector("#routing-feedback");
    let answered = false;

    r.routers.forEach((rt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.innerHTML = `📡 <b>${rt.id}</b><br><span style="color:var(--text-dim)">担当: ${rt.cidr}</span>`;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        if (rt.id === correctRouter.id) {
          btn.classList.add("correct");
          feedback.textContent = `正解！ ${r.destIP} は ${rt.cidr} の範囲に含まれるので ${rt.id} へ転送されます。`;
          feedback.className = "feedback ok";
          addScore(10);
        } else {
          btn.classList.add("wrong");
          feedback.textContent = `不正解。${r.destIP} は ${correctRouter.cidr}（${correctRouter.id}）の範囲です。`;
          feedback.className = "feedback ng";
          [...choicesEl.children].forEach((c) => (c.disabled = true));
          const correctBtn = [...choicesEl.children].find((c) => c.innerHTML.includes(correctRouter.id));
          if (correctBtn) correctBtn.classList.add("correct");
        }
        appendNextButton(panel, advance);
      };
      choicesEl.appendChild(btn);
    });
  }

  function advance() {
    round++;
    if (round >= ROUTING_ROUNDS.length) {
      onComplete();
    } else {
      renderRound();
    }
  }

  renderRound();
}

/* =========================================================
   ステージ4: TCP 3ウェイハンドシェイク
========================================================= */
function renderHandshakeStage(container, onComplete) {
  const sequence = [
    { key: "SYN", label: "SYN（接続要求）", from: "client" },
    { key: "SYN-ACK", label: "SYN/ACK（要求の承認＋応答要求）", from: "server" },
    { key: "ACK", label: "ACK（応答の確認・接続確立）", from: "client" }
  ];
  const distractors = [
    { key: "FIN", label: "FIN（切断要求）" },
    { key: "DATA", label: "DATA（データ送信）" }
  ];

  let step = 0;

  container.innerHTML = `
    <div class="panel">
      <p>クライアントとサーバーが接続を確立するには、決まった順番でパケットをやり取りする必要があります（3ウェイハンドシェイク）。正しい順番でボタンを押してください。</p>
      <div class="handshake-lane">
        <div class="actor"><span class="icon">🖥️</span>クライアント</div>
        <div class="timeline" id="hs-timeline"></div>
        <div class="actor"><span class="icon">🗄️</span>サーバー</div>
      </div>
      <div class="option-pool" id="hs-pool"></div>
      <div class="feedback" id="hs-feedback"></div>
    </div>
  `;

  const timeline = container.querySelector("#hs-timeline");
  const pool = container.querySelector("#hs-pool");
  const feedback = container.querySelector("#hs-feedback");

  const pooled = shuffle([...sequence, ...distractors]);
  pooled.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = item.label;
    btn.onclick = () => handleClick(item, btn);
    pool.appendChild(btn);
  });

  function handleClick(item, btn) {
    const expected = sequence[step];
    if (item.key === expected.key) {
      btn.remove();
      const stepEl = document.createElement("div");
      stepEl.className = `timeline-step from-${expected.from}`;
      stepEl.textContent = `${step + 1}. ${expected.label}`;
      timeline.appendChild(stepEl);
      feedback.textContent = "正しい順番です！";
      feedback.className = "feedback ok";
      addScore(10);
      step++;
      if (step >= sequence.length) {
        feedback.textContent = "3ウェイハンドシェイク完了！接続が確立しました。";
        pool.innerHTML = "";
        appendNextButton(container.querySelector(".panel"), onComplete);
      }
    } else {
      feedback.textContent = "順番が違います。今どちらが何を送るタイミングか考えてみましょう。";
      feedback.className = "feedback ng";
    }
  }
}

/* =========================================================
   ステージ5: ポート番号
========================================================= */
const PORT_ROUNDS = [
  { scenario: "暗号化されたWebサイト（HTTPS）を閲覧する", correct: 443, labels: { 80: "HTTP", 443: "HTTPS", 22: "SSH", 25: "SMTP", 53: "DNS" } },
  { scenario: "暗号化なしのWebサイト（HTTP）を閲覧する", correct: 80, labels: { 80: "HTTP", 443: "HTTPS", 22: "SSH", 25: "SMTP", 53: "DNS" } },
  { scenario: "メールサーバーへメールを送信する（SMTP）", correct: 25, labels: { 80: "HTTP", 443: "HTTPS", 22: "SSH", 25: "SMTP", 53: "DNS" } },
  { scenario: "ドメイン名をIPアドレスに変換してもらう（DNS）", correct: 53, labels: { 80: "HTTP", 443: "HTTPS", 22: "SSH", 25: "SMTP", 53: "DNS" } },
  { scenario: "リモートのサーバーに安全にログインする（SSH）", correct: 22, labels: { 80: "HTTP", 443: "HTTPS", 22: "SSH", 25: "SMTP", 53: "DNS" } }
];

function renderPortStage(container, onComplete) {
  let round = 0;

  function renderRound() {
    container.innerHTML = "";
    const r = PORT_ROUNDS[round];
    const ports = shuffle(Object.keys(r.labels).map(Number));

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <div class="scenario-box">やりたいこと: <b>${r.scenario}</b></div>
      <p>パケットを正しいポート番号の「窓口」に届けてください。</p>
      <div class="door-row" id="port-doors"></div>
      <div class="feedback" id="port-feedback"></div>
    `;
    container.appendChild(panel);

    const doorsEl = panel.querySelector("#port-doors");
    const feedback = panel.querySelector("#port-feedback");
    let answered = false;

    ports.forEach((p) => {
      const door = document.createElement("div");
      door.className = "door";
      door.innerHTML = `<span class="port-num">${p}</span><span class="port-label">${r.labels[p]}</span>`;
      door.onclick = () => {
        if (answered) return;
        answered = true;
        if (p === r.correct) {
          door.classList.add("correct");
          feedback.textContent = `正解！ ポート${p}（${r.labels[p]}）宛てに届けられました。`;
          feedback.className = "feedback ok";
          addScore(10);
        } else {
          door.classList.add("wrong");
          feedback.textContent = `不正解。正しくはポート${r.correct}（${r.labels[r.correct]}）です。`;
          feedback.className = "feedback ng";
          [...doorsEl.children].forEach((d) => (d.style.pointerEvents = "none"));
          const correctDoor = [...doorsEl.children].find((d) => d.querySelector(".port-num").textContent == r.correct);
          if (correctDoor) correctDoor.classList.add("correct");
        }
        appendNextButton(panel, advance);
      };
      doorsEl.appendChild(door);
    });
  }

  function advance() {
    round++;
    if (round >= PORT_ROUNDS.length) {
      onComplete();
    } else {
      renderRound();
    }
  }

  renderRound();
}

/* =========================================================
   ステージ6: パケットロス＆再送（キャンバスゲーム）
========================================================= */
function renderLossStage(container, onComplete) {
  container.innerHTML = `
    <div class="panel">
      <p>データは途中で失われる（パケットロス）ことがあります。その場合、送信側はタイムアウトを検出して<b>再送</b>します。障害物（ロスゾーン）を避けて、パケットをサーバーまで届けましょう。</p>
      <canvas id="loss-canvas" width="720" height="300"></canvas>
      <div class="loss-stats">
        <span>進捗: <b id="loss-progress">0%</b></span>
        <span>再送回数: <b id="loss-retrans">0</b></span>
      </div>
      <div class="card-row" style="justify-content:center; margin-top:12px;">
        <button type="button" class="choice-btn" id="lane-up">▲ 上のレーンへ</button>
        <button type="button" class="choice-btn" id="lane-down">▼ 下のレーンへ</button>
      </div>
      <div class="feedback" id="loss-feedback"></div>
    </div>
  `;

  const canvas = container.querySelector("#loss-canvas");
  const ctx = canvas.getContext("2d");
  const progressLabel = container.querySelector("#loss-progress");
  const retransLabel = container.querySelector("#loss-retrans");
  const feedback = container.querySelector("#loss-feedback");

  const lanes = [60, 150, 240];
  let laneIndex = 1;
  let packetX = 70;
  let progress = 0;
  let retransCount = 0;
  let obstacles = [];
  let lastSpawn = 0;
  let invincibleUntil = 0;
  let running = true;
  let lastTime = null;

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
  }
  resizeCanvas();

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    obstacles.push({ x: canvas.width, lane, width: 26, height: 40 });
  }

  function onKey(e) {
    if (e.key === "ArrowUp") laneIndex = Math.max(0, laneIndex - 1);
    if (e.key === "ArrowDown") laneIndex = Math.min(2, laneIndex + 1);
  }
  document.addEventListener("keydown", onKey);
  container.querySelector("#lane-up").onclick = () => (laneIndex = Math.max(0, laneIndex - 1));
  container.querySelector("#lane-down").onclick = () => (laneIndex = Math.min(2, laneIndex + 1));

  function loop(ts) {
    if (!running) return;
    if (lastTime === null) lastTime = ts;
    const dt = Math.min(50, ts - lastTime) / 1000;
    lastTime = ts;

    if (ts - lastSpawn > 1100) {
      spawnObstacle();
      lastSpawn = ts;
    }

    const speed = 190;
    obstacles.forEach((o) => (o.x -= speed * dt));
    obstacles = obstacles.filter((o) => o.x + o.width > 0);

    if (progress < 100) {
      progress += dt * 9;
    }

    const now = ts;
    if (now > invincibleUntil) {
      for (const o of obstacles) {
        if (o.lane === laneIndex && packetX + 14 > o.x && packetX - 14 < o.x + o.width) {
          retransCount++;
          progress = Math.max(0, progress - 12);
          invincibleUntil = now + 900;
          feedback.textContent = "パケットロス発生！タイムアウトを検出し、再送します。";
          feedback.className = "feedback ng";
          break;
        }
      }
    }

    progressLabel.textContent = `${Math.min(100, Math.floor(progress))}%`;
    retransLabel.textContent = String(retransCount);

    draw(ts);

    if (progress >= 100) {
      running = false;
      feedback.textContent = "サーバーまでパケットが届きました！";
      feedback.className = "feedback ok";
      document.removeEventListener("keydown", onKey);
      addScore(Math.max(10, 40 - retransCount * 5));
      appendNextButton(container.querySelector(".panel"), onComplete);
      return;
    }

    requestAnimationFrame(loop);
  }

  function draw(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#2a3a5a";
    lanes.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y + 20);
      ctx.lineTo(canvas.width, y + 20);
      ctx.stroke();
    });

    ctx.fillStyle = "#93a2bd";
    ctx.font = "12px sans-serif";
    ctx.fillText("クライアント", 10, 20);
    ctx.fillText("サーバー", canvas.width - 60, 20);
    ctx.fillText("🗄", canvas.width - 34, 250);

    const blinking = ts < invincibleUntil && Math.floor(ts / 100) % 2 === 0;
    if (!blinking) {
      ctx.fillStyle = "#4fd1c5";
      ctx.beginPath();
      ctx.arc(packetX, lanes[laneIndex], 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#06231f";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("P", packetX, lanes[laneIndex] + 4);
      ctx.textAlign = "left";
    }

    ctx.fillStyle = "#ef5b5b";
    obstacles.forEach((o) => {
      ctx.fillRect(o.x, lanes[o.lane] - o.height / 2, o.width, o.height);
    });
  }

  requestAnimationFrame(loop);
}

/* =========================================================
   ステージ7: ファイアウォール
========================================================= */
const ALLOW_RULES = [
  { proto: "TCP", port: 80 },
  { proto: "TCP", port: 443 },
  { proto: "UDP", port: 53 }
];

const FIREWALL_PACKETS = [
  { proto: "TCP", port: 443, desc: "HTTPS通信（暗号化されたWeb閲覧）" },
  { proto: "TCP", port: 23, desc: "Telnet接続（暗号化されないリモート操作）" },
  { proto: "UDP", port: 53, desc: "DNS問い合わせ" },
  { proto: "TCP", port: 3389, desc: "リモートデスクトップ接続" },
  { proto: "TCP", port: 80, desc: "HTTP通信（暗号化なしWeb閲覧）" },
  { proto: "UDP", port: 69, desc: "TFTPファイル転送" }
];

function isAllowed(pkt) {
  return ALLOW_RULES.some((r) => r.proto === pkt.proto && r.port === pkt.port);
}

function renderFirewallStage(container, onComplete) {
  let round = 0;

  const ruleTableHtml = `
    <table class="rule-table">
      <thead><tr><th>プロトコル</th><th>ポート</th><th>動作</th></tr></thead>
      <tbody>
        <tr><td>TCP</td><td>80</td><td class="allow">許可</td></tr>
        <tr><td>TCP</td><td>443</td><td class="allow">許可</td></tr>
        <tr><td>UDP</td><td>53</td><td class="allow">許可</td></tr>
        <tr><td>その他すべて</td><td>-</td><td class="deny">拒否</td></tr>
      </tbody>
    </table>
  `;

  function renderRound() {
    container.innerHTML = "";
    const pkt = FIREWALL_PACKETS[round];
    const allowed = isAllowed(pkt);

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <p>以下のファイアウォールルールに従って、届いた通信を<b>許可</b>するか<b>拒否</b>するか判定してください。</p>
      ${ruleTableHtml}
      <div class="packet-card">
        <div class="pc-line">プロトコル: <b>${pkt.proto}</b></div>
        <div class="pc-line">ポート番号: <b>${pkt.port}</b></div>
        <div class="pc-line" style="color:var(--text-dim)">${pkt.desc}</div>
      </div>
      <div class="decision-row">
        <button type="button" class="decision-btn allow-btn" id="fw-allow">✅ 許可</button>
        <button type="button" class="decision-btn deny-btn" id="fw-deny">🚫 拒否</button>
      </div>
      <div class="feedback" id="fw-feedback" style="text-align:center;"></div>
    `;
    container.appendChild(panel);

    const feedback = panel.querySelector("#fw-feedback");
    const allowBtn = panel.querySelector("#fw-allow");
    const denyBtn = panel.querySelector("#fw-deny");

    function judge(choseAllow) {
      allowBtn.disabled = true;
      denyBtn.disabled = true;
      const correct = choseAllow === allowed;
      if (correct) {
        feedback.textContent = `正解！ この通信はルール上「${allowed ? "許可" : "拒否"}」されます。`;
        feedback.className = "feedback ok";
        addScore(10);
      } else {
        feedback.textContent = `不正解。ルール上、この通信は「${allowed ? "許可" : "拒否"}」されるべきでした。`;
        feedback.className = "feedback ng";
      }
      appendNextButton(panel, advance);
    }

    allowBtn.onclick = () => judge(true);
    denyBtn.onclick = () => judge(false);
  }

  function advance() {
    round++;
    if (round >= FIREWALL_PACKETS.length) {
      onComplete();
    } else {
      renderRound();
    }
  }

  renderRound();
}

/* =========================================================
   キャラクター会話（ねこ先生 / うさ美）
========================================================= */
const CLEAR_DIALOGUE = [
  { who: "cat", img: "cat", text: "お疲れさま！これで、1つのデータがクライアントからサーバーまで届く流れを、一通り体験したことになるよ。" },
  { who: "rabbit", img: "rabbitThink", text: "DNSで住所を調べて、ルーターをリレーして、あいさつ（ハンドシェイク）して、正しい窓口（ポート）に届けて……途中で消えても再送されて、最後は門番（ファイアウォール）がチェックする。全部つながりました！" },
  { who: "cat", img: "catThink", text: "普段何気なく見ているWebページの裏側では、これだけの仕組みが動いているんだ。お疲れさま！" }
];

/* =========================================================
   ステージ定義
========================================================= */
const STAGES = [
  {
    title: "OSI参照モデル",
    icon: "🧅",
    layer: "全7層",
    sub: "通信を7つの階層に分けて理解しよう",
    render: renderOsiStage,
    dialogue: [
      { who: "cat", img: "cat", text: "本編に入る前に、通信の全体像を押さえておこう。ネットワークの通信は、<strong>OSI参照モデル</strong>という7つの階層（レイヤー）に分けて考えるのが基本なんだ。" },
      { who: "rabbit", img: "rabbit", text: "7つも!? いきなり複雑そうです……。" },
      { who: "cat", img: "catThink", text: "難しく見えるけど、要は「役割ごとに仕事を分担している」だけなんだ。一番下が電気信号などの物理的なやり取り、一番上が私たちが使うアプリの通信、という積み木のような構造だよ。" },
      { who: "rabbit", img: "rabbitThink", text: "この後の DNS やルーティング、TCP の話も、この階層のどこかに当てはまるんですね？" },
      { who: "cat", img: "cat", text: "その通り！各ステージのタイトル横に「第何層の話か」を表示していくから、今どこを学んでいるか意識しながら進めよう。" }
    ],
    explainTitle: "OSI参照モデルは「階層分担」",
    explainBody: `
      <p>実際の通信は、役割の異なる<b>7つの階層</b>に分けて考えることができます。これを<b>OSI参照モデル</b>と呼びます。上位層は下位層の機能を利用しながら、それぞれ決められた役割だけに集中することで、複雑な通信の仕組み全体を整理しています。</p>
      <table class="rule-table">
        <thead><tr><th>層</th><th>名称</th><th>役割の例</th></tr></thead>
        <tbody>
          <tr><td>L7</td><td>アプリケーション層</td><td>HTTP・DNS・メールなど、アプリの通信規約</td></tr>
          <tr><td>L6</td><td>プレゼンテーション層</td><td>文字コード変換、暗号化・圧縮の形式を揃える</td></tr>
          <tr><td>L5</td><td>セッション層</td><td>通信の開始〜終了までのやり取りを管理</td></tr>
          <tr><td>L4</td><td>トランスポート層</td><td>TCP/UDP、ポート番号、通信の信頼性</td></tr>
          <tr><td>L3</td><td>ネットワーク層</td><td>IPアドレス、ルーティング</td></tr>
          <tr><td>L2</td><td>データリンク層</td><td>MACアドレス、同一ネットワーク内の転送</td></tr>
          <tr><td>L1</td><td>物理層</td><td>ケーブルの電気信号・Wi-Fiの電波</td></tr>
        </tbody>
      </table>
      <p>実務では、これをさらに簡略化した<b>TCP/IPモデル（4階層：アプリケーション層／トランスポート層／インターネット層／ネットワークインターフェース層）</b>もよく使われます。呼び方が違っても、考え方は同じです。この後のステージでも、それぞれの内容がOSIの何層に対応するかを見出しの横に表示していきます。</p>
    `
  },
  {
    title: "DNS解決",
    icon: "📖",
    layer: "L7 アプリケーション層",
    sub: "ドメイン名からIPアドレスを調べよう",
    render: renderDnsStage,
    dialogue: [
      { who: "cat", img: "cat", text: "ようこそ、パケット大冒険へ！まずは「ドメイン名からIPアドレスを調べる」ところから始めよう。" },
      { who: "rabbit", img: "rabbit", text: "ドメイン名……www.example.comみたいなやつですよね？でも、それがどうやってIPアドレスになるんですか？" },
      { who: "cat", img: "catThink", text: "いい質問！コンピューター同士は住所（IPアドレス）でしか通信できないんだ。だから「ドメイン名→IPアドレス」の対応表を持っている<strong>DNSサーバー</strong>に、まず聞きにいく必要があるんだよ。" },
      { who: "rabbit", img: "rabbitThink", text: "普段パソコンで<strong>nslookup</strong>や<strong>dig</strong>というコマンドを打つと、それが見られるんですよね？" },
      { who: "cat", img: "cat", text: "そうそう！ブラウザも裏側で必ず同じことをしているんだ。このステージでは「問い合わせる」ボタンを押して、実際にDNSサーバーから答えが返ってくる様子を見てみよう。" }
    ],
    explainTitle: "DNSは「電話帳」",
    explainBody: `
      <p>私たちが普段入力する「www.example.com」のようなドメイン名は、コンピューターにとっては直接の宛先になりません。通信には<b>IPアドレス</b>が必要です。<b>DNS（Domain Name System）</b>は、ドメイン名を対応するIPアドレスに変換してくれる仕組みで、よく「インターネットの電話帳」と例えられます。OSI参照モデルでは、アプリケーションが使うプロトコルなので<b>L7 アプリケーション層</b>に分類されます。</p>
      <p>実際には多くの場合、あなたのPCは直接ドメインの管理元（権威DNSサーバー）に聞きに行くのではなく、まず<b>キャッシュDNSサーバー（フルサービスリゾルバ）</b>に問い合わせます。そのサーバーが答えを知らなければ、<b>ルートサーバー→TLD（.comなどの）サーバー→権威サーバー</b>の順に階層をたどって最終的なIPアドレスを調べる「再帰的な問い合わせ」を代行してくれます。</p>
      <p>DNSが返す情報にはいくつか種類（レコードタイプ）があり、代表的なものに、IPv4アドレスを表す<b>Aレコード</b>、IPv6アドレスを表す<b>AAAAレコード</b>、別の名前へのエイリアスを表す<b>CNAMEレコード</b>などがあります。</p>
      <p>また、一度調べた結果は<b>キャッシュ</b>として一定時間（<b>TTL: Time To Live</b>）保存されるため、同じサイトに何度もアクセスしても毎回DNSサーバーに問い合わせる必要はありません。TTLが切れると、再度最新の情報を問い合わせ直します。</p>
    `
  },
  {
    title: "ルーティング",
    icon: "📡",
    layer: "L3 ネットワーク層",
    sub: "宛先IPに合わせて次のルーターへ転送しよう",
    render: renderRoutingStage,
    dialogue: [
      { who: "rabbit", img: "rabbit", text: "IPアドレスが分かったので、あとはそこに向かって送るだけですよね？" },
      { who: "cat", img: "cat", text: "それが単純じゃないんだ。インターネットは一本道でつながっているわけじゃなくて、<strong>ルーター</strong>を何台も経由してリレーされていくんだよ。" },
      { who: "rabbit", img: "rabbitThink", text: "駅伝みたいな感じですか？" },
      { who: "cat", img: "catThink", text: "まさにそれ！各ルーターは「このIP範囲（サブネット）宛てなら次はこっち」という案内表（ルーティングテーブル）を持っていて、宛先IPを見て次の担当ルーターにバトンタッチしていくんだ。" },
      { who: "rabbit", img: "rabbit", text: "なるほど、宛先の住所を見て「担当エリア」を探せばいいんですね。やってみます！" }
    ],
    explainTitle: "ルーティング＝転送先の判断",
    explainBody: `
      <p>インターネット上のデータは、宛先まで一直線につながっているわけではなく、<b>ルーター</b>を何台も経由して届けられます。この「IPアドレスを見て転送経路を決める」処理は、OSI参照モデルの<b>L3 ネットワーク層</b>の仕事です。</p>
      <p>データは実際には<b>パケット（IPパケット）</b>という小さな単位に分割されて送られます。パケットの先頭には「宛先IPアドレス」「送信元IPアドレス」などが書かれた<b>ヘッダー</b>が付いており、ルーターはこのヘッダーの宛先IPアドレスだけを見て、次にどこへ転送すべきかを判断します。</p>
      <p>各ルーターは「このIPアドレス範囲（サブネット）宛てなら次はこちら」という<b>ルーティングテーブル</b>を持っています。宛先が自分の知っている範囲になければ、<b>デフォルトゲートウェイ</b>（「分からなければとりあえずここへ」という転送先）に投げることで、最終的にどこかのルーターが正しい経路にたどり着けるようになっています。この判断の連鎖（ホップ）によって、パケットは最終的に正しいサーバーへ届きます。</p>
    `
  },
  {
    title: "TCP 3ウェイハンドシェイク",
    icon: "🤝",
    layer: "L4 トランスポート層",
    sub: "接続を確立する正しい手順を体験しよう",
    render: renderHandshakeStage,
    dialogue: [
      { who: "cat", img: "cat", text: "次は、通信を始める前の「あいさつ」の話だよ。TCPで通信するときは、いきなりデータを送らずに<strong>3ウェイハンドシェイク</strong>という手順を踏むんだ。" },
      { who: "rabbit", img: "rabbit", text: "あいさつ……？いきなり話しかけちゃダメなんですか？" },
      { who: "cat", img: "catThink", text: "ダメというか非効率なんだ。相手が本当に応答できる状態か確認せずに送ると、届かなかったときに困るだろ？だから<strong>SYN→SYN/ACK→ACK</strong>の3回のやり取りで、お互いに「準備OK」を確認し合うんだよ。" },
      { who: "rabbit", img: "rabbitThink", text: "電話で「もしもし」「はい、聞こえてます」「じゃあ話します」ってやるのと似てますね。" },
      { who: "cat", img: "cat", text: "いい例えだね！その順番を、実際にボタンを押して組み立ててみよう。" }
    ],
    explainTitle: "接続はいきなり始まらない",
    explainBody: `
      <p>ポート番号やこのハンドシェイクの仕組みは、OSI参照モデルの<b>L4 トランスポート層</b>が担当します。この層には主に2つのプロトコルがあります。</p>
      <ul class="explain-list">
        <li><b>TCP（Transmission Control Protocol）</b>：接続を確立し、届いたかどうかを確認しながら送る「信頼性重視」のプロトコル。Web閲覧やファイル転送など、データが欠けると困る通信で使われます。</li>
        <li><b>UDP（User Datagram Protocol）</b>：接続確立や確認応答を省略し、とにかく速く送る「速度重視」のプロトコル。動画配信やオンラインゲームなど、多少の欠損より速さが大事な通信で使われます。</li>
      </ul>
      <p>Webサイトを見るときなど、多くの通信はTCPを使いますが、データを送る前に必ず接続を確立する手順を踏みます。それが<b>3ウェイハンドシェイク</b>です。</p>
      <ol class="explain-list">
        <li>クライアントが <b>SYN</b>（接続要求。同時にランダムな初期シーケンス番号を伝える）を送る</li>
        <li>サーバーが <b>SYN/ACK</b>（要求の承認＋自分からも接続要求）を返す</li>
        <li>クライアントが <b>ACK</b>（応答の確認）を送り、接続が確立する</li>
      </ol>
      <p>ここで交換される<b>シーケンス番号</b>は、その後のデータ送信で「どこまで届いたか」を管理するために使われ、次のステージで学ぶ再送の仕組みにもつながっています。この3回のやり取りによって、双方が「送受信の準備ができている」ことを確認してからデータ転送を始めます。</p>
    `
  },
  {
    title: "ポート番号",
    icon: "🚪",
    layer: "L4 トランスポート層",
    sub: "同じサーバーでもアプリごとに窓口が違う",
    render: renderPortStage,
    dialogue: [
      { who: "rabbit", img: "rabbit", text: "IPアドレスでサーバーまでは届きましたよね。でも1台のサーバーに、Webもメールもデータも全部同居してたら、どこに届けばいいんですか？" },
      { who: "cat", img: "cat", text: "そこで登場するのが<strong>ポート番号</strong>だよ。IPアドレスが「建物の住所」だとすると、ポート番号は「建物の中の部屋番号・窓口」なんだ。" },
      { who: "rabbit", img: "rabbitThink", text: "同じ建物でも、1階が受付、2階が郵便窓口……みたいな感じですか？" },
      { who: "cat", img: "catThink", text: "そのイメージでOK！HTTPS（暗号化されたWeb）は<strong>443番</strong>、HTTPは<strong>80番</strong>というふうに、使うサービスごとに決まった窓口番号があるんだよ。" },
      { who: "rabbit", img: "rabbit", text: "覚えることが多そうですが、まずはやってみます！" }
    ],
    explainTitle: "ポート番号＝アプリの窓口",
    explainBody: `
      <p>1台のサーバーでも、Webサーバー・メールサーバー・DNSサーバーなど複数のサービスが同時に動いていることがあります。それらを区別するのが、<b>L4 トランスポート層</b>が扱う<b>ポート番号</b>です。「IPアドレス＋ポート番号」の組み合わせは<b>ソケット</b>と呼ばれ、通信の相手を一意に特定します。</p>
      <p>ポート番号は0〜65535の範囲で、大きく3つに分類されます。</p>
      <ul class="explain-list">
        <li><b>ウェルノウンポート（0〜1023）</b>：HTTP(80)・HTTPS(443)・SSH(22)・SMTP(25)・DNS(53)など、用途があらかじめ決められた番号</li>
        <li><b>登録済みポート（1024〜49151）</b>：特定のアプリやサービスが登録して使う番号</li>
        <li><b>動的・プライベートポート（49152〜65535）</b>：クライアント側が通信のたびに一時的に使う番号</li>
      </ul>
      <p>例えばブラウザでHTTPS通信をするとき、サーバー側は443番で待ち受けていますが、クライアント側は動的ポートの中からランダムに選んだ番号を送信元ポートとして使います。この組み合わせにより、同じサーバーへの複数の通信も正しく区別できます。</p>
    `
  },
  {
    title: "パケットロス＆再送",
    icon: "🔁",
    layer: "L4 トランスポート層",
    sub: "ロスを避けつつ、失敗しても再送で届ける",
    render: renderLossStage,
    dialogue: [
      { who: "cat", img: "cat", text: "ネットワークって実は完璧じゃないんだ。混雑や障害で、送ったデータの一部が<strong>途中で消えてしまう</strong>ことがある。これを<strong>パケットロス</strong>と呼ぶよ。" },
      { who: "rabbit", img: "rabbitThink", text: "えっ、データが消えちゃったら通信って失敗しちゃうじゃないですか！？" },
      { who: "cat", img: "catThink", text: "普通ならそうなんだけど、TCPには保険がかかっているんだ。送ったデータへの確認応答（ACK）が一定時間内に返ってこないと、「届かなかった」と判断して自動的に<strong>再送</strong>してくれる。" },
      { who: "rabbit", img: "rabbit", text: "届くまで何度もリトライしてくれるから、多少ロスしても最終的にはちゃんと届くんですね。" },
      { who: "cat", img: "cat", text: "その通り！実際にロスを避けながら、届かなかったときは再送される様子を体験してみよう。" }
    ],
    explainTitle: "届かなければ、もう一度送る",
    explainBody: `
      <p>ネットワークでは、混雑や機器の障害によって一部のデータ（パケット）が失われる<b>パケットロス</b>が起こります。この「届いたことを保証する」信頼性の仕組みも、<b>L4 トランスポート層</b>のTCPが担当しています。</p>
      <p>TCPは送ったデータそれぞれに<b>シーケンス番号</b>を振り、受信側はどこまで受け取ったかを<b>ACK（確認応答）</b>として送り返します。送信側は、ACKが一定時間内（<b>タイムアウト</b>）に返ってこない場合、そのデータは失われたと判断して自動的に<b>再送</b>します。</p>
      <p>これにより、多少のロスが起きても最終的にはデータが正しく届く仕組みになっています（信頼性の高い通信）。一方で、動画配信などに使われる<b>UDP</b>にはこの再送の仕組みがなく、多少データが欠けても構わないので速度を優先する、という設計上のトレードオフになっています。</p>
    `
  },
  {
    title: "ファイアウォール",
    icon: "🧱",
    layer: "L3〜L4 ネットワーク〜トランスポート層",
    sub: "ルールに従って通信を許可・拒否しよう",
    render: renderFirewallStage,
    dialogue: [
      { who: "rabbit", img: "rabbit", text: "ここまででサーバーまで通信が届くようになりましたけど……誰でも自由に送っていいんですか？なんだか不安です。" },
      { who: "cat", img: "cat", text: "いいところに気づいたね。実際のネットワークには、通信を選別する門番役の<strong>ファイアウォール</strong>がいるんだ。" },
      { who: "rabbit", img: "rabbitThink", text: "門番さんは、何を見て通す・通さないを決めるんですか？" },
      { who: "cat", img: "catThink", text: "主に<strong>プロトコルとポート番号</strong>だよ。「Webの通信（80/443）とDNS（53）だけ通す。それ以外は全部止める」みたいなルールを決めておくんだ。" },
      { who: "rabbit", img: "rabbit", text: "最後は自分がその門番になって判定してみればいいんですね！" }
    ],
    explainTitle: "ファイアウォールは門番",
    explainBody: `
      <p><b>ファイアウォール</b>は、あらかじめ決められたルールに基づいて通信を通す（許可）か止める（拒否）かを判断する仕組みです。ここまで学んだ<b>L3のIPアドレス</b>と<b>L4のポート番号・プロトコル</b>を組み合わせて判定するため、ネットワーク層〜トランスポート層にまたがる機能です。</p>
      <p>ファイアウォールには大きく2つの方式があります。</p>
      <ul class="explain-list">
        <li><b>パケットフィルタリング（ステートレス）</b>：1つ1つの通信を独立に見て、送信元/宛先IP・ポート番号だけでルール判定する、シンプルで高速な方式</li>
        <li><b>ステートフルインスペクション</b>：通信の状態（例えば「これはこちらから開始した通信への返信か」）を記憶しながら判定する、より賢い方式。現在主流の方式です</li>
      </ul>
      <p>例えば「Webの通信（TCP 80/443）とDNS（UDP 53）だけ許可し、それ以外はすべて拒否する」といったルールを設定することで、不要な通信や不正アクセスの経路を減らし、ネットワークを安全に保ちます。なお、最近ではアプリケーション層（L7）の中身まで検査する<b>次世代ファイアウォール（NGFW）</b>も広く使われています。</p>
    `
  }
];

/* =========================================================
   起動処理
========================================================= */
document.getElementById("start-btn").onclick = () => {
  document.getElementById("start-modal").classList.add("hidden");
  state.score = 0;
  state.maxReached = 0;
  state.completed = new Set();
  addScore(0);
  startStage(0);
};

document.getElementById("restart-btn").onclick = () => {
  document.getElementById("end-modal").classList.add("hidden");
  state.score = 0;
  state.maxReached = 0;
  state.completed = new Set();
  addScore(0);
  startStage(0);
};
