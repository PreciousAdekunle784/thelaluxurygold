declare module "heic-decode" {
  interface DecodedImage {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }
  export default function decode(input: { buffer: ArrayBuffer | Uint8Array | Buffer }): Promise<DecodedImage>;
}
