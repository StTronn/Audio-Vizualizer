/*
 * Copyright 2013 Boris Smus. All Rights Reserved.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var WIDTH = 1000;
var HEIGHT = 700;
// Interesting parameters to tweak!
var SMOOTHING = 0.6;
var FFT_SIZE = 1024;

function VisualizerSample() {
  this.analyser = context.createAnalyser();

  this.analyser.connect(context.destination);
  this.analyser.minDecibels = -140;
  this.analyser.maxDecibels = 0;

  loadSounds(
    this,
    {
      buffer: "chrono.mp3"
    },
    onLoaded
  );
  //onloaded ensure that the button is not pressed before sound is loaded
  //the following line creates a array(uint8) where the freq data can be stored
  this.freqs = new Uint8Array(this.analyser.frequencyBinCount);

  this.times = new Uint8Array(this.analyser.frequencyBinCount);

  function onLoaded() {
    var button = document.querySelector("button");
    button.removeAttribute("disabled");
    button.innerHTML = "Play/pause";
  }

  this.isPlaying = false;
  this.startTime = 0;
  this.startOffset = 0;
}

// Toggle playback
VisualizerSample.prototype.togglePlayback = function() {
  if (this.isPlaying) {
    // Stop playback
    this.source[this.source.stop ? "stop" : "noteOff"](0);
    this.startOffset = this.startOffset + context.currentTime - this.startTime;
    console.log("paused at", this.startOffset);
    // Save the position of the play head.
  } else {
    this.startTime = context.currentTime;
    console.log("started at", this.startOffset);
    this.source = context.createBufferSource();
    // Connect graph
    this.source.connect(this.analyser);
    this.source.buffer = this.buffer;
    this.source.loop = true;
    // Start playback, but make sure we stay in bound of the buffer.
    this.source[this.source.start ? "start" : "noteOn"](
      0,
      this.startOffset % this.buffer.duration
    );
    // Start visualizer.
    requestAnimFrame(this.draw.bind(this));
  }
  this.isPlaying = !this.isPlaying;
};

VisualizerSample.prototype.draw = function() {
  this.analyser.smoothingTimeConstant = SMOOTHING;
  this.analyser.fftSize = FFT_SIZE;

  // Get the frequency data from the currently playing music
  // this gets the frequency data of currently playing sounds
  // and stores it in the uint array provided
  this.analyser.getByteFrequencyData(this.freqs);
  this.analyser.getByteTimeDomainData(this.times);

  var width = Math.floor(1 / this.freqs.length, 10);

  var canvas = document.querySelector("canvas");
  var drawContext = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = HEIGHT;
  drawContext.fillStyle = "black";
  drawContext.fillRect(0, 0, canvas.width, canvas.height);
  // Draw the frequency domain chart.
  var j = 0;
  for (
    var i = 0;
    i < this.analyser.frequencyBinCount;
    i = Math.floor(i + this.analyser.frequencyBinCount / 50)
  ) {
    var value = this.freqs[i];
    var percent = value / 256;
    var height = ((HEIGHT * percent) % 50) + 150;
    var offset = HEIGHT - height - 1;
    var barWidth = 3;
    var hue = (i / this.analyser.frequencyBinCount) * 360;

    console.log(hue);
    //    drawContext.fillStyle = "hsl(" + hue + ", 100%, 60%)";
    //   drawContext.fillRect(i * barWidth, offset, barWidth, height);

    var angleStep = (Math.PI * 2) / 50;
    drawContext.fillStyle = "red";
    var line = getLine(250, 250, (0 + j * Math.PI * 2) / 50, 1, height, 100);

    drawContext.beginPath();
    drawContext.moveTo(line.x1, line.y1); // add line to path
    drawContext.lineTo(line.x2, line.y2);
    drawContext.strokeStyle = "hsl(" + hue + ", 100%, 50%)";
    drawContext.lineWidth = 2; // beware of center area
    drawContext.stroke(); // stroke all lines at once
    j++;
  }

  // Draw the time domain chart.
  // for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
  //   var value = this.times[i];
  //   var percent = value / 256;
  //   var height = HEIGHT * percent;
  //   var offset = HEIGHT - height - 1;
  //   var barWidth = WIDTH / this.analyser.frequencyBinCount;
  //   drawContext.fillStyle = "white";
  //   drawContext.fillRect(i * barWidth, offset, 1, 2);
  // }

  if (this.isPlaying) {
    requestAnimFrame(this.draw.bind(this));
  }
};
// angle - in radians
function getLine(cx, cy, angle, t, oRadius, iRadius) {
  var radiusDiff = oRadius - iRadius, // calc radius diff to get max length
    length = radiusDiff * t; // now we have the line length

  return {
    x1: cx + oRadius * Math.cos(angle), // x1 point (outer)
    y1: cy + oRadius * Math.sin(angle), // y1 point (outer)
    x2: cx + (oRadius - length) * Math.cos(angle), // x2 point (inner)
    y2: cy + (oRadius - length) * Math.sin(angle) // y2 point (inner)
  };
}

// while (angle < Math.PI * 2) {
//   // our line function in action:
//   line = getLine(250, 250, angle, getFFT(), 240, 50);
//   ctx.lineWidth = 5; // beware of center area
//    cx.stroke(); // stroke all lines at once

//   ctx.moveTo(line.x1, line.y1); // add line to path
//   ctx.lineTo(line.x2, line.y2);
//   angle += angleStep; // get next angle
// // }

// to smooth the "FFT" random data
function getFFT() {
  return Math.random() * 0.16 + 0.4;
}
// to smooth the "FFT" random data
function getFFT() {
  return Math.random() * 0.16 + 0.4;
}
VisualizerSample.prototype.getFrequencyValue = function(freq) {
  var nyquist = context.sampleRate / 2;
  var index = Math.round((freq / nyquist) * this.freqs.length);
  return this.freqs[index];
};
