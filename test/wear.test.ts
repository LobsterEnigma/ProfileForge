import { describe, expect, it } from "vitest";
import { demoState } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";

describe("dressed for the weather", () => {
  it("holds an umbrella in the rain", () => {
    // Hungry pets have gone 4+ days without commits: it's raining.
    const svg = renderPetCard(demoState("hungry", "adult", undefined, "fox"));
    expect(svg).toContain('class="pf-rain"');
    expect(svg).toContain('class="pf-drip"');
    expect(renderPetCard(demoState("idle", "adult", undefined, "fox"))).not.toContain('class="pf-drip"');
  });

  it("wears a beanie in winter, but a nightcap in bed", () => {
    const winter = renderPetCard(demoState("idle", "adult", undefined, "fox"), { season: "winter" });
    expect(winter).toContain("#e03131"); // the beanie's red knit
    const bed = renderPetCard(demoState("sleeping", "adult", undefined, "fox"), { season: "winter" });
    expect(bed).not.toContain("#e03131");
  });

  it("catches an autumn leaf on its head, awake", () => {
    expect(renderPetCard(demoState("idle", "adult", undefined, "gopher"), { season: "autumn" })).toContain('class="pf-leaf"');
    expect(renderPetCard(demoState("idle", "adult", undefined, "gopher"), { season: "spring" })).not.toContain('class="pf-leaf"');
    expect(renderPetCard(demoState("sleeping", "adult", undefined, "gopher"), { season: "autumn" })).not.toContain('class="pf-leaf"');
  });

  it("kicks up dust when it lands from a happy bounce", () => {
    expect(renderPetCard(demoState("happy", "adult", undefined, "gopher"))).toContain('class="pf-dust"');
    expect(renderPetCard(demoState("idle", "adult", undefined, "gopher"))).not.toContain('class="pf-dust"');
  });
});
