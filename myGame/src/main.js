import kaplay from "kaplay";
import "kaplay/global"; // abilita le API globali (senza k.)

// FULLSCREEN CANVAS: prende tutta la finestra
const k = kaplay({
  width: window.innerWidth,
  height: window.innerHeight,
  letterbox: false,
  background: [0, 0, 0],
});

// resize -> aggiorna la dimensione del canvas quando cambi finestra
window.addEventListener("resize", () => {
  
  if (typeof setCanvasSize === "function") {
    setCanvasSize(window.innerWidth, window.innerHeight);
  } else if (k && typeof k.setCanvasSize === "function") {
    k.setCanvasSize(window.innerWidth, window.innerHeight);
  }
  
});

// --------------------
// AUDIO (BGM) - Gestione centralizzata
// --------------------
let bgmHandle = null;
let audioUnlocked = false;

/**
 * Sblocca l'audio (necessario su molti browser: serve un input utente).
 * La prima interazione (click o keypress) abilita e fa partire la musica.
 */
function unlockAudioIfNeeded() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  playBGM();
}

/**
 * Avvia la musica in loop (se non è già partita)
 */
function playBGM() {
  if (!audioUnlocked) return; // finché non c'è interazione utente, non partire
  if (bgmHandle) return; // evita doppioni

  bgmHandle = play("bgm", {
    loop: true,
    volume: 0.35,
  });
}

/**
 * Ferma la musica (utile se vuoi stopparla in alcune scene)
 */
function stopBGM() {
  if (!bgmHandle) return;
  bgmHandle.stop();
  bgmHandle = null;
}

/**
 * Cambia volume al volo (0..1)
 */
function setBGMVolume(v) {
  // in base alla versione, l'handle potrebbe avere .volume
  // se non esiste, puoi stoppare e ripartire con volume diverso.
  if (bgmHandle && typeof bgmHandle.volume !== "undefined") {
    bgmHandle.volume = v;
  } else if (bgmHandle) {
    // fallback: riavvia con volume nuovo
    stopBGM();
    bgmHandle = play("bgm", { loop: true, volume: v });
  }
}

// Sblocco audio con la prima interazione
onMousePress(() => unlockAudioIfNeeded());
onKeyPress(() => unlockAudioIfNeeded());

// --------------------
// ASSET
// --------------------
loadRoot("./");

loadSprite("char1", "sprites/bag-o.png");
loadSprite("char2", "sprites/burpman-o.png");
loadSprite("char3", "sprites/bobo-o.png");
loadSprite("char4", "sprites/flowy-o.png");
loadSprite("char5", "sprites/discord-o.png");

// background
loadSprite("bg", "backgrounds/tappeto.jpg");

// ✅ antodactilo che deve piovere
loadSprite("antodactilo", "sprites/antodactilo.png");

// musica
loadSound("bgm", "audio/BeepBox-Song5.mp3");

// personaggi + nome sotto
const characters = [
  { id: "char1", name: "Fransauro" },
  { id: "char2", name: "Muscolandro" },
  { id: "char3", name: "Frullavide" },
  { id: "char4", name: "Piangiorgio" },
  { id: "char5", name: "Paolord" },
];

let selectedChar = "char1";
let score = 0;

// --------------------
// SCENE: SELECT
// --------------------
scene("select", () => {
  const W = width();
  const H = height();

  // Titolo in alto
  add([
    text("SCEGLI IL TUO PERSONAGGIO", { size: Math.max(28, Math.floor(W / 24)) }),
    pos(W / 2, Math.max(60, Math.floor(H * 0.12))),
    anchor("center"),
  ]);

  const hint = add([
    text("Clicca un personaggio (SPACE per iniziare)", {
      size: Math.max(16, Math.floor(W / 60)),
    }),
    pos(W / 2, Math.max(110, Math.floor(H * 0.2))),
    anchor("center"),
    opacity(0.8),
  ]);

  // riga personaggi in basso
  const yRow = H - Math.max(150, Math.floor(H * 0.22));
  const spacing = Math.min(180, Math.floor(W / 6));
  const startX = W / 2 - ((characters.length - 1) * spacing) / 2;

  let selectedFrame = null;

  function highlight(targetPos, name, id) {
    selectedChar = id;

    if (selectedFrame) selectedFrame.destroy();

    selectedFrame = add([
      rect(110, 110),
      pos(targetPos),
      anchor("center"),
      outline(4),
      opacity(0.35),
    ]);

    hint.text = `Selezionato: ${name} (SPACE o click per iniziare)`;
  }

  characters.forEach((c, i) => {
    const x = startX + i * spacing;

    const card = add([
      pos(x, yRow),
      anchor("center"),
      area({ shape: new Rect(vec2(0), 130, 150) }),
    ]);

    const spr = card.add([
      sprite(c.id),
      scale(Math.max(1.6, Math.min(2.4, W / 450))),
      anchor("center"),
    ]);

    card.add([
      text(c.name, { size: Math.max(14, Math.floor(W / 75)) }),
      pos(0, 80),
      anchor("center"),
      opacity(0.9),
    ]);

    card.onHover(() => {
      spr.scale = spr.scale.add(vec2(0.12));
      setCursor("pointer");
    });

    card.onHoverEnd(() => {
      spr.scale = spr.scale.sub(vec2(0.12));
      setCursor("default");
    });

    card.onClick(() => {
      // se l'audio non è ancora sbloccato, lo sblocchiamo qui
      unlockAudioIfNeeded();

      if (selectedChar === c.id) {
        go("game", { selectedChar });
      } else {
        highlight(card.pos, c.name, c.id);
      }
    });

    if (c.id === selectedChar) {
      highlight(card.pos, c.name, c.id);
    }
  });

<<<<<<< HEAD
  // avvio con SPACE
  onKeyPress("space", () => go("game", { selectedChar }));
=======
  // Avvio con SPACE
  onKeyPress("space", () => {
    unlockAudioIfNeeded();
    go("game", { selectedChar });
  });
>>>>>>> cff7386 (musica e antodattilo)

  // tasto F per fullscreen 
  onKeyPress("f", () => {
    if (typeof fullscreen === "function") fullscreen();
  });

  // (opzionale) controllo volume con tasti - e =
  onKeyPress("-", () => setBGMVolume(0.15));
  onKeyPress("=", () => setBGMVolume(0.35));
});

