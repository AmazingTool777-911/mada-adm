import { assertEquals } from "@std/assert";

import {
  camelToSnakeCase,
  isSnakeCase,
  prefixWithCamelCase,
  prefixWithSnakeCase,
} from "./string.utils.ts";

Deno.test("StringUtils - prefixWithSnakeCase", () => {
  assertEquals(
    prefixWithSnakeCase("MadaADM", "provinces"),
    "mada_adm_provinces",
  );
  assertEquals(prefixWithSnakeCase("mada_adm", "regions"), "mada_adm_regions");
  assertEquals(
    prefixWithSnakeCase("mada adm ", "communes"),
    "mada_adm_communes",
  );
  assertEquals(
    prefixWithSnakeCase("madaAdm", "fokontanys"),
    "mada_adm_fokontanys",
  );
  assertEquals(prefixWithSnakeCase("", "provinces"), "provinces");
  assertEquals(prefixWithSnakeCase(null, "regions"), "regions");
  assertEquals(prefixWithSnakeCase(undefined, "districts"), "districts");
});

Deno.test("StringUtils - prefixWithCamelCase", () => {
  assertEquals(prefixWithCamelCase("MadaADM", "provinces"), "madaAdmProvinces");
  assertEquals(prefixWithCamelCase("mada_adm", "regions"), "madaAdmRegions");
  assertEquals(prefixWithCamelCase("mada adm ", "communes"), "madaAdmCommunes");
  assertEquals(
    prefixWithCamelCase("madaAdm", "fokontanys"),
    "madaAdmFokontanys",
  );
  assertEquals(prefixWithCamelCase("", "provinces"), "provinces");
  assertEquals(prefixWithCamelCase(null, "regions"), "regions");
  assertEquals(prefixWithCamelCase(undefined, "districts"), "districts");
});

Deno.test("StringUtils - camelToSnakeCase", () => {
  assertEquals(camelToSnakeCase("camelCase"), "camel_case");
  assertEquals(camelToSnakeCase("thisIsATest"), "this_is_a_test");
  assertEquals(camelToSnakeCase("simple"), "simple");
  assertEquals(camelToSnakeCase("ID"), "id");
  assertEquals(camelToSnakeCase(""), "");
});

Deno.test("isSnakeCase", async (t) => {
  await t.step("returns true for valid snake_case strings", () => {
    assertEquals(isSnakeCase("hello_world"), true);
    assertEquals(isSnakeCase("foo_bar_baz"), true);
    assertEquals(isSnakeCase("my_variable_name"), true);
    assertEquals(isSnakeCase("with_123_numbers"), true);
    assertEquals(isSnakeCase("a_b"), true);
  });

  await t.step("returns false when no underscore is present", () => {
    assertEquals(isSnakeCase("helloworld"), false);
    assertEquals(isSnakeCase("camelCase"), false);
    assertEquals(isSnakeCase("kebab-case"), false);
    assertEquals(isSnakeCase(""), false);
  });

  await t.step(
    "returns false for strings starting or ending with underscore",
    () => {
      assertEquals(isSnakeCase("_hello_world"), false);
      assertEquals(isSnakeCase("hello_world_"), false);
      assertEquals(isSnakeCase("_hello_"), false);
    },
  );

  await t.step("returns false for consecutive underscores", () => {
    assertEquals(isSnakeCase("hello__world"), false);
    assertEquals(isSnakeCase("foo___bar"), false);
  });

  await t.step("returns false for uppercase letters", () => {
    assertEquals(isSnakeCase("Hello_World"), false);
    assertEquals(isSnakeCase("HELLO_WORLD"), false);
    assertEquals(isSnakeCase("hello_World"), false);
  });

  await t.step("returns false for special characters", () => {
    assertEquals(isSnakeCase("hello_world!"), false);
    assertEquals(isSnakeCase("hello_wörld"), false);
    assertEquals(isSnakeCase("hello_world world"), false);
  });
});
