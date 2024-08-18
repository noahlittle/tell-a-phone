class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(1024);
    this.bufferIndex = 0;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    const channelData = output[0];

    for (let i = 0; i < channelData.length; i++) {
      if (this.bufferIndex < this.buffer.length) {
        channelData[i] = this.buffer[this.bufferIndex++];
      } else {
        channelData[i] = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);