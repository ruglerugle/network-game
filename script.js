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
   用語集ポップアップ
========================================================= */
const GLOSSARY = [
  { term: "OSI参照モデル", def: "通信を7つの階層に分けて役割分担する考え方。" },
  { term: "PDU", def: "各階層でやり取りされるデータのまとまりを指す一般的な呼び方（Protocol Data Unit）。層によってビット・フレーム・パケット・セグメント・データと名前が変わる。" },
  { term: "カプセル化", def: "上位層から下位層に渡る際、各層が自分の役割に必要なヘッダーを付け足していく処理。" },
  { term: "キャッシュDNSサーバー", def: "クライアントの代わりに再帰的に問い合わせを行い、結果を一定時間保存するDNSサーバー。フルサービスリゾルバとも呼ぶ。" },
  { term: "フルサービスリゾルバ", def: "キャッシュDNSサーバーの正式名称。クライアントに代わって、答えが出るまで再帰的に問い合わせを行う。" },
  { term: "権威DNSサーバー", def: "特定のドメインについて、実際のレコードを管理・保持している「本人」にあたるDNSサーバー。" },
  { term: "ルートサーバー", def: "DNS階層の頂点にあり、各TLD（.comなど）の担当サーバーの場所を案内するサーバー。世界に13系統ある。" },
  { term: "TLDサーバー", def: "「.com」「.jp」など特定のTLD（トップレベルドメイン）を管理し、配下の権威DNSサーバーの場所を案内するサーバー。" },
  { term: "エニーキャスト", def: "同じIPアドレスを持つサーバーを世界中に分散配置し、利用者から見て最も近い1台に自動的に振り分ける技術。" },
  { term: "ICANN", def: "ドメイン名やIPアドレスなど、インターネット全体の識別子資源を調整する国際的な非営利組織。" },
  { term: "IANA", def: "ICANNの傘下で、DNSルートゾーンやIPアドレスの割り当てを実務的に管理する機関。" },
  { term: "再帰問い合わせ", def: "答えが出るまでDNSサーバーに代わりに調べてきてもらう問い合わせ方式。" },
  { term: "反復問い合わせ", def: "知っていれば教えて、知らなければ次に聞くべき場所を教えて、と順にたどっていく問い合わせ方式。" },
  { term: "DNSキャッシュポイズニング", def: "DNSの応答を偽造し、悪意あるサイトへ誘導する攻撃。" },
  { term: "DNSSEC", def: "DNSの応答にデジタル署名を付け、改ざんを検知できるようにする仕組み。" },
  { term: "AAAAレコード", def: "ドメイン名に対応するIPv6アドレスを示すDNSレコード。" },
  { term: "CNAMEレコード", def: "別のドメイン名への別名（エイリアス）を示すDNSレコード。" },
  { term: "Aレコード", def: "ドメイン名に対応するIPv4アドレスを示すDNSレコード。" },
  { term: "TTL", def: "キャッシュの有効期限、またはルーティングでのパケットの生存時間（Time To Live）。" },
  { term: "HTTPメソッド", def: "GET・POSTなど、HTTPリクエストの目的を表す種別。" },
  { term: "ステータスコード", def: "サーバーからのHTTP応答結果を表す3桁の数字（200・404など）。" },
  { term: "ステートレス", def: "サーバーが前回のやり取りを覚えていない性質。HTTP自体はこの性質を持つ。" },
  { term: "HTTP/2", def: "1本の接続で複数のリクエストを並行処理できる（多重化）HTTPのバージョン。" },
  { term: "HTTP/3", def: "TCPの代わりにQUICを使う、最新のHTTPのバージョン。" },
  { term: "QUIC", def: "UDPをベースにした、HTTP/3で使われる新しいトランスポートプロトコル。" },
  { term: "Cookie", def: "サーバーが発行し、ブラウザが保存・送信する識別情報。ログイン状態の維持などに使う。" },
  { term: "TLSハンドシェイク", def: "TLSで暗号化通信を始める前に行う、鍵の交換や身元確認の手順。" },
  { term: "共通鍵暗号", def: "暗号化と復号に同じ鍵を使う方式。処理は高速だが鍵の受け渡しが課題。" },
  { term: "公開鍵暗号", def: "暗号化用の公開鍵と復号用の秘密鍵がペアになっている暗号方式。" },
  { term: "デジタル証明書", def: "サーバーの身元を証明する電子的な証明書。認証局が発行する。" },
  { term: "認証局", def: "デジタル証明書を発行する、信頼された第三者機関（CA）。" },
  { term: "SNI", def: "TLS接続の最初に、アクセス先のドメイン名をサーバーに伝える仕組み。" },
  { term: "MACアドレステーブル", def: "スイッチが学習した、MACアドレスとポートの対応表。" },
  { term: "MACアドレス", def: "ネットワーク機器のインターフェースに割り当てられた固有の識別番号。" },
  { term: "フラッディング", def: "宛先MACアドレスが分からないフレームを、学習済みポート以外の全ポートに送る動作。" },
  { term: "コリジョンドメイン", def: "信号の衝突が起こりうる範囲。" },
  { term: "ブロードキャストドメイン", def: "ブロードキャスト（宛先を全員にした通信）が届く範囲。" },
  { term: "トランクポート", def: "複数のVLANのフレームをタグ付きでまとめて運ぶスイッチのポート。" },
  { term: "アクセスポート", def: "特定の1つのVLANのみに属する、通常のスイッチのポート。" },
  { term: "VLAN", def: "1台の物理スイッチを、論理的に複数のネットワークへ分割する技術。" },
  { term: "ルーティングテーブル", def: "宛先のIPアドレス範囲ごとに、次の転送先を記録した表。" },
  { term: "デフォルトゲートウェイ", def: "宛先が自分の知っている範囲になかったときに、とりあえず転送する先。" },
  { term: "スタティックルーティング", def: "管理者が手動で経路を設定するルーティング方式。" },
  { term: "ダイナミックルーティング", def: "ルーター同士が経路情報を自動的に交換し合うルーティング方式。" },
  { term: "CIDR", def: "IPアドレスの範囲を「/24」のようにスラッシュ以降の数字で表す表記法。" },
  { term: "ARP", def: "IPアドレスから、それに対応するMACアドレスを調べる仕組み。" },
  { term: "NAT", def: "プライベートIPアドレスをグローバルIPアドレスに変換する仕組み。" },
  { term: "BGP", def: "インターネット全体で経路情報を交換するルーティングプロトコル。" },
  { term: "OSPF", def: "組織内ネットワーク向けの代表的な動的ルーティングプロトコル。" },
  { term: "4ウェイハンドシェイク", def: "FIN/ACKのやり取りを双方向で行い、TCP接続を終了する手順。" },
  { term: "3ウェイハンドシェイク", def: "SYN→SYN/ACK→ACKの3回のやり取りで、TCP接続を確立する手順。" },
  { term: "シーケンス番号", def: "送ったデータの位置を管理するためにTCPが振る番号。" },
  { term: "スライディングウィンドウ", def: "確認応答を待たずに、複数のデータをまとめて送る仕組み。" },
  { term: "輻輳制御", def: "ネットワークの混雑状況に応じて、送信量を調整する仕組み。" },
  { term: "スロースタート", def: "TCP通信の開始直後、送信量を少しずつ倍増させていく輻輳制御の一種。" },
  { term: "RTT", def: "パケットが相手まで届いて応答が返ってくるまでの往復時間。" },
  { term: "RTO", def: "再送するかどうかを判断するために待つタイムアウト時間。" },
  { term: "ポートフォワーディング", def: "外部からの通信を、内部の特定の機器・ポートへ転送するルーターの設定。" },
  { term: "ソケット", def: "IPアドレスとポート番号の組み合わせ。通信の相手を一意に特定する。" },
  { term: "ステートフルインスペクション", def: "通信の状態（返信かどうか等）を記憶しながら判定するファイアウォール方式。" },
  { term: "ACL", def: "許可・拒否のルールを順に並べた一覧（Access Control List）。" },
  { term: "DMZ", def: "社内ネットワークとインターネットの間に設ける緩衝地帯。" },
  { term: "NGFW", def: "ポート番号だけでなくアプリ層の中身まで検査する次世代ファイアウォール。" },
  { term: "IDS", def: "通信の中身を分析し、不審な兆候を検知・通知するシステム。" },
  { term: "IPS", def: "不審な通信を検知し、自動的に遮断するところまで行うシステム。" }
];

function glossify(html) {
  const terms = GLOSSARY.map((g) => g.term).sort((a, b) => b.length - a.length);
  const placeholders = [];
  const parts = html.split(/(<[^>]+>)/);
  const withPlaceholders = parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return terms.reduce((s, t) => {
        if (!s.includes(t)) return s;
        const idx = placeholders.length;
        placeholders.push(`<span class="gloss-term" onclick="showGloss(this,'${t}')">${t}</span>`);
        return s.split(t).join(`\x00${idx}\x00`);
      }, part);
    })
    .join("");
  return withPlaceholders.replace(/\x00(\d+)\x00/g, (_, i) => placeholders[+i]);
}

function showGloss(el, term) {
  const g = GLOSSARY.find((x) => x.term === term);
  if (!g) return;
  document.getElementById("gloss-term-title").textContent = g.term;
  document.getElementById("gloss-def").textContent = g.def;
  const pop = document.getElementById("gloss-popup");
  pop.style.display = "block";
  const r = el.getBoundingClientRect();
  const pw = Math.min(280, window.innerWidth - 32);
  let left = r.left;
  if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
  if (left < 8) left = 8;
  const top = r.bottom + 6;
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
  pop.style.width = `${pw}px`;
}

function closeGloss() {
  document.getElementById("gloss-popup").style.display = "none";
}

