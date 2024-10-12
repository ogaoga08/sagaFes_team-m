//(´ε｀ )♥(´ε｀ )♥(´ε｀ )♥
let faceapi;
let detections = [];

let allFireworks = [];//すべての花火を格納する配列

let gravity;
let video;
let canvas;

let startButton, hardModeButton, backButton;
let gameStarted = false;
let titleVisible = true;
let timer = 30; // タイマー初期値
let timerActive = false; // タイマーがアクティブかどうか
let gameOver = false; // ゲームが終了しているかどうか
let timerInterval;

//残り時間表示
let timerLeftDisplay = false;

//レベルアップ関連の変数
let levelNum = 1;
let showNumberAndLevels = false;  // レベルアップ時に追加秒数とレベルを表示するかどうか
let displayTimer = 0; // 追加秒数を表示するフレーム数

// 表情データ
let neutralG = 0;
let happyG = 0;
let angry = 0;
let sadG = 0;
let disgustedG = 0;
let surprisedG = 0;
let fearfulG = 0;

let shootingRate = 0.01; 

let bgm1, bgm2, bgm3, bgm4;
let currentBgm;

//雷
let lightningBolt = [];
let lightningTimer = 0;

// スコア、点数記録
let explosionCount = 0;

// テキスト
let titleDiv;
let endDiv;
let scoreDiv;
let countdownDiv;
let scoreCountDiv;
let lastCountDiv;

//　ハードモードか
let hardMode = false;

let topScores;
let scoreLine;
let rankingDiv;

window.onload = function() {
  // LocalStorageからデータを読み込む
  let savedData = localStorage.getItem('scoreData');
  if (savedData) {
    // LocalStorageから取得したデータをAlaSQLに挿入
    alasql('CREATE TABLE IF NOT EXISTS scores (id INT AUTO_INCREMENT, explosionCount INT)');
    let parsedData = JSON.parse(savedData);
    parsedData.forEach(row => {
      alasql('INSERT INTO scores VALUES ?', [row]);
    });
  } else {
    // テーブルが存在しない場合、新規作成
    alasql('CREATE TABLE IF NOT EXISTS scores (id INT AUTO_INCREMENT, explosionCount INT)');
  }
};

function preload() {
  //画像を読み込む
  surprisedImage = loadImage("assets/image/surprised.png");
  sadImage = loadImage("assets/image/sad.png");
  disgustedImage = loadImage("assets/image/disgusted.png");
  angryImage = loadImage("assets/image/angry.png");
  disgustedImage = loadImage("assets/image/disgusted.png");
  fearImage = loadImage("assets/image/fear.png");
  happyImage = loadImage("assets/image/happy.png");
  neutralImage = loadImage("assets/image/neutral.png");

  // BGMの音声ファイルをロード
  bgm1 = loadSound('assets/sound/stage1.mp3');
  bgm2 = loadSound('assets/sound/stage2.mp3');
  bgm3 = loadSound('assets/sound/stage3.mp3');
  bgm4 = loadSound('assets/sound/bgm.mp3');
  
  // 効果音の音声ファイルをロード
  sfx1 = loadSound('assets/sound/hanabi.mp3');
  sfx2 = loadSound('assets/sound/taiko.mp3');
  sfx3 = loadSound('assets/sound/wind.mp3');
  sfx4 = loadSound('assets/sound/finish.mp3');
  sfx5 = loadSound('assets/sound/kaminari.mp3');
  sfx6 = loadSound('assets/sound/timber.mp3');

  // 背景画像をロード
  bgImage = loadImage('assets/image/26c7e1f160f76c671d2365446534ee91_t.jpeg');
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  stroke(255);
  strokeWeight(4);

  canvas.id("canvas");

  video = createCapture(VIDEO);
  video.id("video");
  video.size(width, height);

  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptors: true,
    minConfidence: 0.5
  };

  faceapi = ml5.faceApi(video, faceOptions, faceReady);

  normal();
  hard();

  // 音量を設定
  let bgmVolume = 0.5; // BGMの音量(初期値:0.5)

  // BGMの音量を設定
  bgm1.setVolume(bgmVolume);
  bgm2.setVolume(bgmVolume);
  bgm3.setVolume(bgmVolume);
  bgm4.setVolume(0.2);

  // 効果音の音量を設定
  sfx1.setVolume(3); //(初期値:3)
  sfx2.setVolume(0.8); //(初期値:0.8)
  sfx3.setVolume(0.3); //(初期値:0.3)
  sfx4.setVolume(0.8); //(初期値:0.8)
  sfx5.setVolume(0.8);
  sfx6.setVolume(0.8);

  // アニメーション定義をスタイルタグに追加
  let styleElement = createElement('style', `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-30px); }
    }
    @keyframes scaleUp {
      0% { transform: scale(1); }
      100% { transform: scale(2); }
    }
  `);
  styleElement.parent(document.head);
}

