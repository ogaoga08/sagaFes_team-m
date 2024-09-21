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

let shootingRate = 0.01; //5つの絵文字が等確率で出てくるから、1つの時より低めに

let bgm1, bgm2, bgm3, bgm4;
let sfx1, sfx2, sfx3;
let currentBgm;

//雷
let lightningBolt = [];
let lightningTimer = 0;

// スコア、点数記録
let explosionCount = 0;

function preload() {
  //画像を読み込む
  chosenImage = loadImage("assets/image/surprised.png"); // 任意の画像のパス

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

  // 背景画像をロード
  bgImage = loadImage('assets/image/26c7e1f160f76c671d2365446534ee91_t.jpeg');
}

// // 処理を一時停止する関数
// function sleep(waitMsec) {
//   var startMsec = new Date();

//   // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
//   while (new Date() - startMsec < waitMsec);
// }

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  gravity = createVector(0, 0.3); //重力設定
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
  let bgmVolume = 0.1; // BGMの音量(初期値:0.5)

  // BGMの音量を設定
  bgm1.setVolume(bgmVolume);
  bgm2.setVolume(bgmVolume);
  bgm3.setVolume(bgmVolume);
  bgm4.setVolume(bgmVolume);

  // 効果音の音量を設定
  sfx1.setVolume(0.6); //(初期値:3)
  sfx2.setVolume(0.2); //(初期値:0.8)
  sfx3.setVolume(0.05); //(初期値:0.3)
  sfx4.setVolume(0.2); //(初期値:0.8)
  sfx5.setVolume(0.2);

}

function normal() {
  startButton = createButton('Normal');
  startButton.position(width / 2 - 150, height / 2 + 100); // 位置調整
  startButton.size(300, 120); // サイズを3倍に
  startButton.mousePressed(startGame);
}

function hard() {
  hardModeButton = createButton('Hard');
  hardModeButton.position(width / 2 - 150, height / 2 + 250); // 位置調整
  hardModeButton.size(300, 120); // サイズを3倍に
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

function playSfx(sfx) {
  // 効果音を再生
  sfx.play();
  // 2秒後に効果音を停止
  setTimeout(() => {
    sfx.stop();
  }, 2000);
}

//雷の関数
function createLightning() {
  let startX = random(width); // 雷のスタート位置をランダムに設定
  let startY = 0;
  let bolt = [];
  let currentX = startX;
  let currentY = startY;
  bolt.push([currentX, currentY]);
  playSfx(sfx5);
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



// 雨の関数


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
    drawLandmarks(detections);
  }
  
  drawExpressions(detections, 80, 250, 28); //表情の値をこの関数外でグローバル変数に格納できれば処理減らせられる
  
  faceapi.detect(gotFaces);
}