document.addEventListener("click", (e) => {
  if (!e.target.closest("#gloss-popup") && !e.target.classList.contains("gloss-term")) {
    closeGloss();
  }
});

/* =========================================================
   解説モーダル
========================================================= */
const explainModal = document.getElementById("explain-modal");
const explainTitle = document.getElementById("explain-title");
const explainBody = document.getElementById("explain-body");
const explainNextBtn = document.getElementById("explain-next-btn");

function showExplain(title, bodyHtml, onNext) {
  explainTitle.textContent = title;
  explainBody.innerHTML = glossify(bodyHtml);
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
      <li><b>HTTP（L7）</b>：リクエスト/レスポンスでやり取りするメソッドとステータスコード</li>
      <li><b>TLS/HTTPS</b>：公開鍵暗号で共通鍵を安全に渡してから暗号化通信を行う仕組み</li>
      <li><b>スイッチング・VLAN（L2）</b>：MACアドレステーブルでの転送と、論理的なネットワーク分割</li>
      <li><b>ルーティング（L3）</b>：宛先IPのサブネットを見て次の転送先を決める仕組み</li>
      <li><b>TCPハンドシェイク（L4）</b>：SYN → SYN/ACK → ACK で確立し、FIN/ACKのやり取りで終了</li>
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
      if (d.type === "diagram") {
        return `<div class="dialog-diagram">${d.html}</div>`;
      }
      const isRabbit = d.who === "rabbit";
      return `<div class="dialog-row${isRabbit ? " right" : ""}">
        <div class="dialog-character">
          <img src="images/${d.img}.png" alt="${isRabbit ? "うさ美" : "ねこ先生"}">
          <div class="dialog-name ${d.who}">${isRabbit ? "うさ美" : "ねこ先生"}</div>
        </div>
        <div class="dialog-bubble">${glossify(d.text)}</div>
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
  { num: 7, name: "アプリケーション層", pdu: "データ", example: "HTTP・DNS・SMTP・FTPなど、アプリが使う通信規約" },
  { num: 6, name: "プレゼンテーション層", pdu: "データ", example: "文字コードの変換、暗号化・圧縮の形式を揃える" },
  { num: 5, name: "セッション層", pdu: "データ", example: "通信の開始から終了までのやり取り（セッション）を管理" },
  { num: 4, name: "トランスポート層", pdu: "セグメント/データグラム", example: "TCP・UDP、ポート番号で通信の信頼性・区別を担当" },
  { num: 3, name: "ネットワーク層", pdu: "パケット", example: "IPアドレス・ICMP・ルーティングで宛先までの経路を決める" },
  { num: 2, name: "データリンク層", pdu: "フレーム", example: "MACアドレス・Ethernet・ARPで同一ネットワーク内に届ける" },
  { num: 1, name: "物理層", pdu: "ビット", example: "LANケーブルの電気信号やWi-Fiの電波そのもの" }
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
        <div class="osi-name">${l.name}<span class="osi-pdu">PDU: ${l.pdu}</span></div>
        <div class="osi-example">${l.example}</div>
      </div>
    </div>`).join("");
  return `<div class="osi-stack">${rows}</div>`;
}

function renderOsiStage(container, onComplete) {
  const diagramPanel = document.createElement("div");
  diagramPanel.className = "panel";
  diagramPanel.innerHTML = glossify(`<p>まずは全体像を確認しよう。通信は<b>7つの階層（レイヤー）</b>に分かれていて、上の層ほど人間に近く、下の層ほど物理的な信号に近い。</p>${buildOsiDiagram()}`);
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
   ステージ3: HTTP通信の中身
========================================================= */
const HTTP_METHOD_POOL = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const HTTP_STATUS_POOL = [
  "200 OK",
  "301 Moved Permanently",
  "400 Bad Request",
  "401 Unauthorized",
  "403 Forbidden",
  "404 Not Found",
  "500 Internal Server Error"
];

const HTTP_QUIZ = [
  { clue: "サーバーからページの情報を取得したい（データは変更しない）", pool: HTTP_METHOD_POOL, correct: "GET" },
  { clue: "フォームに入力した内容を送信し、新しいデータを作成したい", pool: HTTP_METHOD_POOL, correct: "POST" },
  { clue: "既存のリソースの内容を丸ごと置き換えたい", pool: HTTP_METHOD_POOL, correct: "PUT" },
  { clue: "既存のリソースを削除したい", pool: HTTP_METHOD_POOL, correct: "DELETE" },
  { clue: "リクエストが成功し、正常にレスポンスを返せた", pool: HTTP_STATUS_POOL, correct: "200 OK" },
  { clue: "リクエストされたページが見つからなかった", pool: HTTP_STATUS_POOL, correct: "404 Not Found" },
  { clue: "ページが恒久的に別のURLへ移動した", pool: HTTP_STATUS_POOL, correct: "301 Moved Permanently" },
  { clue: "ログインしていない、または認証情報が不足している", pool: HTTP_STATUS_POOL, correct: "401 Unauthorized" },
  { clue: "サーバー側の内部エラーで処理できなかった", pool: HTTP_STATUS_POOL, correct: "500 Internal Server Error" }
];

function renderHttpStage(container, onComplete) {
  let round = 0;

  function renderRound() {
    container.innerHTML = "";
    const q = HTTP_QUIZ[round];
    const isMethod = q.pool === HTTP_METHOD_POOL;
    const distractors = shuffle(q.pool.filter((v) => v !== q.correct)).slice(0, 3);
    const options = shuffle([q.correct, ...distractors]);

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <p>${isMethod ? "この場面で使うべきHTTPメソッドは？" : "このステータスコードとして正しいのは？"}</p>
      <div class="scenario-box">${q.clue}</div>
      <div class="card-row" id="http-choices"></div>
      <div class="feedback" id="http-feedback"></div>
    `;
    container.appendChild(panel);

    const choicesEl = panel.querySelector("#http-choices");
    const feedback = panel.querySelector("#http-feedback");
    let answered = false;

    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = opt;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        if (opt === q.correct) {
          btn.classList.add("correct");
          feedback.textContent = `正解！ ${q.correct} です。`;
          feedback.className = "feedback ok";
          addScore(10);
        } else {
          btn.classList.add("wrong");
          feedback.textContent = `不正解。正しくは ${q.correct} でした。`;
          feedback.className = "feedback ng";
          [...choicesEl.children].forEach((c) => (c.disabled = true));
          const correctBtn = [...choicesEl.children].find((c) => c.textContent === q.correct);
          if (correctBtn) correctBtn.classList.add("correct");
        }
        appendNextButton(panel, advance);
      };
      choicesEl.appendChild(btn);
    });
  }

  function advance() {
    round++;
    if (round >= HTTP_QUIZ.length) {
      onComplete();
    } else {
      renderRound();
    }
  }

  renderRound();
}

/* =========================================================
   ステージ4: TLS/HTTPSの暗号化
========================================================= */
const TLS_SEQUENCE = [
  { key: "CH", label: "ClientHello（対応する暗号方式・乱数を送る）", from: "client" },
  { key: "SH", label: "ServerHello＋証明書（暗号方式の決定・サーバー証明書を送付）", from: "server" },
  { key: "KEY", label: "鍵交換（共通鍵のもとになる情報を安全に交換）", from: "client" },
  { key: "FIN", label: "Finished（以降の通信を共通鍵で暗号化して開始）", from: "server" }
];
const TLS_DISTRACTORS = [
  { key: "SYN", label: "SYN（TCP接続要求）" },
  { key: "PLAIN", label: "PLAINDATA（暗号化なしでデータ送信）" }
];

function renderTlsStage(container, onComplete) {
  let step = 0;

  container.innerHTML = `
    <div class="panel">
      <p>HTTPSは、TCP接続の上でさらに<b>TLSハンドシェイク</b>を行ってから暗号化通信を始めます。正しい順番でボタンを押してください。</p>
      <div class="handshake-lane">
        <div class="actor"><span class="icon">🖥️</span>クライアント</div>
        <div class="timeline" id="tls-timeline"></div>
        <div class="actor"><span class="icon">🗄️</span>サーバー</div>
      </div>
      <div class="option-pool" id="tls-pool"></div>
      <div class="feedback" id="tls-feedback"></div>
    </div>
  `;

  const timeline = container.querySelector("#tls-timeline");
  const pool = container.querySelector("#tls-pool");
  const feedback = container.querySelector("#tls-feedback");

  const pooled = shuffle([...TLS_SEQUENCE, ...TLS_DISTRACTORS]);
  pooled.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = item.label;
    btn.onclick = () => handleClick(item, btn);
    pool.appendChild(btn);
  });

  function handleClick(item, btn) {
    const expected = TLS_SEQUENCE[step];
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
      if (step >= TLS_SEQUENCE.length) {
        feedback.textContent = "TLSハンドシェイク完了！ここから先の通信は暗号化されます。";
        pool.innerHTML = "";
        appendNextButton(container.querySelector(".panel"), onComplete);
      }
    } else {
      feedback.textContent = "順番が違います。鍵や証明書はどちらから先に必要か考えてみましょう。";
      feedback.className = "feedback ng";
    }
  }
}

/* =========================================================
   ステージ5: スイッチング・VLAN
========================================================= */
const VLAN_QUIZ = [
  {
    clue: "スイッチが受信したフレームの送信元MACアドレスを記録していく表",
    correct: "MACアドレステーブル",
    options: ["MACアドレステーブル", "ルーティングテーブル", "ARPテーブル", "DNSキャッシュ"]
  },
  {
    clue: "宛先MACアドレスがMACアドレステーブルに見つからないとき、スイッチが取る動作",
    correct: "フラッディング（学習済みポート以外の全ポートへ転送）",
    options: ["フラッディング（学習済みポート以外の全ポートへ転送）", "そのフレームを破棄する", "デフォルトゲートウェイに転送する", "送信元にエラーを返す"]
  },
  {
    clue: "1台の物理スイッチを、複数の独立した論理ネットワークに分割する技術",
    correct: "VLAN（Virtual LAN）",
    options: ["VLAN（Virtual LAN）", "NAT", "サブネッティング", "ポートフォワーディング"]
  },
  {
    clue: "複数のVLANのフレームを、タグを付けて1本のケーブルでまとめて運ぶポート",
    correct: "トランクポート（802.1Qタグ付き）",
    options: ["トランクポート（802.1Qタグ付き）", "アクセスポート", "コンソールポート", "アップリンクポート（無条件）"]
  },
  {
    clue: "同じVLAN（同じセグメント）内の1台がブロードキャストを送ると、届く範囲",
    correct: "そのVLANに所属する全ての機器",
    options: ["そのVLANに所属する全ての機器", "スイッチに接続された全機器（VLAN無視）", "送信元と直接リンクした1台のみ", "ルーターの先にある全ネットワーク"]
  }
];

function renderVlanStage(container, onComplete) {
  let round = 0;

  function renderRound() {
    container.innerHTML = "";
    const q = VLAN_QUIZ[round];
    const options = shuffle(q.options);

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <p>次の内容に当てはまるのは？</p>
      <div class="scenario-box">${q.clue}</div>
      <div class="card-row" id="vlan-choices"></div>
      <div class="feedback" id="vlan-feedback"></div>
    `;
    container.appendChild(panel);

    const choicesEl = panel.querySelector("#vlan-choices");
    const feedback = panel.querySelector("#vlan-feedback");
    let answered = false;

    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = opt;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        if (opt === q.correct) {
          btn.classList.add("correct");
          feedback.textContent = "正解！";
          feedback.className = "feedback ok";
          addScore(10);
        } else {
          btn.classList.add("wrong");
          feedback.textContent = `不正解。正しくは「${q.correct}」でした。`;
          feedback.className = "feedback ng";
          [...choicesEl.children].forEach((c) => (c.disabled = true));
          const correctBtn = [...choicesEl.children].find((c) => c.textContent === q.correct);
          if (correctBtn) correctBtn.classList.add("correct");
        }
        appendNextButton(panel, advance);
      };
      choicesEl.appendChild(btn);
    });
  }

  function advance() {
    round++;
    if (round >= VLAN_QUIZ.length) {
      onComplete();
    } else {
      renderRound();
    }
  }

  renderRound();
}

