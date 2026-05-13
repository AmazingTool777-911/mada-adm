import { define } from "../utils.ts";

export default define.page(function Home(_ctx) {
  console.log("GOOGLE_MAPS_API_KEY", Deno.env.get("GOOGLE_MAPS_API_KEY"));
  return null;
});
