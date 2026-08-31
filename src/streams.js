'use strict';

const { Transform } = require('node:stream');

const getStream = (client, streamId) => {
  const stream = client.streams.get(streamId);
  if (!stream) throw new Error(`Stream ${streamId} not found`);
  return stream;
};

const createStream = (client, streamId, metadata = {}, options = {}) => {
  const transform = new Transform({
    transform(chunk, encoding, callback) {
      this.push(chunk);
      callback();
    },
  });

  const stream = {
    id: streamId,
    readable: transform,
    writable: transform,
    metadata,
    bytesReceived: 0,
    createdAt: Date.now(),
    direction: options.direction || 'upload',
  };

  if (options.direction === 'download' && client.isWebSocket()) {
    const transport = client.getTransport();
    transform.on('data', (chunk) => {
      transport.sendStreamChunk(streamId, chunk);
    });
    transform.on('end', () => {
      endStream(client, streamId);
    });
    transform.on('error', (err) => {
      client.send({
        type: 'stream',
        id: streamId,
        status: 'error',
        error: err.message,
      });
      terminateStream(client, streamId);
    });
  }

  client.streams.set(streamId, stream);
  return stream;
};

const endStream = (client, streamId) => {
  const stream = client.streams.get(streamId);
  if (!stream) return;
  if (stream.writable && !stream.writable.destroyed) stream.writable.end();
  client.streams.delete(streamId);
};

const terminateStream = (client, streamId) => {
  const stream = client.streams.get(streamId);
  if (!stream) return;
  if (stream.writable && !stream.writable.destroyed) stream.writable.destroy();
  client.streams.delete(streamId);
};

const destroyAllStreams = (client) => {
  for (const stream of client.streams.values()) {
    if (stream.writable && !stream.writable.destroyed) stream.writable.destroy();
  }
  client.streams.clear();
};

module.exports = {
  getStream,
  createStream,
  endStream,
  terminateStream,
  destroyAllStreams,
};
