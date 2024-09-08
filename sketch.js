let faceapi;
let detections = [];
let fireworks = [];
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

// 表情データ
let neutralG = 0;
let happyG = 0;
let angry = 0;
let sadG = 0;
let disgustedG = 0;
let surprisedG = 0;
let fearfulG = 0;

let shootingRate = 0.1;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  gravity = createVector(0, 0.1);
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
}

function normal () {
  startButton = createButton('Normal Mode');
  startButton.position(width / 2 - 50, height / 2 + 50);
  startButton.size(100, 40);
  startButton.mousePressed(startGame);
}

function hard () {
  hardModeButton = createButton('Hard Mode');
  hardModeButton.position(width / 2 - 50, height / 2 + 100);
  hardModeButton.size(100, 40);
  hardModeButton.mousePressed(startGameHardMode);
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
  
  drawBoxs(detections);
  drawLandmarks(detections);
  drawExpressions(detections, 20, 250, 28);
  
  faceapi.detect(gotFaces);
}
function drawBoxs(detections){
  if (detections.length > 0) {//If at least 1 face is detected: 
    for (f=0; f < detections.length; f++){
      let {_x, _y, _width, _height} = detections[f].alignedRect._box;
      stroke(44, 169, 225);
      strokeWeight(1);
      noFill();
      rect(_x, _y, _width, _height);
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
        point(points[i]._x, points[i]._y);
      }
    }
  }
}

function drawExpressions(detections, x, y, textYSpace){
  if (detections.length > 0) { // If at least 1 face is detected
    let {neutral, happy, angry, sad, disgusted, surprised, fearful} = detections[0].expressions;
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

    // happiness~fearfulの値をグローバル変数に反映
    happyG = happy;
    neutralG = neutral;
    angerG = angry;
    sadG = sad;
    disgustedG = disgusted;
    surprisedG = surprised;
    fearfulG = fearful;
    
  } else { // If no faces are detected
    text("neutral: ", x, y);
    text("happiness: ", x, y + textYSpace);
    text("anger: ", x, y + textYSpace * 2);
    text("sad: ", x, y + textYSpace * 3);
    text("disgusted: ", x, y + textYSpace * 4);
    text("surprised: ", x, y + textYSpace * 5);
    text("fear: ", x, y + textYSpace * 6);
  }
}

function startGame() {
  startButton.hide();
  hardModeButton.hide();
  titleVisible = false;
  gameStarted = true;
  timerActive = true;
  gameOver = false;
  timer = 30; // タイマーをリセット
  fireworks = []; // 花火をリセット
  startTimer(); // タイマーを開始
}

function startGameHardMode() {
  startGame();
  // ハードモードの設定をここで追加できます
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
  gameStarted = false;
  timerActive = false;
  gameOver = true;
  clearInterval(timerInterval); // タイマーを停止
  backButton = createButton('戻る');
  backButton.position(width / 2 - 50, height / 2 + 50);
  backButton.size(100, 40);
  backButton.mousePressed(resetGame);
}

function resetGame() {
  backButton.hide();
  titleVisible = true;
  gameOver = false;
  gameStarted = false;
  fireworks = []; // 花火リセット
  normal(); // Normalモードボタンを再表示
  hard(); // Hardモードボタンを再表示
}


function draw() {

  if (titleVisible) {
    textSize(48);
    fill(255);
    textAlign(CENTER);
    text("花火ゲーム", width / 2, height / 2 - 50);
    
  }

  if (gameStarted) {
    if (random(1) < shootingRate) {
      fireworks.push(new Firework());
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].show();

      if (fireworks[i].done()) {
        fireworks.splice(i, 1);
      }
    }

    if (timerActive) {
      fill(255);
      textSize(32);
      textAlign(RIGHT, TOP);
      text("Time: " + timer, width - 20, 20); // 画面右上にタイマー表示
    }
  }

  if (gameOver) {
    textSize(48);
    fill(255);
    textAlign(CENTER);
    text("ゲーム終了！", width / 2, height / 2 - 100); // ゲーム終了テキスト表示
  }
}

class Firework {
  constructor() {
    this.firework = new Particle(random(width), height, true);
    this.exploded = false;
    this.particles = [];
  }

  done() {
    return this.exploded && this.particles.length === 0;
  }

  update() {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();
      gravity = createVector(0, 0.15);
      shootingRate = 0.1
      
      
      //表情の値で条件分岐
      if (this.firework.vel.y >= 0) {
        if(neutralG * 100 >= 0.90){ // neutralの時、ふつう
          shootingRate = 0.1;
        }else if (happyG * 100 >= 0.90) { // happyの時、花火盛大
          shootingRate = 0.2;
          this.exploded = true;
          this.explode();
        } else if (angerG * 100 >= 0.90){ // angerの時、重力なし
          shootingRate = 0.8;
          gravity = createVector(0, 0.0);
        } else if (sadG * 100 >= 0.90){ // sadの時、重力重め
          shootingRate = 0.07;
          gravity = createVector(0, 0.3);
        } else if (disgustedG * 100 >= 0.90){ // disgustedの時、
          shootingRate = 2;
          this.exploded = true;
          this.explode();
        } else if (surprisedG * 100 >= 0.90){ // surprisedの時、
          shootingRate = 0.08;
          this.exploded = true;
          this.explode();
        } else if (fearfulG * 100 >= 0.90){ // fearfulの時、
          shootingRate = 2;
          this.exploded = true;
          this.explode();
        }else {
          shootingRate = 0.1;
          this.exploded = true; // 発射はするが、爆発しない
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

  explode() {
    for (let i = 0; i < 100; i++) {
      let p = new Particle(this.firework.pos.x, this.firework.pos.y, false);
      this.particles.push(p);
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

class Particle {
  constructor(x, y, firework) {
    this.pos = createVector(x, y);
    this.firework = firework;
    this.lifespan = 255;

    if (this.firework) {
      this.vel = createVector(0, random(-19, -10));
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
      this.vel.mult(0.9);
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
    }

    point(this.pos.x, this.pos.y);
  }
}