function drawBoxs(detections){
  if (detections.length > 0) {//If at least 1 face is detected: 
    for (f=0; f < detections.length; f++){
      let {_x, _y, _width, _height} = detections[f].alignedRect._box;
      stroke(44, 225, 225);
      strokeWeight(1);
      noFill();
      rect(_x, _y -100, _width, _height + 200);
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

    if(!gameStarted){
      textFont('Helvetica Neue');
      textSize(14);
    
      noStroke();
      fill(0);

      text("neutral:       " + nf(neutral * 100, 2, 2) + "%", x, y);
      text("happiness: " + nf(happy * 100, 2, 2) + "%", x, y + textYSpace);
      text("anger:        " + nf(angry * 100, 2, 2) + "%", x, y + textYSpace * 2);
      text("sad:            " + nf(sad * 100, 2, 2) + "%", x, y + textYSpace * 3);
      text("disgusted: " + nf(disgusted * 100, 2, 2) + "%", x, y + textYSpace * 4);
      text("surprised:  " + nf(surprised * 100, 2, 2) + "%", x, y + textYSpace * 5);
      text("fear:           " + nf(fearful * 100, 2, 2) + "%", x, y + textYSpace * 6);
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

  allFireworks = [];// 花火をリセット

  startTimer(); // タイマーを開始
  playBgm(bgm1);
  playSfx(sfx2);
}

function startGameHardMode() {
  startButton.hide();
  hardModeButton.hide();
  titleVisible = false;
  gameStarted = true;
  timerActive = true;
  gameOver = false;
  timer = 30; // タイマーをリセット
  shootingRate = 0.01;

  allFireworks = []; // 花火をリセット

  startTimer(); // タイマーを開始
  playSfx(sfx2);
  playSfx(sfx3);//この後３秒くらい遅らせてつぎへ？
  playBgm(bgm3);
}



function startTimer() {
  timerInterval = setInterval(() => {
    if (timer > 0) {
      timer--;
    } else {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function endGame() {
  playSfx(sfx4);
  gameStarted = false;
  timerActive = false;
  gameOver = true;
  clearInterval(timerInterval); // タイマーを停止
  backButton = createButton('戻る');
  backButton.position(width / 2 - 50, height / 2 + 50);
  backButton.size(100, 40);
  backButton.mousePressed(() => {
    playSfx(sfx2);
    resetGame();
  }
  )
}

function resetGame() {
  backButton.hide();
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
}
function draw() {
  // background(bgImage);
  if (titleVisible) {
    textSize(48);
    fill(255);
    textAlign(CENTER);
    text("花火ゲーム", width / 2, height / 3);
  }



  if (gameStarted) {

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
      colorMode(RGB);
      fill(255,0,0);
      colorMode(HSB);
      noStroke();
      textSize(32);
      textAlign(RIGHT, TOP);
      text("Time: " + timer, width - 20, 20); // 画面右上にタイマー表示

      // Display explosion count below the timer
      text("Explosions: " + explosionCount, width - 20, 60);

      //タイマーが5秒以下になったらカウントダウン開始
      if(timer <= 5){
        textSize(300);
        fill(255);
        textAlign(CENTER, CENTER);
        text(timer, width / 2, height / 2);
      }
    }
  }

  //レベル１クリア -> タイマーを10秒追加してレベル２へ
  if (levelNum == 1){
    if(explosionCount >= 60){
      timer += 10;
      levelNum++;
      showNumberAndLevels = true;
      displayTimer = 100;
    }
  }
  //レベル2クリア -> タイマーを10秒追加してレベル３へ
  if (levelNum == 2){
    if(explosionCount >= 100){
      timer += 10;
      levelNum++;
      showNumberAndLevels = true;
      displayTimer = 100;
    }
  }

  //レベル3クリア -> タイマーを10秒追加してレベル4へ
  if (levelNum == 3){
    if(explosionCount >= 120){
      timer += 10;
      levelNum++;
      showNumberAndLevels = true;
      displayTimer = 100;
      
    }
  }

  //レベル4クリア -> タイマーを10秒追加してレベル5へ
  if (levelNum == 4){
    if(explosionCount >= 150){
      timer += 15;
      levelNum++;
      showNumberAndLevels = true;
      displayTimer = 100;
    }
  }

  if(showNumberAndLevels){
    showAddedTimeAndLevels();
  }

  

  if (gameOver) {
    textSize(40);
    fill(255);
    textAlign(CENTER);
    text("ゲーム終了！", width / 2, height / 2 - 100);
    // ゲーム終了テキスト表示
    text("スコア : " + explosionCount, width / 2, height / 2 - 30);
  }
}

function showAddedTimeAndLevels(){
  textSize(100);      
  fill(255);  
  textAlign(CENTER, CENTER);  
  text("+10秒", width / 2, height / 2 + 50); //レベルごとに異なる追加秒数を表示できるようにしたい

  text("Level " + levelNum, width / 2, height / 2 - 100);

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
    playSfx(sfx1);
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
      //速度(打ち上がる高さ) 適正値はモニターの大きさ、設定した重力、減速の割合によって変化する
      this.vel = createVector(0, random(-20, -10)); /////
      /////////////////////////////////(上限,下限)////////
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
      this.vel.mult(0.9); //減速の割合 値0.9で各フレームごとに1０％減速
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
      image(this.emoji, this.pos.x, this.pos.y, 50, 50); //emojiの大きさ、サイズ
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
      
      //ハッピー95%でばくはつ
      if (this.firework.vel.y >= 0) {
        if (happyG * 100 >= 0.95) { 
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
      
      //SAD95%でばくはつ
      if (this.firework.vel.y >= 0) {
        if (sadG * 100 >= 0.95) { 
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
        if (angerG * 100 >= 0.95) { 
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
        if (surprisedG * 100 >= 0.95) { 
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
      
      //真顔95%でばくはつ
      if (this.firework.vel.y >= 0) {
        if (neutralG * 100 >= 0.95) { 
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