/* =========================================================
   ステージ6: ルーティング
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
   ステージ4: TCPハンドシェイク（確立・終了）
========================================================= */
const HANDSHAKE_PHASES = [
  {
    title: "接続の確立（3ウェイハンドシェイク）",
    instruction: "クライアントとサーバーが接続を確立するには、決まった順番でパケットをやり取りする必要があります（3ウェイハンドシェイク）。正しい順番でボタンを押してください。",
    sequence: [
      { key: "SYN", label: "SYN（接続要求）", from: "client" },
      { key: "SYN-ACK", label: "SYN/ACK（要求の承認＋応答要求）", from: "server" },
      { key: "ACK", label: "ACK（応答の確認・接続確立）", from: "client" }
    ],
    distractors: [
      { key: "FIN", label: "FIN（切断要求）" },
      { key: "DATA", label: "DATA（データ送信）" }
    ],
    doneText: "3ウェイハンドシェイク完了！接続が確立しました。"
  },
  {
    title: "接続の終了（4ウェイハンドシェイク）",
    instruction: "通信が終わったら、今度は接続を終了する手順を踏みます。TCPの切断は双方向で行うため、4回のやり取り（4ウェイハンドシェイク）になります。",
    sequence: [
      { key: "FIN1", label: "FIN（クライアントから切断要求）", from: "client" },
      { key: "ACK1", label: "ACK（切断要求を確認・受信）", from: "server" },
      { key: "FIN2", label: "FIN（サーバーからも切断要求）", from: "server" },
      { key: "ACK2", label: "ACK（最終確認・接続終了）", from: "client" }
    ],
    distractors: [
      { key: "SYN", label: "SYN（接続要求）" },
      { key: "RST", label: "RST（強制的な切断）" }
    ],
    doneText: "4ウェイハンドシェイク完了！接続が正常に終了しました。"
  }
];