function normal() {
  startButton = createButton('のーまる');
  startButton.style('font-family', 'Noto Serif JP'); // フォントファミリーを指定
  startButton.style('font-size', '26px'); // テキストのサイズを指定
  startButton.position(width / 2 - 150, height / 2 - height / 40); // 位置調整
  startButton.size(300, 120);
  startButton.mousePressed(startGame);
}

function hard() {
  hardModeButton = createButton('はーど');
  hardModeButton.style('font-family', 'Noto Serif JP'); // フォントファミリーを指定
  hardModeButton.style('font-size', '26px'); // テキストのサイズを指定
  hardModeButton.position(width / 2 - 150, height / 2 + 140); // 位置調整
  hardModeButton.size(300, 120);
  hardModeButton.mousePressed(startGameHardMode);
}

function playBgm(bgm) {
  // 既に再生中のBGMがあれば停止
  if (currentBgm && currentBgm.isPlaying()) {
    currentBgm.stop();
  }
  // 新しいBGMを再生
  bgm.loop();
  currentBgm = bgm;
}

function playSfx2sec(sfx) {
  // 効果音を再生
  sfx.play();
  // 2秒後に効果音を停止
  setTimeout(() => {
    sfx.stop();
  }, 2000);
}
function playSfx8sec(sfx) {
  // 効果音を再生
  sfx.play();
  // 8秒後に効果音を停止
  setTimeout(() => {
    sfx.stop();
  }, 8000);
}

//雷の関数
function createLightning() {
  let startX = random(width); // 雷のスタート位置をランダムに設定
  let startY = 0;
  let bolt = [];
  let currentX = startX;
  let currentY = startY;
  bolt.push([currentX, currentY]);
  playSfx2sec(sfx5);
  // 雷が画面の下に到達するまで、ランダムなパターンで進む
  while (currentY < height) {
    let nextX = currentX + random(-20, 20); // 雷がランダムに左右にずれる
    let nextY = currentY + random(10, 20);  // 下にランダムに進む
    bolt.push([nextX, nextY]);
    currentX = nextX;
    currentY = nextY;
  }
  lightningBolt.push(bolt);
}

// 雷を描画する関数 -> 怒った時に確実に雷が出るようにlightningTimerを無効化しましたわ
function doLightning(){
  if (lightningTimer <= 0) {
    createLightning();
    //lightningTimer = int(random(20, 60)); // 次の雷が発生するまでのランダムな間隔
  }
  //lightningTimer--;

  // 雷の描画
  for (let i = 0; i < lightningBolt.length; i++) {
    drawLightning(lightningBolt[i]);
  }
  // 5フレームごとに雷を消して新しい雷を生成
  if (frameCount % 5 === 0) {
    lightningBolt = [];
  }
}

function drawLightning(bolt) {
  stroke(60, 255, 255); // HSBで黄色
  for (let i = 0; i < bolt.length - 1; i++) {
    let x1 = bolt[i][0];
    let y1 = bolt[i][1];
    let x2 = bolt[i + 1][0];
    let y2 = bolt[i + 1][1];
    line(x1, y1, x2, y2); // 線を引いて雷を描画
  }
}

function faceReady() {
  faceapi.detect(gotFaces);
}

