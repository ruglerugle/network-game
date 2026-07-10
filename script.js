"use strict";

/* =========================================================
   状態管理
========================================================= */
const state = {
  stageIndex: -1,
  score: 0
};

const gameArea = document.getElementById("game-area");
const stageIndicator = document.getElementById("stage-indicator");
const scoreIndicator = document.getElementById("score-indicator");
const progressFill = document.getElementById("progress-fill");

function addScore(points) {
  state.score += points;
  scoreIndicator.textContent = `スコア: ${state.score}`;
}

function updateHud() {
  const total = STAGES.length;
  const current = Math.min(Math.max(state.stageIndex, 0) + 1, total);
  stageIndicator.textContent = `ステージ ${current} / ${total}`;
  progressFill.style.width = `${(Math.max(state.stageIndex, 0) / total) * 100}%`;
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
  updateHud();
  gameArea.innerHTML = "";
  const stage = STAGES[index];
  const header = document.createElement("div");
  header.className = "stage-header";
  header.innerHTML = `<h2>ステージ${index + 1}: ${stage.title}</h2><p class="stage-sub">${stage.sub}</p>`;
  gameArea.appendChild(header);

  const body = document.createElement("div");
  gameArea.appendChild(body);

  stage.render(body, () => {
    showExplain(stage.explainTitle, stage.explainBody, () => {
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
  progressFill.style.width = "100%";
  gameArea.innerHTML = "";
  document.getElementById("end-score").textContent = `最終スコア: ${state.score} 点`;
  document.getElementById("end-summary").innerHTML = `
    <ul class="explain-list">
      <li><b>DNS</b>：ドメイン名をIPアドレスに変換する「電話帳」の役割</li>
      <li><b>ルーティング</b>：宛先IPのサブネットを見て次の転送先を決める仕組み</li>
      <li><b>TCP 3ウェイハンドシェイク</b>：SYN → SYN/ACK → ACK で接続を確立</li>
      <li><b>ポート番号</b>：同じIPでもアプリごとに異なる「窓口」で通信を受け付ける</li>
      <li><b>パケットロス＆再送</b>：届かなかったデータはタイムアウト後に再送される</li>
      <li><b>ファイアウォール</b>：プロトコルとポート番号のルールで通信を許可／拒否する</li>
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

/* =========================================================
   ステージ1: DNS解決
========================================================= */
const DNS_QUESTIONS = [
  {
    domain: "www.example.com",
    correct: "93.184.216.34",
    options: ["93.184.216.34", "10.0.0.5", "172.16.254.1", "198.18.0.9"]
  },
  {
    domain: "mail.acme.co.jp",
    correct: "203.0.113.10",
    options: ["192.0.2.44", "203.0.113.10", "10.10.10.10", "203.0.113.99"]
  },
  {
    domain: "shop.example.net",
    correct: "198.51.100.7",
    options: ["198.51.100.7", "198.51.100.70", "192.168.1.7", "203.0.113.7"]
  }
];

function renderDnsStage(container, onComplete) {
  let round = 0;
  let correctCount = 0;

  function renderRound() {
    container.innerHTML = "";
    const q = DNS_QUESTIONS[round];

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <div class="topology">
        <div class="node"><span class="node-icon">🖥️</span>クライアント</div>
        <span class="arrow">→ 問い合わせ →</span>
        <div class="node active"><span class="node-icon">📖</span>DNSサーバー</div>
        <span class="arrow">→ 応答 →</span>
        <div class="node target"><span class="node-icon">🌐</span>${q.domain}</div>
      </div>
      <p>「<b>${q.domain}</b>」にアクセスしたい。DNSサーバーに問い合わせた結果、正しいIPアドレスはどれ？</p>
      <div class="card-row" id="dns-choices"></div>
      <div class="feedback" id="dns-feedback"></div>
    `;
    container.appendChild(panel);

    const choicesEl = panel.querySelector("#dns-choices");
    const feedback = panel.querySelector("#dns-feedback");
    let answered = false;

    shuffle(q.options).forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = opt;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        if (opt === q.correct) {
          btn.classList.add("correct");
          feedback.textContent = "正解！ このIPアドレス宛てに通信が行われます。";
          feedback.className = "feedback ok";
          correctCount++;
          addScore(10);
          setTimeout(advance, 900);
        } else {
          btn.classList.add("wrong");
          feedback.textContent = `不正解。正しいIPアドレスは ${q.correct} でした。`;
          feedback.className = "feedback ng";
          [...choicesEl.children].forEach((c) => (c.disabled = true));
          const correctBtn = [...choicesEl.children].find((c) => c.textContent === q.correct);
          if (correctBtn) correctBtn.classList.add("correct");
          setTimeout(advance, 1400);
        }
      };
      choicesEl.appendChild(btn);
    });
  }

  function advance() {
    round++;
    if (round >= DNS_QUESTIONS.length) {
      onComplete();
    } else {
      renderRound();
    }
  }

  renderRound();
}

