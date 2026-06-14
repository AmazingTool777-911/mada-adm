import { assertEquals } from "@std/assert";
import { decodeToJsonObject, encodeToBase64 } from "./json-base64.helper.ts";

Deno.test("json-base64 helper", async (t) => {
  await t.step("encode — correctly converts object to base64 string", () => {
    const obj = { message: "Hello, World!", count: 42 };
    const result = encodeToBase64(obj);
    const expected = btoa(JSON.stringify(obj));
    assertEquals(result, expected);
  });

  await t.step("decode — correctly parses base64 string back to object", () => {
    const original = { hello: "world", id: 123 };
    const base64Str = btoa(JSON.stringify(original));
    const result = decodeToJsonObject<{ hello: string; id: number }>(base64Str);
    assertEquals(result, original);
  });

  await t.step("encode and decode — reversible operation", () => {
    const obj = { test: true, nested: { val: 1 } };
    const encoded = encodeToBase64(obj);
    const decoded = decodeToJsonObject(encoded);
    assertEquals(decoded, obj);
  });
});