function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }

  detections = result;

  clear();
  
  if(!gameStarted){
    drawBoxs(detections);
    // drawLandmarks(detections);
  }
  
  drawExpressions(detections, 80, 250, 28); //表情の値をこの関数外でグローバル変数に格納できれば処理減らせられる
  
  faceapi.detect(gotFaces);
}

function drawBoxs(detections){
  if (detections.length > 0) {//If at least 1 face is detected: 
    for (f=0; f < detections.length; f++){
      let {_x, _y, _width, _height} = detections[0].alignedRect._box;
      stroke(44, 225, 225);
      strokeWeight(5);
      noFill();
      rect(_x, _y -100, _width, _height + 100);
    }
  }
}

function drawLandmarks(detections){
  if (detections.length > 0) {//If at least 1 face is detected
    for (f=0; f < detections.length; f++){
      let points = detections[f].landmarks.positions;
      for (let i = 0; i < points.length; i++) {
        stroke(44, 169, 225);
        strokeWeight(3);
        point(points[i]._x , points[i]._y * 1.6 - 280);
      }
    }
  }
}

function drawExpressions(detections, x, y, textYSpace){
  if (detections.length > 0) { // If at least 1 face is detected
    let {neutral, happy, angry, sad, disgusted, surprised, fearful} = detections[0].expressions;

    // happiness~fearfulの値をグローバル変数に反映
    happyG = happy;
    neutralG = neutral;
    angerG = angry;
    sadG = sad;
    disgustedG = disgusted;
    surprisedG = surprised;
    fearfulG = fearful;

    x = x - 50;
    y = 70;

    if(!gameStarted){
      textFont('Helvetica Neue');
      textSize(50);
    
      noStroke();
      fill(0);

      text("😐 : " + nf(neutral * 100, 2, 1) + "%", x, y);
      text("😄 : " + nf(happy * 100, 2, 1) + "%", x, y + textYSpace * 2);
      text("😡 : " + nf(angry * 100, 2, 1) + "%", x, y + textYSpace * 4);
      text("😭 : " + nf(sad * 100, 2, 2) + "%", x, y + textYSpace * 6);
      text("😳 : " + nf(surprised * 100, 2, 1) + "%", x, y + textYSpace * 8);
      text("😨 : " + nf(fearful * 100, 2, 1) + "%", x, y + textYSpace * 10);
    }
    
  }
}

function startGame() {
  startButton.hide();
  hardModeButton.hide();
  titleVisible = false;
  gameStarted = true;
  timerActive = true;
  gameOver = false;
  timer = 20; // タイマーをリセット
  shootingRate = 0.0025;

  gravity = createVector(0, 0.3); //重力設定

  hardMode = false;

  allFireworks = [];// 花火をリセット

  startTimer(); // タイマーを開始
  playBgm(bgm1);
  playSfx2sec(sfx2);

  if (scoreLine) {
    scoreLine.remove();
    scoreLine = null;
  }
  if (rankingDiv) {
    rankingDiv.remove();
    rankingDiv = null;
  }
}

function startGameHardMode() {
  startButton.hide();
  hardModeButton.hide();
  titleVisible = false;
  gameStarted = true;
  timerActive = true;
  gameOver = false;
  timer = 30; // タイマーをリセット
  shootingRate = 0.0075;

  gravity = createVector(0, 0.8);

  hardMode = true;

  allFireworks = []; // 花火をリセット

  startTimer(); // タイマーを開始
  playSfx2sec(sfx2);
  playSfx8sec(sfx3);//この後３秒くらい遅らせてつぎへ？
  playBgm(bgm3);

  if (scoreLine) {
    scoreLine.remove();
    scoreLine = null;
  }
  if (rankingDiv) {
    rankingDiv.remove();
    rankingDiv = null;
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (timer === 1) { 
      timer--; // タイマーを0にする
      countdownDiv.html('残り時間: ' + timer); // 残り時間を0に更新
      clearInterval(timerInterval); // タイマーを停止
      endGame(); // ゲーム終了
    } else if (timer <= 6) {
      sfx6.play(); // sfx6を再生
      timer--;
    } else {
      timer--;
    }
  }, 1000);
}