/* =========================================================
   ステージ2: ルーティング
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
          setTimeout(advance, 1000);
        } else {
          btn.classList.add("wrong");
          feedback.textContent = `不正解。${r.destIP} は ${correctRouter.cidr}（${correctRouter.id}）の範囲です。`;
          feedback.className = "feedback ng";
          [...choicesEl.children].forEach((c) => (c.disabled = true));
          const correctBtn = [...choicesEl.children].find((c) => c.innerHTML.includes(correctRouter.id));
          if (correctBtn) correctBtn.classList.add("correct");
          setTimeout(advance, 1600);
        }
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
   ステージ3: TCP 3ウェイハンドシェイク
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
        setTimeout(onComplete, 1000);
      }
    } else {
      feedback.textContent = "順番が違います。今どちらが何を送るタイミングか考えてみましょう。";
      feedback.className = "feedback ng";
    }
  }
}

/* =========================================================
   ステージ4: ポート番号
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
          setTimeout(advance, 900);
        } else {
          door.classList.add("wrong");
          feedback.textContent = `不正解。正しくはポート${r.correct}（${r.labels[r.correct]}）です。`;
          feedback.className = "feedback ng";
          [...doorsEl.children].forEach((d) => (d.style.pointerEvents = "none"));
          const correctDoor = [...doorsEl.children].find((d) => d.querySelector(".port-num").textContent == r.correct);
          if (correctDoor) correctDoor.classList.add("correct");
          setTimeout(advance, 1400);
        }
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
   ステージ5: パケットロス＆再送（キャンバスゲーム）
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
      setTimeout(onComplete, 900);
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
   ステージ6: ファイアウォール
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
      setTimeout(advance, 1200);
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
   ステージ定義
========================================================= */
const STAGES = [
  {
    title: "DNS解決",
    sub: "ドメイン名からIPアドレスを調べよう",
    render: renderDnsStage,
    explainTitle: "DNSは「電話帳」",
    explainBody: `
      <p>私たちが普段入力する「www.example.com」のようなドメイン名は、コンピューターにとっては直接の宛先になりません。通信には<b>IPアドレス</b>が必要です。</p>
      <p><b>DNS（Domain Name System）</b>は、ドメイン名を対応するIPアドレスに変換してくれる仕組みで、よく「インターネットの電話帳」と例えられます。ブラウザは裏側で必ずこのDNS問い合わせを行ってから、実際の通信を開始しています。</p>
    `
  },
  {
    title: "ルーティング",
    sub: "宛先IPに合わせて次のルーターへ転送しよう",
    render: renderRoutingStage,
    explainTitle: "ルーティング＝転送先の判断",
    explainBody: `
      <p>インターネット上のデータは、宛先まで一直線につながっているわけではなく、<b>ルーター</b>を何台も経由して届けられます。</p>
      <p>各ルーターは「このIPアドレス範囲（サブネット）宛てなら次はこちら」という<b>ルーティングテーブル</b>を持っており、宛先IPアドレスを見て次に転送すべき経路を判断します。この判断の連鎖によって、パケットは最終的に正しいサーバーへたどり着きます。</p>
    `
  },
  {
    title: "TCP 3ウェイハンドシェイク",
    sub: "接続を確立する正しい手順を体験しよう",
    render: renderHandshakeStage,
    explainTitle: "接続はいきなり始まらない",
    explainBody: `
      <p>Webサイトを見るときなど、多くの通信は<b>TCP</b>というプロトコルを使いますが、データを送る前に必ず接続を確立する手順を踏みます。それが<b>3ウェイハンドシェイク</b>です。</p>
      <ol class="explain-list">
        <li>クライアントが <b>SYN</b>（接続要求）を送る</li>
        <li>サーバーが <b>SYN/ACK</b>（要求の承認＋自分からも要求）を返す</li>
        <li>クライアントが <b>ACK</b>（応答の確認）を送り、接続が確立する</li>
      </ol>
      <p>この3回のやり取りによって、双方が「送受信の準備ができている」ことを確認してからデータ転送を始めます。</p>
    `
  },
  {
    title: "ポート番号",
    sub: "同じサーバーでもアプリごとに窓口が違う",
    render: renderPortStage,
    explainTitle: "ポート番号＝アプリの窓口",
    explainBody: `
      <p>1台のサーバーでも、Webサーバー・メールサーバー・DNSサーバーなど複数のサービスが同時に動いていることがあります。それらを区別するのが<b>ポート番号</b>です。</p>
      <p>代表的なポート番号として、HTTPは<b>80</b>、HTTPSは<b>443</b>、SSHは<b>22</b>、SMTPは<b>25</b>、DNSは<b>53</b>が使われます。IPアドレスが「建物の住所」だとすると、ポート番号は「建物内のどの窓口・部屋か」に相当します。</p>
    `
  },
  {
    title: "パケットロス＆再送",
    sub: "ロスを避けつつ、失敗しても再送で届ける",
    render: renderLossStage,
    explainTitle: "届かなければ、もう一度送る",
    explainBody: `
      <p>ネットワークでは、混雑や障害によって一部のデータ（パケット）が失われる<b>パケットロス</b>が起こります。</p>
      <p><b>TCP</b>では、送信したデータに対する確認応答（ACK）が一定時間内に返ってこない場合、そのデータは失われたと判断して自動的に<b>再送</b>します。これにより、多少のロスが起きても最終的にはデータが正しく届く仕組みになっています（信頼性の高い通信）。</p>
    `
  },
  {
    title: "ファイアウォール",
    sub: "ルールに従って通信を許可・拒否しよう",
    render: renderFirewallStage,
    explainTitle: "ファイアウォールは門番",
    explainBody: `
      <p><b>ファイアウォール</b>は、あらかじめ決められたルール（プロトコルやポート番号など）に基づいて、通信を通す（許可）か止める（拒否）かを判断する仕組みです。</p>
      <p>例えば「Webの通信（TCP 80/443）とDNS（UDP 53）だけ許可し、それ以外はすべて拒否する」といったルールを設定することで、不要な通信や不正アクセスの経路を減らし、ネットワークを安全に保ちます。</p>
    `
  }
];

/* =========================================================
   起動処理
========================================================= */
document.getElementById("start-btn").onclick = () => {
  document.getElementById("start-modal").classList.add("hidden");
  state.score = 0;
  addScore(0);
  startStage(0);
};

document.getElementById("restart-btn").onclick = () => {
  document.getElementById("end-modal").classList.add("hidden");
  state.score = 0;
  addScore(0);
  startStage(0);
};
