import { Transform } from "node:stream";
import { StringDecoder } from "node:string_decoder";

export function uppercaseTransform(): Transform {
  const decoder = new StringDecoder("utf8");
  return new Transform({
    transform(chunk: Buffer, _enc, callback) {
      // decoder buffers any incomplete multi-byte sequence until the next chunk.
      callback(null, decoder.write(chunk).toUpperCase());
    },
    flush(callback) {
      const rest = decoder.end();
      callback(null, rest ? rest.toUpperCase() : undefined);
    },
  });
}