function renderHandshakeStage(container, onComplete) {
  let phaseIndex = 0;

  function renderPhase() {
    const phase = HANDSHAKE_PHASES[phaseIndex];
    let step = 0;

    container.innerHTML = `
      <div class="panel">
        <p><b>${phase.title}</b></p>
        <p>${phase.instruction}</p>
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

    const pooled = shuffle([...phase.sequence, ...phase.distractors]);
    pooled.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = item.label;
      btn.onclick = () => handleClick(item, btn);
      pool.appendChild(btn);
    });

    function handleClick(item, btn) {
      const expected = phase.sequence[step];
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
        if (step >= phase.sequence.length) {
          feedback.textContent = phase.doneText;
          pool.innerHTML = "";
          appendNextButton(container.querySelector(".panel"), advancePhase);
        }
      } else {
        feedback.textContent = "順番が違います。今どちらが何を送るタイミングか考えてみましょう。";
        feedback.className = "feedback ng";
      }
    }
  }

  function advancePhase() {
    phaseIndex++;
    if (phaseIndex >= HANDSHAKE_PHASES.length) {
      onComplete();
    } else {
      renderPhase();
    }
  }

  renderPhase();
}

/* =========================================================
   ステージ5: ポート番号
========================================================= */
const PORT_POOL = {
  20: "FTP(データ)",
  21: "FTP(制御)",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  53: "DNS",
  67: "DHCP",
  80: "HTTP",
  110: "POP3",
  143: "IMAP",
  443: "HTTPS",
  3389: "RDP"
};

const PORT_ROUNDS = [
  { scenario: "暗号化されたWebサイト（HTTPS）を閲覧する", correct: 443 },
  { scenario: "暗号化なしのWebサイト（HTTP）を閲覧する", correct: 80 },
  { scenario: "メールサーバーへメールを送信する（SMTP）", correct: 25 },
  { scenario: "ドメイン名をIPアドレスに変換してもらう（DNS）", correct: 53 },
  { scenario: "リモートのサーバーに安全にログインする（SSH）", correct: 22 },
  { scenario: "リモートデスクトップでWindowsサーバーに接続する（RDP）", correct: 3389 },
  { scenario: "FTPサーバーに接続してファイルをやり取りする（制御用ポート）", correct: 21 },
  { scenario: "メールサーバーに残したまま受信メールを確認する（IMAP）", correct: 143 }
];

function renderPortStage(container, onComplete) {
  let round = 0;

  function renderRound() {
    container.innerHTML = "";
    const r = PORT_ROUNDS[round];
    const otherPorts = shuffle(Object.keys(PORT_POOL).map(Number).filter((p) => p !== r.correct)).slice(0, 4);
    const ports = shuffle([r.correct, ...otherPorts]);

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
      door.innerHTML = `<span class="port-num">${p}</span><span class="port-label">${PORT_POOL[p]}</span>`;
      door.onclick = () => {
        if (answered) return;
        answered = true;
        if (p === r.correct) {
          door.classList.add("correct");
          feedback.textContent = `正解！ ポート${p}（${PORT_POOL[p]}）宛てに届けられました。`;
          feedback.className = "feedback ok";
          addScore(10);
        } else {
          door.classList.add("wrong");
          feedback.textContent = `不正解。正しくはポート${r.correct}（${PORT_POOL[r.correct]}）です。`;
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
   ステージ11: 配送ルート最終試験（迷路）
========================================================= */
const MAZE_PATH = [
  { key: "dns", label: "DNS解決", icon: "📖" },
  { key: "route", label: "ルーティング", icon: "📡" },
  { key: "switch", label: "スイッチング", icon: "🔀" },
  { key: "tcp", label: "TCPハンドシェイク", icon: "🤝" },
  { key: "tls", label: "TLSハンドシェイク", icon: "🔒" },
  { key: "http", label: "HTTPリクエスト送信", icon: "📄" },
  { key: "fw", label: "ファイアウォール通過", icon: "🧱" }
];

function buildMazeMap(step) {
  const nodes = [
    { icon: "🖥️", label: "クライアント" },
    ...MAZE_PATH,
    { icon: "🗄️", label: "サーバー" }
  ];
  const cells = nodes
    .map((n, i) => {
      let status;
      if (i === 0 || i <= step) status = "done";
      else if (i === step + 1) status = "current";
      else status = "locked";
      return `<div class="maze-node ${status}"><span class="maze-icon">${n.icon}</span><span class="maze-label">${n.label}</span></div>`;
    })
    .join('<span class="maze-arrow">→</span>');
  return `<div class="maze-map">${cells}</div>`;
}

function renderMazeStage(container, onComplete) {
  let step = 0;
  const lossAtStep = 1 + Math.floor(Math.random() * (MAZE_PATH.length - 2));

  function renderStep() {
    container.innerHTML = buildMazeMap(step);

    if (step >= MAZE_PATH.length) {
      const donePanel = document.createElement("div");
      donePanel.className = "panel";
      donePanel.innerHTML = `<div class="feedback ok">サーバーに到着！データがたどった道のりを、すべて自分で選び切ったね。</div>`;
      container.appendChild(donePanel);
      appendNextButton(donePanel, onComplete);
      return;
    }

    const correct = MAZE_PATH[step];
    const decoys = shuffle(MAZE_PATH.filter((_, idx) => idx !== step)).slice(0, 2);
    const options = shuffle([correct, ...decoys]);

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <p>次に進むべき道はどれ？（${step + 1} / ${MAZE_PATH.length}）</p>
      <div class="card-row" id="maze-choices"></div>
      <div class="feedback" id="maze-feedback"></div>
    `;
    container.appendChild(panel);

    const choicesEl = panel.querySelector("#maze-choices");
    const feedback = panel.querySelector("#maze-feedback");

    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = `${opt.icon} ${opt.label}`;
      btn.onclick = () => {
        if (opt.key === correct.key) {
          [...choicesEl.children].forEach((c) => (c.disabled = true));
          btn.classList.add("correct");
          const lossNote = step === lossAtStep ? "（この区間で🔁パケットロスが発生したけど、自動的に再送されたよ）" : "";
          feedback.textContent = `正解！ ${lossNote}`;
          feedback.className = "feedback ok";
          addScore(10);
          appendNextButton(panel, () => {
            step++;
            renderStep();
          });
        } else {
          btn.classList.add("wrong");
          btn.disabled = true;
          feedback.textContent = "✕ 行き止まり！別の道を選んでみよう。";
          feedback.className = "feedback ng";
        }
      };
      choicesEl.appendChild(btn);
    });
  }

  renderStep();
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
      { who: "rabbit", img: "rabbitThink", text: "積み木というと、データを送るときは実際どうなるんですか？" },
      { who: "cat", img: "cat", text: "引っ越し荷物の梱包を思い浮かべてみて。中身（データ）を箱に入れて、その箱に部屋番号のラベル（トランスポート層）を貼り、さらに建物名のラベル（ネットワーク層）を貼り、最後に配送業者のラベル（データリンク層）を貼る……というふうに、外側に行くほどラベル（ヘッダー）が重なっていくんだ。これを<strong>カプセル化</strong>と呼ぶよ。" },
      {
        type: "diagram",
        html: `
          <div class="encap-stack">
            <div class="encap-layer encap-l2">
              <span class="encap-tag">Ethernetヘッダー（宛先MACアドレス）</span>
              <div class="encap-layer encap-l3">
                <span class="encap-tag">IPヘッダー（宛先IPアドレス）</span>
                <div class="encap-layer encap-l4">
                  <span class="encap-tag">TCPヘッダー（宛先ポート番号）</span>
                  <div class="encap-layer encap-l7">データ（HTTPリクエストなど）</div>
                </div>
              </div>
            </div>
          </div>
          <div class="flow-note">受信側では逆に、外側のラベルから順にはがしていく（非カプセル化）</div>
        `
      },
      { who: "rabbit", img: "rabbitThink", text: "この後の DNS やルーティング、TCP の話も、この階層のどこかに当てはまるんですね？" },
      { who: "cat", img: "cat", text: "その通り！各ステージのタイトル横に「第何層の話か」を表示していくから、今どこを学んでいるか意識しながら進めよう。" }
    ],
    explainTitle: "OSI参照モデルは「階層分担」",
    explainBody: `
      <p>実際の通信は、役割の異なる<b>7つの階層</b>に分けて考えることができます。これを<b>OSI参照モデル</b>と呼びます。上位層は下位層の機能を利用しながら、それぞれ決められた役割だけに集中することで、複雑な通信の仕組み全体を整理しています。</p>
      <table class="rule-table">
        <thead><tr><th>層</th><th>名称</th><th>PDU</th><th>代表的なプロトコル・要素</th></tr></thead>
        <tbody>
          <tr><td>L7</td><td>アプリケーション層</td><td>データ</td><td>HTTP/HTTPS・DNS・SMTP・FTP・SSH</td></tr>
          <tr><td>L6</td><td>プレゼンテーション層</td><td>データ</td><td>文字コード（UTF-8等）、TLS/SSLの暗号化、圧縮</td></tr>
          <tr><td>L5</td><td>セッション層</td><td>データ</td><td>セッション確立・維持・終了（TLSハンドシェイクの一部等）</td></tr>
          <tr><td>L4</td><td>トランスポート層</td><td>セグメント/データグラム</td><td>TCP・UDP、ポート番号</td></tr>
          <tr><td>L3</td><td>ネットワーク層</td><td>パケット</td><td>IP（IPv4/IPv6）・ICMP・ルーティング</td></tr>
          <tr><td>L2</td><td>データリンク層</td><td>フレーム</td><td>Ethernet・Wi-Fi（802.11）・MACアドレス・ARP・スイッチ</td></tr>
          <tr><td>L1</td><td>物理層</td><td>ビット</td><td>LANケーブル・光ファイバー・電波、リピーター・ハブ</td></tr>
        </tbody>
      </table>
      <p>データを送信するとき、上位層から下位層に渡るたびに、各層が自分の役割に必要な<b>ヘッダー情報</b>を付け足していきます。この処理を<b>カプセル化（Encapsulation）</b>と呼びます。例えば「アプリのデータ」に<b>TCPヘッダー</b>（ポート番号など）が付くと<b>セグメント</b>、そこに<b>IPヘッダー</b>（IPアドレスなど）が付くと<b>パケット</b>、さらに<b>イーサネットヘッダー</b>（MACアドレスなど）が付くと<b>フレーム</b>と呼ばれ、最終的に電気信号（ビット）として送出されます。受信側では逆に、下位層から順にヘッダーを取り除いていく<b>非カプセル化（Decapsulation）</b>が行われます。</p>
      <p>実務では、これをさらに簡略化した<b>TCP/IPモデル（4階層）</b>もよく使われます。OSIのL7〜L5をまとめて「アプリケーション層」、L4を「トランスポート層」、L3を「インターネット層」、L2・L1をまとめて「ネットワークインターフェース層」と呼びます。呼び方が違っても、考え方は同じです。この後のステージでも、それぞれの内容がOSIの何層に対応するかを見出しの横に表示していきます。</p>
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
      { who: "rabbit", img: "rabbit", text: "そのDNSサーバーって、世界に1台だけあるんですか？" },
      { who: "cat", img: "catThink", text: "ううん、実はいくつもの役割のサーバーがリレーして連携しているんだ。まず私たちの代わりに調べ物をしてくれるのが<strong>フルサービスリゾルバ</strong>（さっき言った「DNSサーバー」の正式名称だよ）。そこから<strong>ルートサーバー</strong>→<strong>TLDサーバー</strong>→<strong>権威DNSサーバー</strong>の順に「ここじゃないなら次はここ」とたどっていくんだ。" },
      {
        type: "diagram",
        html: `
          <div class="seq-row"><span class="seq-step">① クライアント → フルサービスリゾルバ</span><span class="seq-arrow">→</span><span class="seq-status seq-wait">「www.example.comのIPは？」</span></div>
          <div class="seq-row"><span class="seq-step">② リゾルバ → ルートサーバー</span><span class="seq-arrow">→</span><span class="seq-status seq-wait">「.comの担当は？」</span></div>
          <div class="seq-row"><span class="seq-step">③ ルートサーバー → リゾルバ</span><span class="seq-arrow">→</span><span class="seq-status seq-ok">「.comのTLDサーバーはここ」</span></div>
          <div class="seq-row"><span class="seq-step">④ リゾルバ → TLDサーバー</span><span class="seq-arrow">→</span><span class="seq-status seq-wait">「example.comの担当は？」</span></div>
          <div class="seq-row"><span class="seq-step">⑤ TLDサーバー → リゾルバ</span><span class="seq-arrow">→</span><span class="seq-status seq-ok">「example.comの権威サーバーはここ」</span></div>
          <div class="seq-row"><span class="seq-step">⑥ リゾルバ → 権威DNSサーバー</span><span class="seq-arrow">→</span><span class="seq-status seq-wait">「www.example.comのIPは？」</span></div>
          <div class="seq-row"><span class="seq-step">⑦ 権威DNSサーバー → リゾルバ</span><span class="seq-arrow">→</span><span class="seq-status seq-ok">「93.184.216.34だよ」</span></div>
          <div class="seq-row"><span class="seq-step">⑧ リゾルバ → クライアント</span><span class="seq-arrow">→</span><span class="seq-status seq-ok">最終回答（＋結果をキャッシュに保存）</span></div>
        `
      },
      { who: "rabbit", img: "rabbitThink", text: "ルートサーバーとかTLDサーバーって、誰が管理しているんですか？" },
      { who: "cat", img: "cat", text: "<strong>ICANN</strong>という国際的な非営利組織が、世界のドメイン名やIPアドレスの割り当て全体を調整しているんだ。実務的な管理は、その傘下の<strong>IANA</strong>という機関が担当しているよ。" },
      { who: "rabbit", img: "rabbitThink", text: "普段パソコンで<strong>nslookup</strong>や<strong>dig</strong>というコマンドを打つと、それが見られるんですよね？" },
      { who: "cat", img: "cat", text: "そうそう！ブラウザも裏側で必ず同じことをしているんだ。このステージでは「問い合わせる」ボタンを押して、実際にDNSサーバーから答えが返ってくる様子を見てみよう。" }
    ],
    explainTitle: "DNSは「電話帳」",
    explainBody: `
      <p>私たちが普段入力する「www.example.com」のようなドメイン名は、コンピューターにとっては直接の宛先になりません。通信には<b>IPアドレス</b>が必要です。<b>DNS（Domain Name System）</b>は、ドメイン名を対応するIPアドレスに変換してくれる仕組みで、よく「インターネットの電話帳」と例えられます。OSI参照モデルでは、アプリケーションが使うプロトコルなので<b>L7 アプリケーション層</b>に分類され、通常<b>UDP/TCPの53番ポート</b>を使います（小さな応答はUDP、ゾーン転送など大きなデータはTCP）。</p>
      <p>DNSの問い合わせには2種類の方式があります。</p>
      <ul class="explain-list">
        <li><b>再帰問い合わせ（Recursive Query）</b>：クライアントがキャッシュDNSサーバーに「答えが出るまで代わりに調べてきて」と依頼する方式。一般的なPC・スマホからの問い合わせはこちらです。</li>
        <li><b>反復問い合わせ（Iterative Query）</b>：キャッシュDNSサーバーが、ルートサーバーやTLDサーバーに「知っていれば教えて、知らなければ次に聞くべき場所を教えて」と順に尋ねていく方式。サーバー同士のやり取りはこちらです。</li>
      </ul>
      <p>実際には、あなたのPCは直接権威DNSサーバーに聞きに行くのではなく、まず<b>キャッシュDNSサーバー（正式には「フルサービスリゾルバ」または単に「フルリゾルバ」と呼びます）</b>に再帰問い合わせをします。プロバイダが用意しているものや、Google Public DNS（8.8.8.8）などの公開サービスがこれにあたります。フルサービスリゾルバは、答えを知らなければ次の3種類のサーバーに順番に反復問い合わせを行い、最終的な答えを調べて結果をクライアントに返します。</p>
      <ul class="explain-list">
        <li><b>ルートサーバー</b>：DNSの階層構造の頂点にあり、「.com」「.jp」などTLD（トップレベルドメイン）ごとの担当（TLDサーバー）がどこにあるかを案内します。世界に13系統（a〜m.root-servers.net）あり、実際にはそれぞれ<b>エニーキャスト</b>という技術で世界中に数百台規模で分散配置され、可用性を高めています。</li>
        <li><b>TLDサーバー</b>：「.com」「.jp」など特定のTLDを管理し、そのTLD配下の各ドメイン（example.comなど）を管理する権威DNSサーバーの場所を案内します。</li>
        <li><b>権威DNSサーバー</b>：特定のドメイン（example.comなど）について、実際のAレコードなどのレコードを管理・保持している、いわば「本人」にあたるサーバーです。</li>
      </ul>
      <p>実際の問い合わせの道順は、次のような流れになります（www.example.comを調べる例）。</p>
      <div class="seq-row"><span class="seq-step">① クライアント → フルサービスリゾルバ</span><span class="seq-arrow">→</span><span class="seq-status seq-wait">「www.example.comのIPは？」</span></div>
      <div class="seq-row"><span class="seq-step">② リゾルバ → ルートサーバー</span><span class="seq-arrow">→</span><span class="seq-status seq-wait">「.comの担当は？」</span></div>
      <div class="seq-row"><span class="seq-step">③ ルートサーバー → リゾルバ</span><span class="seq-arrow">→</span><span class="seq-status seq-ok">「.comのTLDサーバーはここ」</span></div>
      <div class="seq-row"><span class="seq-step">④ リゾルバ → TLDサーバー</span><span class="seq-arrow">→</span><span class="seq-status seq-wait">「example.comの担当は？」</span></div>
      <div class="seq-row"><span class="seq-step">⑤ TLDサーバー → リゾルバ</span><span class="seq-arrow">→</span><span class="seq-status seq-ok">「example.comの権威サーバーはここ」</span></div>
      <div class="seq-row"><span class="seq-step">⑥ リゾルバ → 権威DNSサーバー</span><span class="seq-arrow">→</span><span class="seq-status seq-wait">「www.example.comのIPは？」</span></div>
      <div class="seq-row"><span class="seq-step">⑦ 権威DNSサーバー → リゾルバ</span><span class="seq-arrow">→</span><span class="seq-status seq-ok">「93.184.216.34だよ」</span></div>
      <div class="seq-row"><span class="seq-step">⑧ リゾルバ → クライアント</span><span class="seq-arrow">→</span><span class="seq-status seq-ok">最終回答（＋結果をキャッシュに保存）</span></div>
      <p>この階層全体の頂点（ルートゾーン）や、ドメイン名・IPアドレスといったインターネットの識別子資源は、<b>ICANN（Internet Corporation for Assigned Names and Numbers）</b>という国際的な非営利組織が調整しています。実務的なルートゾーンの管理やIPアドレスの割り当ては、その傘下にある<b>IANA（Internet Assigned Numbers Authority）</b>という機関が担っており、実際に「.jp」を管理するJPRSのような各TLDの登録管理団体（レジストリ）に運用が委任される仕組みになっています。</p>
      <p>DNSが返す情報にはいくつかの<b>レコードタイプ</b>があります。</p>
      <table class="rule-table">
        <thead><tr><th>レコード</th><th>内容</th></tr></thead>
        <tbody>
          <tr><td>A</td><td>ドメイン名に対応する IPv4 アドレス</td></tr>
          <tr><td>AAAA</td><td>ドメイン名に対応する IPv6 アドレス</td></tr>
          <tr><td>CNAME</td><td>別のドメイン名への別名（エイリアス）</td></tr>
          <tr><td>MX</td><td>そのドメイン宛てメールを受け取るメールサーバー</td></tr>
          <tr><td>NS</td><td>そのドメインを管理する権威DNSサーバー</td></tr>
          <tr><td>TXT</td><td>任意のテキスト情報（送信ドメイン認証SPFなどに利用）</td></tr>
          <tr><td>PTR</td><td>IPアドレスからドメイン名を調べる逆引き用</td></tr>
          <tr><td>SOA</td><td>ゾーンの管理情報（シリアル番号やTTLの既定値など）</td></tr>
        </tbody>
      </table>
      <p>また、一度調べた結果は<b>キャッシュ</b>として一定時間（<b>TTL: Time To Live</b>）保存されるため、同じサイトに何度もアクセスしても毎回DNSサーバーに問い合わせる必要はありません。TTLが切れると、再度最新の情報を問い合わせ直します。</p>
      <p>セキュリティ面では、応答を偽造されて悪意あるサイトに誘導される<b>DNSキャッシュポイズニング</b>という攻撃が知られており、対策として応答にデジタル署名を付けて改ざんを検知する<b>DNSSEC</b>があります。また近年は、通信内容を暗号化して盗聴や改ざんを防ぐ<b>DoH（DNS over HTTPS）</b>や<b>DoT（DNS over TLS）</b>の利用も広がっています。</p>
    `
  },
  {
    title: "HTTP通信の中身",
    icon: "📄",
    layer: "L7 アプリケーション層",
    sub: "リクエストとレスポンスの中身を理解しよう",
    render: renderHttpStage,
    dialogue: [
      { who: "rabbit", img: "rabbit", text: "IPアドレスも分かって、接続もできるようになりました！あとはページの中身をもらうだけですよね？" },
      { who: "cat", img: "cat", text: "そうだね。実際にWebページをやり取りするときに使われるのが<strong>HTTP</strong>だよ。クライアントが「リクエスト」を送って、サーバーが「レスポンス」を返す、というシンプルな仕組みなんだ。飲食店の注文みたいなものだよ。お客さんが「これをください」と注文（リクエスト）して、お店が料理（レスポンス）を返す。" },
      {
        type: "diagram",
        html: `
          <div class="flow-row">
            <div class="node"><span class="node-icon">🖥️</span>クライアント</div>
            <div class="flow-arrow"><span class="flow-label">GET /page.html</span><span class="flow-arrow-line">→</span></div>
            <div class="node"><span class="node-icon">🗄️</span>サーバー</div>
          </div>
          <div class="flow-row">
            <div class="node"><span class="node-icon">🖥️</span>クライアント</div>
            <div class="flow-arrow"><span class="flow-label">200 OK ＋ HTML</span><span class="flow-arrow-line">←</span></div>
            <div class="node"><span class="node-icon">🗄️</span>サーバー</div>
          </div>
        `
      },
      { who: "rabbit", img: "rabbitThink", text: "「注文（リクエスト）」にも種類があるんですか？" },
      { who: "cat", img: "catThink", text: "うん。「取得したい」「送信したい」「削除したい」など、やりたいことによって<strong>HTTPメソッド</strong>を使い分けるんだ。そしてサーバーからの返事にも「成功」「エラー」などを表す<strong>ステータスコード</strong>が付いてくるよ。" },
      { who: "rabbit", img: "rabbit", text: "普段何気なく見ている『404』とかも、そのステータスコードなんですね。やってみます！" }
    ],
    explainTitle: "HTTPは「リクエストとレスポンス」の会話",
    explainBody: `
      <p><b>HTTP（HyperText Transfer Protocol）</b>は、クライアントが<b>リクエスト</b>を送り、サーバーが<b>レスポンス</b>を返す、というシンプルな1往復のやり取りを基本とするプロトコルです。OSI参照モデルでは<b>L7 アプリケーション層</b>に属し、通常はTCPの80番（HTTP）または443番（HTTPS）を使います。</p>
      <p>リクエストは、大きく3つの要素からなります。</p>
      <ul class="explain-list">
        <li><b>リクエストライン</b>：「GET /index.html HTTP/1.1」のように、メソッド・パス・バージョンを示す1行</li>
        <li><b>ヘッダー</b>：Host（宛先ドメイン）、User-Agent（ブラウザの種類）、Cookie（セッション情報）など、付加情報のキーと値の一覧</li>
        <li><b>ボディ</b>：POSTで送信するフォームの内容など、本体データ（GETでは通常空）</li>
      </ul>
      <p>代表的な<b>HTTPメソッド</b>は次のとおりです。</p>
      <table class="rule-table">
        <thead><tr><th>メソッド</th><th>用途</th></tr></thead>
        <tbody>
          <tr><td>GET</td><td>リソースの取得（データを変更しない）</td></tr>
          <tr><td>POST</td><td>新しいリソースの作成、フォーム送信</td></tr>
          <tr><td>PUT</td><td>リソースの内容を丸ごと置き換え</td></tr>
          <tr><td>PATCH</td><td>リソースの一部だけを更新</td></tr>
          <tr><td>DELETE</td><td>リソースの削除</td></tr>
        </tbody>
      </table>
      <p><b>ステータスコード</b>は3桁の数字で、先頭の桁によっておおまかな意味が決まっています。</p>
      <table class="rule-table">
        <thead><tr><th>範囲</th><th>意味</th><th>代表例</th></tr></thead>
        <tbody>
          <tr><td>1xx</td><td>情報（処理継続中）</td><td>100 Continue</td></tr>
          <tr><td>2xx</td><td>成功</td><td>200 OK</td></tr>
          <tr><td>3xx</td><td>リダイレクト（転送）</td><td>301 Moved Permanently</td></tr>
          <tr><td>4xx</td><td>クライアント側のエラー</td><td>400 Bad Request・401 Unauthorized・403 Forbidden・404 Not Found</td></tr>
          <tr><td>5xx</td><td>サーバー側のエラー</td><td>500 Internal Server Error・503 Service Unavailable</td></tr>
        </tbody>
      </table>
      <p>HTTPはそれ自体では「前回のやり取りを覚えていない」<b>ステートレス</b>なプロトコルです。ログイン状態などを維持するために、サーバーが発行した識別子をブラウザが<b>Cookie</b>として保存し、以後のリクエストに自動的に添付することで「継続したやり取り（セッション）」を実現しています。</p>
      <p>バージョンによる違いもあります。<b>HTTP/1.1</b>は基本的に1つの接続で1つずつ順番にやり取りしますが、<b>HTTP/2</b>は1本のTCP接続上で複数のリクエストを並行して処理する<b>多重化</b>に対応し、<b>HTTP/3</b>はTCPの代わりに<b>QUIC（UDPベースの新しいトランスポート）</b>を使うことで、パケットロス時の影響をさらに減らし高速化しています。</p>
    `
  },
  {
    title: "TLS/HTTPSの暗号化",
    icon: "🔒",
    layer: "L6付近（TLS）",
    sub: "通信を暗号化する手順を体験しよう",
    render: renderTlsStage,
    dialogue: [
      { who: "cat", img: "cat", text: "ここまでのHTTP通信、実はそのままだと内容が丸見えなんだ。盗聴や改ざんを防ぐために使われるのが<strong>TLS</strong>だよ。HTTPにTLSを組み合わせたものが<strong>HTTPS</strong>なんだ。" },
      { who: "rabbit", img: "rabbit", text: "鍵をかけるってことですか？でも、鍵ってどうやって安全に渡すんですか……？渡す途中で盗み見られちゃいそうです。" },
      { who: "cat", img: "catThink", text: "鋭い！そこがTLSの工夫どころなんだ。<strong>公開鍵暗号</strong>は「誰でも閉められるけど、開けられるのは持ち主だけ」の南京錠のようなものだと思って。サーバーが配る南京錠（公開鍵）でクライアントが荷物を施錠して送れば、対応する鍵（秘密鍵）を持つサーバーしか開けられないんだ。" },
      {
        type: "diagram",
        html: `
          <div class="flow-row">
            <div class="node"><span class="node-icon">🖥️</span>クライアント</div>
            <div class="flow-arrow"><span class="flow-label">🔓 公開鍵（南京錠）を受け取る</span><span class="flow-arrow-line">←</span></div>
            <div class="node"><span class="node-icon">🗄️</span>サーバー</div>
          </div>
          <div class="flow-row">
            <div class="node"><span class="node-icon">🖥️</span>クライアント</div>
            <div class="flow-arrow"><span class="flow-label">🔒 公開鍵で施錠して送る</span><span class="flow-arrow-line">→</span></div>
            <div class="node"><span class="node-icon">🗄️</span>サーバー（秘密鍵で開錠）</div>
          </div>
          <div class="flow-note">以降は🔑共通鍵を使い、高速に暗号化通信を行う</div>
        `
      },
      { who: "cat", img: "cat", text: "こうして「これから使う共通の鍵」を、途中で盗み見られても安全な方法で受け渡せるんだ。" },
      { who: "rabbit", img: "rabbitThink", text: "なるほど、公開鍵を使って共通の鍵を安全に渡すんですね。ところで、サーバーが本物かどうかは、どうやって確認するんですか？" },
      { who: "cat", img: "cat", text: "いいところに気づいたね。<strong>証明書</strong>を使ってサーバーの身元を確認するんだ。ここまでの一連のやり取りをまとめて<strong>TLSハンドシェイク</strong>と呼ぶよ。実際に手順を組み立てて体験してみよう。" }
    ],
    explainTitle: "TLSは「安全に鍵を渡す」仕組み",
    explainBody: `
      <p><b>TLS（Transport Layer Security）</b>は、通信の<b>暗号化</b>・<b>改ざん検知</b>・<b>相手の認証</b>を提供する仕組みです。OSI参照モデルの層に厳密には対応しませんが、慣習的にプレゼンテーション層（L6）やセッション層（L5）に近い働きをすると説明されることが多い機能です。HTTPにTLSを組み合わせたものが<b>HTTPS</b>で、TCPの443番ポートを使います。</p>
      <p>暗号化の方式には大きく2種類あります。</p>
      <ul class="explain-list">
        <li><b>共通鍵暗号（対称鍵暗号）</b>：暗号化と復号に同じ鍵を使う方式。処理が高速だが、鍵そのものを安全に相手に渡す方法が課題になる</li>
        <li><b>公開鍵暗号（非対称鍵暗号）</b>：暗号化用の「公開鍵」と復号用の「秘密鍵」がペアになっている方式。公開鍵は誰に知られてもよいが、処理が共通鍵より重い</li>
      </ul>
      <p>TLSはこの2つを組み合わせた<b>ハイブリッド方式</b>です。まず公開鍵暗号を使って、これから使う共通鍵のもとになる情報を安全に交換し、そのあとの実際のデータのやり取りは高速な共通鍵暗号で行います。</p>
      <p>TLSハンドシェイクの主な流れは次のとおりです。</p>
      <ol class="explain-list">
        <li><b>ClientHello</b>：クライアントが対応する暗号方式の候補や乱数を送る</li>
        <li><b>ServerHello＋証明書</b>：サーバーが使用する暗号方式を決定し、自分の身元を証明する<b>デジタル証明書</b>を送る</li>
        <li><b>鍵交換</b>：証明書の検証後、共通鍵のもとになる情報を安全に交換する</li>
        <li><b>Finished</b>：ここまでの内容に問題がなければ、以降の通信を共通鍵で暗号化して開始する</li>
      </ol>
      <p>サーバー証明書は、<b>認証局（CA: Certificate Authority）</b>と呼ばれる信頼できる第三者機関が発行・署名しており、ブラウザはこの署名を検証することで「本当にそのドメインの持ち主が発行したサーバーか」を確認します。証明書の有効期限が切れていたり、ドメインと証明書の情報が一致しなかったりすると、ブラウザは警告を表示します。また、1つのIPアドレスで複数のドメインのHTTPS証明書を使い分けるために、ハンドシェイクの最初にアクセス先のドメイン名を伝える<b>SNI（Server Name Indication）</b>という仕組みも使われています。</p>
    `
  },
  {
    title: "スイッチング・VLAN",
    icon: "🔀",
    layer: "L2 データリンク層",
    sub: "同じネットワーク内の転送と、その分割方法を学ぼう",
    render: renderVlanStage,
    dialogue: [
      { who: "rabbit", img: "rabbit", text: "IPアドレスで宛先が分かっても、同じ社内ネットワークの中では、最後どうやって相手のパソコンまで届けるんですか？" },
      { who: "cat", img: "cat", text: "そこで活躍するのが<strong>スイッチ</strong>だよ。同じネットワーク内では、IPアドレスではなく<strong>MACアドレス</strong>という機器固有の番号を使って転送するんだ。" },
      { who: "rabbit", img: "rabbitThink", text: "スイッチは、どの機器がどこにつながっているか、覚えているんですか？" },
      { who: "cat", img: "catThink", text: "そう、<strong>MACアドレステーブル</strong>という表に学習していくんだ。もし宛先が分からなければ、とりあえず全部のポートに送ってみる<strong>フラッディング</strong>という動作をするよ。" },
      { who: "rabbit", img: "rabbit", text: "1台のスイッチを部署ごとに分けたいときは、どうするんですか？" },
      { who: "cat", img: "cat", text: "そこで使うのが<strong>VLAN</strong>だよ。マンションを思い浮かべてみて。建物（スイッチ）は1つでも、部屋（VLAN）ごとに独立していて、隣の部屋の物音は基本聞こえないよね。VLANも同じで、物理的には同じスイッチでも、論理的に別のネットワークとして分割できるんだ。" },
      {
        type: "diagram",
        html: `
          <div class="vlan-switch">
            <div class="vlan-title">1台のスイッチ（マンション）</div>
            <div class="vlan-ports">
              <div class="vlan-port vlan-a">Port1<br>VLAN10（営業部）</div>
              <div class="vlan-port vlan-a">Port2<br>VLAN10（営業部）</div>
              <div class="vlan-port vlan-b">Port3<br>VLAN20（開発部）</div>
              <div class="vlan-port vlan-b">Port4<br>VLAN20（開発部）</div>
            </div>
          </div>
          <div class="flow-note">VLAN10とVLAN20は、同じスイッチ上でも別ネットワークとして扱われる</div>
        `
      },
      { who: "rabbit", img: "rabbitThink", text: "部屋（VLAN）が違うと、ブロードキャストみたいな「全員に届ける」通信も届かないんですね。" },
      { who: "cat", img: "cat", text: "そういうこと！実際にクイズで確認してみよう。" }
    ],
    explainTitle: "スイッチは「MACアドレスの配達係」",
    explainBody: `
      <p>同じネットワーク（同一セグメント）内でデータを実際に届ける役割は、OSI参照モデルの<b>L2 データリンク層</b>が担当し、主に<b>スイッチ</b>という機器が働きます。ルーターがIPアドレスを見て別のネットワークへの経路を決めるのに対し、スイッチは<b>MACアドレス</b>（機器のネットワークインターフェースに割り当てられた固有の番号）を見て、同じネットワーク内での転送先ポートを決めます。</p>
      <p>スイッチは、受信したフレームの<b>送信元MACアドレス</b>と、それがどのポートから届いたかを<b>MACアドレステーブル</b>に学習していきます。宛先MACアドレスがこの表に見つかれば、該当するポートだけにフレームを転送できます。まだ学習していない宛先の場合は、学習済みのポート以外の全ポートにフレームを送る<b>フラッディング</b>という動作を行い、応答が返ってきた際にその宛先を学習します。</p>
      <p>用語の整理として、あるケーブル1本の区間で信号の衝突が起こりうる範囲を<b>コリジョンドメイン</b>、ブロードキャスト（宛先を全員にした通信）が届く範囲を<b>ブロードキャストドメイン</b>と呼びます。スイッチはポートごとにコリジョンドメインを分割しますが、ブロードキャストドメインは基本的に1つのままです。</p>
      <p>このブロードキャストドメインを、物理的な配線を変えずに論理的に分割する技術が<b>VLAN（Virtual LAN）</b>です。例えば「営業部」「開発部」を同じスイッチにつなぎながら、VLANで分けることで、部署間の不要な通信を防ぎセキュリティを高めたり、ブロードキャストの影響範囲を狭めて無駄な通信を減らしたりできます。複数のVLANのフレームを1本のケーブルでスイッチ間にまとめて送りたい場合は、フレームに所属VLANを示すタグを付ける<b>802.1Q</b>という規格を使い、そのようなポートを<b>トランクポート</b>と呼びます（対して、特定の1つのVLANのみに属する通常のポートは<b>アクセスポート</b>と呼ばれます）。</p>
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
      <p>データは実際には<b>パケット（IPパケット）</b>という小さな単位に分割されて送られます。パケットの先頭には「宛先IPアドレス」「送信元IPアドレス」「TTL（生存時間）」などが書かれた<b>ヘッダー</b>が付いており、ルーターはこのヘッダーの宛先IPアドレスだけを見て、次にどこへ転送すべきかを判断します。<b>TTL</b>はパケットが経由できるルーターの最大数を制限するフィールドで、ルーターを1つ通過するごとに1減り、0になると破棄されます。これにより、経路の誤り等でパケットが永遠にループし続けることを防いでいます。</p>
      <p>各ルーターは「このIPアドレス範囲（サブネット）宛てなら次はこちら」という<b>ルーティングテーブル</b>を持っています。宛先が自分の知っている範囲になければ、<b>デフォルトゲートウェイ</b>（「分からなければとりあえずここへ」という転送先）に投げることで、最終的にどこかのルーターが正しい経路にたどり着けるようになっています。この判断の連鎖（ホップ）によって、パケットは最終的に正しいサーバーへ届きます。</p>
      <p>ルーティングテーブルの作り方には大きく2種類あります。</p>
      <ul class="explain-list">
        <li><b>スタティックルーティング（静的）</b>：管理者が手動で経路を設定する方式。小規模で経路数が少ないネットワーク向き。</li>
        <li><b>ダイナミックルーティング（動的）</b>：ルーター同士がルーティングプロトコルで経路情報を自動的に交換し合う方式。代表例として、組織内向けの<b>OSPF</b>、古くからある<b>RIP</b>、インターネット全体の経路交換に使われる<b>BGP</b>があります。</li>
      </ul>
      <p>また、宛先IPアドレスの範囲（サブネット）は<b>CIDR（Classless Inter-Domain Routing）表記</b>で表されます。「192.168.10.0/24」の「/24」は、先頭32ビット中24ビットがネットワーク部（サブネットを識別する部分）であることを意味し、残り8ビット（2の8乗＝256個、実際に割り当てられるホストはネットワークアドレスとブロードキャストアドレスを除いた254個）がそのサブネット内の機器（ホスト）を識別するために使えます。数字が大きいほど、そのサブネットの範囲は狭くなります。</p>
      <p>なお、宛先IPアドレスが分かっても、同一ネットワーク内で実際にデータを届けるには相手の<b>MACアドレス（L2）</b>が必要です。この「IPアドレスからMACアドレスを調べる」処理を行うのが<b>ARP（Address Resolution Protocol）</b>です。また、自宅や社内LANでよく使われるプライベートIPアドレスをインターネット上のグローバルIPアドレスに変換する<b>NAT（Network Address Translation）</b>という仕組みも、多くのルーターが持っています。</p>
    `
  },
  {
    title: "TCPハンドシェイク",
    icon: "🤝",
    layer: "L4 トランスポート層",
    sub: "接続の確立と終了の正しい手順を体験しよう",
    render: renderHandshakeStage,
    dialogue: [
      { who: "cat", img: "cat", text: "次は、通信を始める前の「あいさつ」と、終わるときの「お別れの挨拶」の話だよ。TCPで通信するときは、いきなりデータを送らずに<strong>3ウェイハンドシェイク</strong>という手順を踏むんだ。" },
      { who: "rabbit", img: "rabbit", text: "あいさつ……？いきなり話しかけちゃダメなんですか？" },
      { who: "cat", img: "catThink", text: "ダメというか非効率なんだ。相手が本当に応答できる状態か確認せずに送ると、届かなかったときに困るだろ？だから<strong>SYN→SYN/ACK→ACK</strong>の3回のやり取りで、お互いに「準備OK」を確認し合うんだよ。" },
      { who: "rabbit", img: "rabbitThink", text: "電話で「もしもし」「はい、聞こえてます」「じゃあ話します」ってやるのと似てますね。終わるときも何かあるんですか？" },
      { who: "cat", img: "cat", text: "いいところに気づいたね。終了時は双方から切断を伝え合う<strong>4ウェイハンドシェイク</strong>を行うんだ。まずは確立、次に終了の順番を、実際にボタンを押して組み立ててみよう。" }
    ],
    explainTitle: "接続はいきなり始まらない、いきなり終わらない",
    explainBody: `
      <p>ポート番号やこのハンドシェイクの仕組みは、OSI参照モデルの<b>L4 トランスポート層</b>が担当します。この層には主に2つのプロトコルがあります。</p>
      <ul class="explain-list">
        <li><b>TCP（Transmission Control Protocol）</b>：接続を確立し、届いたかどうかを確認しながら送る「信頼性重視」のプロトコル。Web閲覧やファイル転送など、データが欠けると困る通信で使われます。</li>
        <li><b>UDP（User Datagram Protocol）</b>：接続確立や確認応答を省略し、とにかく速く送る「速度重視」のプロトコル。動画配信やオンラインゲームなど、多少の欠損より速さが大事な通信で使われます。</li>
      </ul>
      <p>TCPのヘッダーには、通信の状態を制御するための<b>フラグ（コントロールビット）</b>があります。代表的なものは次のとおりです。</p>
      <table class="rule-table">
        <thead><tr><th>フラグ</th><th>意味</th></tr></thead>
        <tbody>
          <tr><td>SYN</td><td>接続の開始（同期）を要求する</td></tr>
          <tr><td>ACK</td><td>受け取ったデータ・要求への確認応答</td></tr>
          <tr><td>FIN</td><td>正常な手順での接続終了を要求する</td></tr>
          <tr><td>RST</td><td>異常時などに接続を強制的に切断する</td></tr>
          <tr><td>PSH</td><td>バッファに溜めず、すぐ上位層にデータを渡すよう指示</td></tr>
          <tr><td>URG</td><td>緊急に処理すべきデータであることを示す</td></tr>
        </tbody>
      </table>
      <p>Webサイトを見るときなど、多くの通信はTCPを使いますが、データを送る前に必ず接続を確立する手順を踏みます。それが<b>3ウェイハンドシェイク</b>です。</p>
      <ol class="explain-list">
        <li>クライアントが <b>SYN</b>（接続要求。同時にランダムな初期シーケンス番号を伝える）を送る</li>
        <li>サーバーが <b>SYN/ACK</b>（要求の承認＋自分からも接続要求）を返す</li>
        <li>クライアントが <b>ACK</b>（応答の確認）を送り、接続が確立する</li>
      </ol>
      <p>ここで交換される<b>シーケンス番号</b>は、その後のデータ送信で「どこまで届いたか」を管理するために使われ、次のステージで学ぶ再送の仕組みにもつながっています。</p>
      <p>通信が終わるときは、逆に接続を閉じる手順を踏みます。TCPの接続は双方向（クライアント→サーバー、サーバー→クライアント）に独立しているため、それぞれを個別に終了させる必要があり、合計4回のやり取りになる<b>4ウェイハンドシェイク</b>が行われます。</p>
      <ol class="explain-list">
        <li>クライアントが <b>FIN</b>（切断要求）を送る</li>
        <li>サーバーが <b>ACK</b>（切断要求の確認）を返す</li>
        <li>サーバーも送信が終わったら <b>FIN</b>（切断要求）を送る</li>
        <li>クライアントが <b>ACK</b>（最終確認）を送り、接続が終了する</li>
      </ol>
      <p>なお、接続を確立している間、TCPは自身が今どのような状態にあるかを管理しています。主な状態には、接続要求を待つ<b>LISTEN</b>、SYNを送って応答待ちの<b>SYN_SENT</b>、接続が確立している<b>ESTABLISHED</b>、相手からのFINを待つ<b>FIN_WAIT</b>、切断後に念のため一定時間待機する<b>TIME_WAIT</b>などがあります。</p>
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
      <p>代表的なウェルノウンポートをもう少し紹介します。</p>
      <table class="rule-table">
        <thead><tr><th>ポート</th><th>プロトコル</th><th>用途</th></tr></thead>
        <tbody>
          <tr><td>20 / 21</td><td>FTP</td><td>ファイル転送（データ用／制御用）</td></tr>
          <tr><td>22</td><td>SSH</td><td>暗号化されたリモートログイン</td></tr>
          <tr><td>23</td><td>Telnet</td><td>暗号化なしのリモートログイン（現在は非推奨）</td></tr>
          <tr><td>25</td><td>SMTP</td><td>メールの送信</td></tr>
          <tr><td>53</td><td>DNS</td><td>名前解決</td></tr>
          <tr><td>67 / 68</td><td>DHCP</td><td>IPアドレスの自動割り当て</td></tr>
          <tr><td>80</td><td>HTTP</td><td>暗号化なしのWeb通信</td></tr>
          <tr><td>110</td><td>POP3</td><td>メールの受信（サーバーからダウンロード）</td></tr>
          <tr><td>143</td><td>IMAP</td><td>メールの受信（サーバー上で管理）</td></tr>
          <tr><td>443</td><td>HTTPS</td><td>暗号化されたWeb通信</td></tr>
          <tr><td>3389</td><td>RDP</td><td>Windowsのリモートデスクトップ接続</td></tr>
        </tbody>
      </table>
      <p>家庭や社内のルーターは通常<b>NAT（Network Address Translation）</b>によって、内部の複数の機器で1つのグローバルIPアドレスを共有しています。外部からサーバーへの通信を内部の特定機器・ポートへ振り分けたい場合は、<b>ポートフォワーディング（ポート開放）</b>という設定で「外部からこのポート宛ての通信は、内部のこの機器のこのポートへ転送する」というルールを追加します。</p>
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
      { who: "cat", img: "catThink", text: "普通ならそうなんだけど、TCPには保険がかかっているんだ。書留郵便をイメージしてみて。相手に届くと「受け取りました」という控え（ACK）が返ってくる。もし一定時間内にその控えが返ってこなければ、「届かなかった」と判断して自動的に<strong>再送</strong>してくれるんだ。" },
      {
        type: "diagram",
        html: `
          <div class="seq-row"><span class="seq-step">① データを送信</span><span class="seq-arrow">→</span><span class="seq-status seq-lost">✕ 途中でロス</span></div>
          <div class="seq-row"><span class="seq-step">② ACKが返ってこない</span><span class="seq-arrow">→</span><span class="seq-status seq-wait">⏱ タイムアウト検出</span></div>
          <div class="seq-row"><span class="seq-step">③ 同じデータを再送</span><span class="seq-arrow">→</span><span class="seq-status seq-ok">✓ 今度は届いてACK</span></div>
        `
      },
      { who: "rabbit", img: "rabbit", text: "届くまで何度もリトライしてくれるから、多少ロスしても最終的にはちゃんと届くんですね。" },
      { who: "cat", img: "cat", text: "その通り！実際にロスを避けながら、届かなかったときは再送される様子を体験してみよう。" }
    ],
    explainTitle: "届かなければ、もう一度送る",
    explainBody: `
      <p>ネットワークでは、混雑や機器の障害によって一部のデータ（パケット）が失われる<b>パケットロス</b>が起こります。この「届いたことを保証する」信頼性の仕組みも、<b>L4 トランスポート層</b>のTCPが担当しています。</p>
      <p>TCPは送ったデータそれぞれに<b>シーケンス番号</b>を振り、受信側はどこまで受け取ったかを<b>ACK（確認応答）</b>として送り返します。送信側は、ACKが一定時間内（<b>タイムアウト</b>）に返ってこない場合、そのデータは失われたと判断して自動的に<b>再送</b>します。</p>
      <p>これにより、多少のロスが起きても最終的にはデータが正しく届く仕組みになっています（信頼性の高い通信）。一方で、動画配信などに使われる<b>UDP</b>にはこの再送の仕組みがなく、多少データが欠けても構わないので速度を優先する、という設計上のトレードオフになっています。</p>
      <p>再送を待つ時間（<b>RTO: Retransmission Timeout</b>）は固定ではなく、実際に観測した通信の往復時間（<b>RTT: Round Trip Time</b>）をもとに動的に調整されます。RTTが短い（応答が速い）ネットワークではRTOも短く、逆に不安定なネットワークではRTOを長めに取ることで、無駄な再送を減らしています。</p>
      <p>また、TCPは1つ送っては応答を待つ、という非効率なやり取りをしているわけではありません。受信側が一度に受け取れるデータ量を伝える<b>ウィンドウサイズ</b>の範囲内で、確認応答を待たずに複数のデータをまとめて送り出す<b>スライディングウィンドウ</b>という仕組みで効率化しています。</p>
      <p>さらに、ネットワークの混雑状況に応じて送信量を調整する<b>輻輳制御（ふくそうせいぎょ）</b>も行われます。代表的な流れとして、通信開始直後は送信量を少しずつ倍増させていく<b>スロースタート</b>、ロスが検知されるまで緩やかに増やし続ける<b>輻輳回避</b>、ロスを検知したら送信量を大きく絞る、という制御が行われ、ネットワーク全体が過負荷にならないよう配慮されています。</p>
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
      {
        type: "diagram",
        html: `
          <div class="flow-row">
            <div class="node"><span class="node-icon">📦</span>通信</div>
            <div class="flow-arrow"><span class="flow-arrow-line">→</span></div>
            <div class="node"><span class="node-icon">🧱</span>ファイアウォール<br>（ルール判定）</div>
          </div>
          <div class="flow-note">
            <span class="flow-outcome allow">✅ ルールに合致 → 許可</span>
            <span class="flow-outcome deny">🚫 ルールに合致しない → 拒否</span>
          </div>
        `
      },
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
      <p>例えば「Webの通信（TCP 80/443）とDNS（UDP 53）だけ許可し、それ以外はすべて拒否する」といったルールを設定することで、不要な通信や不正アクセスの経路を減らし、ネットワークを安全に保ちます。この許可・拒否のルール一覧は<b>ACL（Access Control List）</b>と呼ばれ、実際の機器では次のように上から順に評価されます。</p>
      <table class="rule-table">
        <thead><tr><th>順序</th><th>送信元</th><th>宛先ポート</th><th>動作</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>any（すべて）</td><td>TCP 80, 443</td><td class="allow">許可</td></tr>
          <tr><td>2</td><td>any（すべて）</td><td>UDP 53</td><td class="allow">許可</td></tr>
          <tr><td>3</td><td>any（すべて）</td><td>すべて</td><td class="deny">拒否（暗黙のdeny）</td></tr>
        </tbody>
      </table>
      <p>公開が必要なWebサーバーなどを、社内ネットワークからは隔離しつつインターネットにも直接晒さない緩衝地帯として、<b>DMZ（DeMilitarized Zone）</b>という区画を設けるのも一般的な設計です。万が一DMZ上のサーバーが侵害されても、社内ネットワークへの被害を最小限にとどめられます。</p>
      <p>ファイアウォールと似た用語に<b>IDS/IPS</b>があります。ファイアウォールが主にIPアドレスやポート番号のルールで通す／止めるを判断するのに対し、<b>IDS（不正侵入検知システム）</b>は通信の中身を分析して不審な兆候を検知・通知し、<b>IPS（不正侵入防止システム）</b>はさらに検知した通信を自動的に遮断するところまで行います。近年は、ポート番号だけでなくアプリケーション層（L7）の中身まで検査し、IPS的な機能も統合した<b>次世代ファイアウォール（NGFW）</b>も広く使われています。</p>
    `
  },
  {
    title: "配送ルート最終試験",
    icon: "🧩",
    layer: "総復習",
    sub: "学んだ順番で、データが通る道をたどろう",
    render: renderMazeStage,
    dialogue: [
      { who: "cat", img: "cat", text: "さあ、いよいよ最終試験だよ！ここまで学んだ知識を総動員して、データがクライアントからサーバーに届くまでの<strong>正しい道順</strong>を、迷路のようにたどってみよう。" },
      { who: "rabbit", img: "rabbit", text: "分かれ道がいっぱいありそうで緊張します……順番、ちゃんと覚えてるかな。" },
      { who: "cat", img: "catThink", text: "大丈夫、間違えても「行き止まり」に気づいたらすぐ引き返せるよ。DNSで住所を調べるところから始めて、最後はファイアウォールを通ってサーバーに到着するまで、正しい道を選んでいこう！" },
      { who: "rabbit", img: "rabbitThink", text: "よーし、やってみます！" }
    ],
    explainTitle: "データが通った道のり",
    explainBody: `
      <p>お疲れさま！最終試験で選んだ道が、まさに1つのHTTPS通信がたどる実際の道のりです。</p>
      <ol class="explain-list">
        <li><b>DNS解決（L7）</b>：ドメイン名をIPアドレスに変換する</li>
        <li><b>ルーティング（L3）</b>：ルーターを経由して宛先ネットワークまで転送経路を決める</li>
        <li><b>スイッチング（L2）</b>：同じネットワーク内ではMACアドレスで転送する</li>
        <li><b>TCPハンドシェイク（L4）</b>：3ウェイハンドシェイクで接続を確立する</li>
        <li><b>TLSハンドシェイク</b>：公開鍵で共通鍵を安全に渡し、暗号化通信を始める</li>
        <li><b>HTTPリクエスト送信（L7）</b>：正しいポート番号宛てにリクエストを送る</li>
        <li><b>ファイアウォール通過</b>：ルールに合致した通信だけが最終的にサーバーへ届く</li>
      </ol>
      <p>途中でパケットロスが起きても、TCPが自動的に再送してくれるおかげで、最終的にはきちんとサーバーまで届きます。この一連の流れを意識できれば、ネットワークのトラブルシューティングをするときにも「今どの段階で問題が起きているのか」を切り分けやすくなります。</p>
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