function endGame() {
  playSfx8sec(sfx4);
  gameStarted = false;
  timerActive = false;
  gameOver = true;
  clearInterval(timerInterval); // タイマーを停止

  // スコアをデータベースに保存
  alasql('INSERT INTO scores (explosionCount) VALUES (?)', [explosionCount]);

  // データベースの内容をlocalStorageに保存
  let allData = alasql('SELECT * FROM scores');
  localStorage.setItem('scoreData', JSON.stringify(allData));

  // スコアを降順で取得して上位5件を表示
  topScores = alasql('SELECT * FROM scores ORDER BY explosionCount DESC LIMIT 5');

  console.log(topScores);

  // タイムアップのテキスト
  endDiv = createDiv('たいむあっぷ！');
  endDiv.position(width / 2 - 280, height / 3);  // 位置を中央に
  endDiv.style('font-size', '70px');
  endDiv.style('color', 'white');
  endDiv.style('text-align', 'center');
  endDiv.style('font-family', 'Noto Serif JP');
  endDiv.style('width', '600px');
  endDiv.style('text-shadow', '4px 4px 8px rgba(200, 0, 0, 0.7)');
  endDiv.style('animation', 'bounce 2s infinite');  // アニメーション追加

  // スコアのテキスト
  scoreDiv = createDiv('スコア: ' + explosionCount);
  scoreDiv.position(width / 3, height / 2 - height / 40);  // 位置を中央に
  scoreDiv.style('font-size', '46px');
  scoreDiv.style('color', 'white');
  scoreDiv.style('text-align', 'center');
  scoreDiv.style('font-family', 'Noto Serif JP');
  scoreDiv.style('width', '600px');
  scoreDiv.style('text-shadow', '4px 4px 8px rgba(200, 0, 0, 0.7)');
  scoreDiv.style('animation', 'bounce 2s infinite');  // アニメーション追加

  // ランキングを表示するDivを作成
  rankingDiv = createDiv('得点ランキング');
  rankingDiv.position(width - 620, 20);
  rankingDiv.style('font-size', '60px');
  rankingDiv.style('color', 'white');
  rankingDiv.style('text-align', 'right');
  rankingDiv.style('font-family', 'Noto Serif JP');
  rankingDiv.style('width', '600px');
  rankingDiv.style('text-shadow', '4px 4px 8px rgba(200, 0, 0, 0.7)');

  // 上位5つのスコアを表示
  topScores.forEach((score, index) => {
    scoreLine = createDiv((index + 1) + '位: ' + score.explosionCount + ' 点');
    scoreLine.parent(rankingDiv);
    scoreLine.style('font-size', '60px');
    scoreLine.style('color', 'white');
    scoreLine.style('text-align', 'right');
    scoreLine.style('font-family', 'Noto Serif JP');
    scoreLine.style('text-shadow', '2px 2px 4px rgba(200, 0, 0, 0.7)');
  });

  backButton = createButton('戻る');
  backButton.style('font-family', 'Noto Serif JP'); // フォントファミリーを指定
  backButton.style('font-size', '26px'); // テキストのサイズを指定
  backButton.position(width / 2 - 150, height / 2 + 140); // 位置調整
  backButton.size(300, 120);
  backButton.mousePressed(() => {
    playSfx2sec(sfx2);
    resetGame();
  }
  )
  // カウントダウンのテキストを削除
  if (lastCountDiv) {
    lastCountDiv.remove();
    lastCountDiv = null;
  };
  if (countdownDiv) {
    countdownDiv.remove();
    countdownDiv = null;
  };
  if (scoreCountDiv) {
    scoreCountDiv.remove();
    scoreCountDiv = null;
  };
}

