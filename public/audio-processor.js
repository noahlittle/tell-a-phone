class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(1024);
    this.bufferIndex = 0;
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const inputData = event.data;
    for (let i = 0; i < inputData.length; i++) {
      this.buffer[this.bufferIndex] = inputData[i];
      this.bufferIndex++;
      if (this.bufferIndex >= this.buffer.length) {
        this.bufferIndex = 0;
      }
    }
  }

  process(inputs, outputs) {
    const output = outputs[0];
    const channel = output[0];

    for (let i = 0; i < channel.length; i++) {
      channel[i] = this.buffer[(this.bufferIndex + i) % this.buffer.length];
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
