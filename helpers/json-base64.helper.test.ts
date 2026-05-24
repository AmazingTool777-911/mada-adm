import { assertEquals } from "jsr:@std/assert";
import { decode, encode } from "./json-base64.helper.ts";

Deno.test("json-base64 helper", async (t) => {
  await t.step("encode — correctly converts object to base64 string", () => {
    const obj = { message: "Hello, World!", count: 42 };
    const result = encode(obj);
    const expected = btoa(JSON.stringify(obj));
    assertEquals(result, expected);
  });

  await t.step("decode — correctly parses base64 string back to object", () => {
    const original = { hello: "world", id: 123 };
    const base64Str = btoa(JSON.stringify(original));
    const result = decode<{ hello: string; id: number }>(base64Str);
    assertEquals(result, original);
  });

  await t.step("encode and decode — reversible operation", () => {
    const obj = { test: true, nested: { val: 1 } };
    const encoded = encode(obj);
    const decoded = decode(encoded);
    assertEquals(decoded, obj);
  });
});