function resetGame() {
  backButton.hide();

  // タイムアップとスコアのテキストを削除
  if (endDiv) {
    endDiv.remove();
  }
  if (scoreDiv) {
    scoreDiv.remove();
  }
  // 残り時間と爆発した花火の数のテキストを削除
  if (countdownDiv) {
    countdownDiv.remove();
    countdownDiv = null;
  }
  if (scoreCountDiv) {
    scoreCountDiv.remove();
    scoreCountDiv = null;
  }
  if (lastCountDiv) {
    lastCountDiv.remove();
    lastCountDiv = null;
  }

  titleVisible = true;
  gameOver = false;
  gameStarted = false;

  allFireworks = [];// 花火リセット
  explosionCount = 0; // スコアリセット
  levelNum = 1; // レベルリセット

  normal(); // Normalモードボタンを再表示
  hard(); // Hardモードボタンを再表示
  if (currentBgm && currentBgm.isPlaying()) {
    currentBgm.stop();
  }
  playBgm(bgm4);
}

function draw() {
  if (titleVisible && !titleDiv) {
    // HTMLのdivを作成してタイトルを表示
    titleDiv = createDiv('花火げゑむ');
    titleDiv.position(width / 2 - 300, height / 3);  // 位置調整
    titleDiv.style('font-size', '80px');  // テキストサイズを指定
    titleDiv.style('color', 'white');  // テキストの色を指定
    titleDiv.style('text-align', 'center');  // 中央揃え
    titleDiv.style('Noto Serif JP'); // フォントを設定
    titleDiv.style('width', '600px');  // テキストの幅を指定
    titleDiv.style('text-shadow', '4px 4px 8px rgba(200, 0, 0, 0.7)');  // シャドウエフェクトを適用
    titleDiv.style('animation', 'bounce 2s infinite');  // アニメーションを適用

    playBgm(bgm4);
  }



  if (gameStarted) {
    // タイトルを非表示にして削除
    if (titleDiv) {
      titleDiv.remove();
      titleDiv = null;
    }
    //各表情ごとの花火のクラスを生成し、全て allFireworks 配列に格納
    //5つの絵文字が等確率で発射されるから、shootingRateは低めに
    if (random(1) < shootingRate) {
      allFireworks.push(new HappyFirework());
    }
    if (random(1) < shootingRate) {
      allFireworks.push(new SadFirework());
    }
    if (random(1) < shootingRate) {
      allFireworks.push(new AngryFirework());
    }
    if (random(1) < shootingRate) {
      allFireworks.push(new FearfulFirework());
    }
    if (random(1) < shootingRate) {
      allFireworks.push(new SurprisedFirework());
    }
    if (random(1) < shootingRate) {
      allFireworks.push(new NeutralFirework());
    }
    
    for (let i = allFireworks.length - 1; i >= 0; i--) {
      allFireworks[i].update();
      allFireworks[i].show();

      if (allFireworks[i].done()) {
        allFireworks.splice(i, 1);
      }
    }

    if (timerActive) {
      if (!countdownDiv) {
        countdownDiv = createDiv('残り時間: ' + timer);
        countdownDiv.position(width - 620, 20);  // 位置調整
        countdownDiv.style('font-size', '50px');  // テキストサイズを指定
        countdownDiv.style('color', 'white');  // テキストの色を指定
        countdownDiv.style('text-align', 'right');  // 右揃え
        countdownDiv.style('font-family', 'Noto Serif JP'); // フォントを設定
        countdownDiv.style('width', '600px');  // テキストの幅を指定
        countdownDiv.style('text-shadow', '2px 2px 4px rgba(200, 0, 0, 0.7)');  // シャドウエフェクトを適用
      } else {
        countdownDiv.html('残り時間: ' + timer);
      }

      if (!scoreCountDiv) {
        scoreCountDiv = createDiv('爆発した花火の数: ' + explosionCount);
        scoreCountDiv.position(width - 620, 80);  // 位置調整
        scoreCountDiv.style('font-size', '50px');  // テキストサイズを指定
        scoreCountDiv.style('color', 'white');  // テキストの色を指定
        scoreCountDiv.style('text-align', 'right');  // 右揃え
        scoreCountDiv.style('font-family', 'Noto Serif JP'); // フォントを設定
        scoreCountDiv.style('width', '600px');  // テキストの幅を指定
        scoreCountDiv.style('text-shadow', '2px 2px 4px rgba(200, 0, 0, 0.7)');  // シャドウエフェクトを適用
      } else {
        scoreCountDiv.html('爆発した花火の数: ' + explosionCount);
      }
    }

      //タイマーが5秒以下になったらカウントダウン開始
      if (timer <= 5) {
        if (!lastCountDiv) {
          lastCountDiv = createDiv(timer);
          lastCountDiv.position(width / 2 - 150, height / 2 - 150); // 位置調整
          lastCountDiv.style('font-size', '300px'); // 初期サイズ
          lastCountDiv.style('color', 'white'); // テキストの色を指定
          lastCountDiv.style('text-align', 'center'); // 中央揃え
          lastCountDiv.style('font-family', 'Noto Serif JP'); // フォントを設定
          lastCountDiv.style('width', '300px'); // テキストの幅を指定
          lastCountDiv.style('height', '300px'); // テキストの高さを指定
          lastCountDiv.style('line-height', '300px'); // テキストの行の高さを指定
          lastCountDiv.style('animation', 'scaleUp 1s infinite'); // アニメーションを適用
        } else {
          lastCountDiv.html(timer);
        }
      } else if (timer <= 0) {
        if (lastCountDiv) {
          lastCountDiv.remove();
          lastCountDiv = null;
        }
      }
    }

    //レベル１クリア -> タイマーを10秒追加してレベル２へ
    if (levelNum == 1){
      if(explosionCount >= 40){
        timer += 5;
        levelNum++;
        showNumberAndLevels = true;
        displayTimer = 50;
        if (lastCountDiv) {
          lastCountDiv.remove();
          lastCountDiv = null;
        }
      }
    }
    //レベル2クリア -> タイマーを10秒追加してレベル３へ
    if (levelNum == 2){
      if(explosionCount >= 60){
        timer += 5;
        levelNum++;
        showNumberAndLevels = true;
        displayTimer = 100;
        if (lastCountDiv) {
          lastCountDiv.remove();
          lastCountDiv = null;
        }
      }
    }
  
    //レベル3クリア -> タイマーを10秒追加してレベル4へ
    if (levelNum == 3){
      if(explosionCount >= 80){
        timer += 5;
        levelNum++;
        showNumberAndLevels = true;
        displayTimer = 50;
        if (lastCountDiv) {
          lastCountDiv.remove();
          lastCountDiv = null;
        }
      }
    }
  
    //レベル4クリア -> タイマーを10秒追加してレベル5へ
    if (levelNum == 4){
      if(explosionCount >= 100){
        timer += 5;
        levelNum++;
        showNumberAndLevels = true;
        displayTimer = 50;
        if (lastCountDiv) {
          lastCountDiv.remove();
          lastCountDiv = null;
        }
      }
    }
  
    if(showNumberAndLevels){
      showAddedTimeAndLevels();
    }
  }