// --------------------
// SCENE: GAME
// --------------------
scene("game", (data) => {
  score = 0;

  // avvia la musica anche se la vuoi solo in game
  playBGM();

  // gravità
  setGravity(1600);

  // player (sprite selezionato)
  const player = add([
    pos(80, 40),
    sprite(data.selectedChar),
    area(),
    body(),
  ]);

  // background
  function addBackground() {
    const bg = add([
      sprite("bg"),
      pos(0, 0),
      fixed(),
      z(-20), // più indietro della pioggia
    ]);

    const s = Math.max(width() / bg.width, height() / bg.height);
    bg.scale = vec2(s);
    return bg;
  }

  addBackground();

  // --------------------
  // 🌧️ PIOGGIA DI ANTODACTILI (BACKGROUND)
  // --------------------
  function spawnAntodactiloRain() {
    const scaleVal = rand(0.25, 0.50);     // dimensione casuale
    const speedVal = rand(120, 320);       // velocità di caduta
    const x = rand(0, width());
    const y = rand(-120, -40);

    const drop = add([
      sprite("antodactilo"),
      pos(x, y),
      scale(scaleVal),
      opacity(rand(0.35, 0.75)),
      fixed(),           // resta in "camera space"
      z(-15),            // dietro a player/ostacoli ma sopra bg
      move(DOWN, speedVal),
      "antodactiloRain",
    ]);

    // Piccola rotazione random per renderlo più "vivo"
    // (se la tua versione supporta rotate())
    if (typeof rotate === "function") {
      drop.use(rotate(rand(-20, 20)));
    }

    drop.onUpdate(() => {
      if (drop.pos.y > height() + 100) {
        destroy(drop);
      }
    });

    // frequenza spawn (più basso = più pioggia)
    wait(rand(0.15, 0.30), spawnAntodactiloRain);
  }

  // avvia la pioggia
  spawnAntodactiloRain();

  // piattaforma
  add([
    rect(width(), 48),
    pos(0, height() - 48),
    outline(4),
    area(),
    body({ isStatic: true }),
    color(127, 200, 255),
  ]);

  // ostacoli
  function spawnObstacles() {
    add([
      rect(48, rand(24, 64)),
      area(),
      body({ isStatic: true }),
      outline(4),
      pos(width(), height() - 48),
      anchor("botleft"),
      color(255, 180, 255),
      move(LEFT, 480),
      "obstacle",
    ]);

    wait(rand(0.7, 1.5), spawnObstacles);
  }
  spawnObstacles();

  // collisione
  player.onCollide("obstacle", () => {
    addKaboom(player.pos);
    shake();
    go("lose", { score, selectedChar: data.selectedChar });
  });

  // salto
  onKeyPress("space", () => {
    if (player.isGrounded()) player.jump();
  });

  // score
  const scoreLabel = add([text(score), pos(24, 24)]);

  onUpdate(() => {
    score++;
    scoreLabel.text = score;
  });
});

// --------------------
// SCENE: LOSE
// --------------------
scene("lose", (data) => {
  // Se vuoi fermare la musica al game over, sblocca questa riga:
  // stopBGM();

  add([
    text("Game Over", { size: Math.max(40, Math.floor(width() / 16)) }),
    pos(center()),
    anchor("center"),
  ]);

  add([
    text(`Score: ${data.score}`, { size: Math.max(18, Math.floor(width() / 45)) }),
    pos(width() / 2, height() / 2 + 70),
    anchor("center"),
    opacity(0.9),
  ]);

  add([
    text("SPACE = Riprova | ENTER = Cambia personaggio", {
      size: Math.max(14, Math.floor(width() / 70)),
    }),
    pos(width() / 2, height() / 2 + 120),
    anchor("center"),
    opacity(0.8),
  ]);

  onKeyPress("space", () => go("game", { selectedChar: data.selectedChar }));
  onMousePress(() => {
    unlockAudioIfNeeded();
    go("game", { selectedChar: data.selectedChar });
  });
  onKeyPress("enter", () => go("select"));
});

// avvio
go("select");