function showAddedTimeAndLevels(){
  textSize(100);      
  fill(255);  
  textAlign(CENTER, CENTER);  
  text("+5秒", width / 2, height / 2 + 50); //レベルごとに異なる追加秒数を表示できるようにしたい

  text("れべる " + levelNum, width / 2, height / 2 - 100);

  displayTimer--;

  if(displayTimer <= 0){
    showNumberAndLevels = false;
  }
}

class Firework {
  constructor(emoji) {
    this.firework = new Particle(random(width), height, true, emoji);
    this.exploded = false;
    this.particles = [];
    this.emoji = emoji;
  }

  done() {
    return this.exploded && this.particles.length === 0;
  }

  explode() {
    for (let i = 0; i < 100; i++) {
      let p = new Particle(this.firework.pos.x, this.firework.pos.y, false, this.emoji);
      this.particles.push(p);
    }
    playSfx2sec(sfx1);
    explosionCount++; // Increment explosion counter
  }

  show() {
    if (!this.exploded) {
      this.firework.show();
    }

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].show();
    }
  }
}

class Particle {
  constructor(x, y, firework, emoji) {
    this.pos = createVector(x, y);
    this.firework = firework;
    this.lifespan = 255;
    this.emoji = emoji;

    if (this.firework) {
      if (hardMode) {
        // ハードモードの場合の速度設定
        this.vel = createVector(0, random(-36, -20));
      } else {
        // 通常モードの場合の速度設定
        this.vel = createVector(0, random(-19, -15));
      }
    } else {
      this.vel = p5.Vector.random2D();
      this.vel.mult(random(2, 10));
    }

    this.acc = createVector(0, 0); 
    this.hu = random(255);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() { 
    if (!this.firework) {
      this.vel.mult(0.95); //減速の割合 値0.9で各フレームごとに1０％減速
      this.lifespan -= 4;
    }

    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  done() {
    return this.lifespan < 0;
  }

  show() {
    if (!this.firework) {
      strokeWeight(2);
      stroke(this.hu, 255, 255, this.lifespan);
    } else {
      strokeWeight(4);
      stroke(this.hu, 255, 255);
      //Firework (use image)
      imageMode(CENTER);
      image(this.emoji, this.pos.x, this.pos.y, 70, 70); //emojiの大きさ、サイズ
    }
    point(this.pos.x, this.pos.y);
  }
}

//(´ε｀ )♥////(´ε｀ )♥///////(´ε｀ )♥/////////
/////////////////////////////////////////////
// ( ✹‿✹ ) 以下、表情ごとの花火のクラス ( ✹‿✹ )//
/////////////////////////////////////////////

// updateメソッドをいじって条件やエフェクトを追加・変更
// 打ち上がる花火の高さ（速さ）はParticleクラスで調整
class HappyFirework extends Firework {
  constructor(){
    let emoji = happyImage;
    super(emoji);
  }

  update() {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();
      
      if (this.firework.vel.y >= 0) {
        if (happyG * 100 >= 0.98) { 
          this.exploded = true;
          this.explode();
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();

      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
 }

  show() {
    if (!this.exploded) {
      this.firework.show();
    }
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].show();
    }
  }
}

class SadFirework extends Firework {
  constructor(){
    let emoji = sadImage;
    super(emoji);
  }

  update() {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();
      
      if (this.firework.vel.y >= 0) {
        if (sadG * 100 >= 0.98) { 
          this.exploded = true;
          this.explode(); 
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();

      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
 }

  show() {
    if (!this.exploded) {
      this.firework.show();
    }
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].show();
    }
  }
}

class AngryFirework extends Firework {
  constructor(){
    let emoji = angryImage;
    super(emoji);
  }

  update() {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();
      
      //Angry90%でばくはつ && かみなり発動
      if (this.firework.vel.y >= 0) {
        if (angerG * 100 >= 0.98) { 
          this.exploded = true;
          this.explode();
          doLightning(); // 雷を発生させる
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();

      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
 }

  show() {
    if (!this.exploded) {
      this.firework.show();
    }
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].show();
    }
  }
}

class FearfulFirework extends Firework {
  constructor(){
    let emoji = fearImage;
    super(emoji);
  }

  update() {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();
      
      //Fear 90%でばくはつ
      if (this.firework.vel.y >= 0) {
        if (fearfulG * 100 >= 0.95) { 
          this.exploded = true;
          this.explode();
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();

      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
 }

  show() {
    if (!this.exploded) {
      this.firework.show();
    }
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].show();
    }
  }
}

class SurprisedFirework extends Firework {
  constructor(){
    let emoji = surprisedImage;
    super(emoji);
  }

  update() {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();
      
      //サプライズ90%でばくはつ
      if (this.firework.vel.y >= 0) {
        if (surprisedG * 100 >= 0.98) { 
          this.exploded = true;
          this.explode();
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();

      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
 }

  show() {
    if (!this.exploded) {
      this.firework.show();
    }
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].show();
    }
  }
}

class NeutralFirework extends Firework {
  constructor(){
    let emoji = neutralImage;
    super(emoji);
  }

  update() {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();
      
      if (this.firework.vel.y >= 0) {
        if (neutralG * 100 >= 0.98) { 
          this.exploded = true;
          this.explode();
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();

      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
 }

  show() {
    if (!this.exploded) {
      this.firework.show();
    }
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].show();
    }
  }
}