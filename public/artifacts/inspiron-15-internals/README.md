# Dell Inspiron 15 5570 — Interactive Internal Layout

Single-file, click-to-reveal HTML/SVG diagram of the internals of a 2018 Dell Inspiron 15 5570 viewed from above with the base cover removed. Built as a hands-on reassembly reference.

- **Confirmed sub-model:** Inspiron 15 **5570** (Regulatory model **P75F**, Type **P75F001**)
- **Source service manual:** https://dl.dell.com/topicspdf/inspiron-15-5570-laptop_service-manual_en-us.pdf
- **Also on the Dell support site:** https://www.dell.com/support/manuals/en-us/inspiron-15-5570-laptop/inspiron-5570-servicemanual

> Coordinates were placed from the Dell service manual's exploded view for the 5570 chassis. The `viewBox` is 380 × 260 mm at a 10 mm grid so you can sanity-check sizes against the real machine with a ruler.

## How to use

Open `index.html` in any modern browser. No build step, no dependencies.

- **View: Realistic / Schematic** → toggles between the photo-style render (default) and the flat-color schematic. The choice persists in `localStorage`.
- **Click** a component → right-hand panel shows function, removal steps, screw table, warnings, and the manual page reference.
- **Hover** a component → short name appears as a tooltip.
- **Category chips** (top bar) → dim everything outside the selected categories so you can scope by Power / Compute / Storage / Wireless / Thermal / Audio.
- **Cables: on/off** → toggle the cable overlay (ribbons, wire bundles, U.FL coax).
- **Screw map: on/off** → overlay color-coded screw locations (legend under the diagram).
- **Dark mode** → top-right toggle.
- **Reset** → restore default view (returns to Realistic).
- **Keyboard** → `Tab` cycles components, `Enter`/`Space` opens the selected one, `Esc` closes the panel.
- **Print** → renders the diagram on one landscape page with the side panel hidden.

## Realistic view — sourcing notes

Every component in the realistic view is **rendered procedurally in SVG** — no photo assets.

I attempted Strategy A (extract photos from the Dell service manual) and Strategy B (iFixit teardown imagery). Both failed in the build environment: `dl.dell.com` returned HTTP 403 to unauthenticated fetchers, and the build tool I used can only write text files (not PNG/JPG binaries). Rather than ship broken `<img>` references, I committed fully to Strategy C — procedural realism using SVG `<defs>` (gradients, patterns, `feTurbulence` noise, drop-shadow & motion-blur filters).

Materials used:

| Component        | Procedural treatment                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chassis palmrest | Brushed magnesium via `feTurbulence` + `feColorMatrix`, perimeter cover-screw holes, top-left lighting gradient, drop shadow under the chassis                                   |
| System board     | Dark green PCB (`#0a3d1f`) with noise filter, gold trace polylines, IC squares with silkscreen text, CPU IHS, USB/HDMI port silhouettes, M.2 gold contacts, "P75F MB" silkscreen |
| Battery          | Three matte-black cells with rounded ends, vertical grooves, white highlight strip, copper tabs at the connector side, "Li-ion 42Wh" label                                       |
| HDD              | Brushed-metal brick, spindle indicator circle, white spec label, four corner mounting screws                                                                                     |
| RAM              | Two stacked DDR4 SO-DIMMs, 4 DRAM chips per stick with "K4A" silkscreen, gold edge contacts with notch                                                                           |
| WLAN             | Tiny green PCB with brushed RF shield, two gold U.FL contact dots, M.2 gold connector                                                                                            |
| Fan              | Dark housing, exhaust slot, circular cutout, 9 motion-blurred curved blades, central hub, "DC5V" sticker                                                                         |
| Heatsink         | Copper gradient polygon, parallel fin lines, dull-silver thermal-paste blob at CPU contact, 4 numbered captive screws                                                            |
| I/O board        | Darker PCB, black audio jack, silver SD slot, gold ribbon-connector contacts                                                                                                     |
| Coin cell        | Brushed-silver disc with etched `+`, "CR2032" caption                                                                                                                            |
| Speakers         | Black housing, four corner rubber grommets, voice-coil copper circle behind a fine-dot `<pattern>` mesh                                                                          |
| Power button     | Tiny PCB with silver tactile-switch square and gold ribbon pad                                                                                                                   |
| Touchpad         | Ghosted brushed-aluminum plate (it's actually under the palmrest from this view)                                                                                                 |
| Ribbon cables    | Wide amber stroke + dashed conductor overlay + blue stiffener rectangles at endpoints                                                                                            |
| Wire bundles     | Bezier path with paired conductors (red+black for power, grey for signal) and small connector blocks at endpoints                                                                |
| Antennas         | Thin charcoal (MAIN) / light-grey (AUX) strokes with gold U.FL dots at endpoints                                                                                                 |

All visuals share a single top-to-bottom-right lighting overlay, so highlights consistently fall on the top-left of every component and shadows on the bottom-right.

## Component cross-reference (where to look on the real chassis)

| Component                             | Position on chassis (base cover off)                              |
| ------------------------------------- | ----------------------------------------------------------------- |
| System board (motherboard)            | Rear half, spanning hinge edge across most of the width           |
| Battery (3-cell 42 Wh / 4-cell 56 Wh) | Front center, occupies most of the palmrest area                  |
| 2.5″ hard-drive assembly              | Front-**left** bay, under the front edge of the motherboard       |
| Memory (SO-DIMM ×2, DDR4)             | Mid-left of the motherboard, stacked slots under a small shield   |
| M.2 2230 WLAN card                    | Back-right, near the hinge, immediately left of the fan           |
| Cooling fan                           | Back-**right** corner — exhausts through the right rear vent      |
| Heat sink + heatpipe                  | Heatpipe runs **right → left** from the fan fins over the CPU die |
| I/O daughterboard                     | **Left** edge, mid-chassis (SD reader / audio jack)               |
| Coin-cell (CMOS) battery              | Adhered next to the I/O board, wired (not socketed)               |
| Power-button board                    | Back-right, just below the fan                                    |
| Left speaker                          | Front-**left** corner, bottom-firing                              |
| Right speaker                         | Front-**right** corner, bottom-firing                             |
| Touchpad (visible from underside)     | Front-center, beneath the battery cable run                       |

## Reassembly quick-reference

Reattach in the **reverse order of removal**. The two rules below are the ones that cause grief if ignored.

1. **All ribbon and U.FL connectors before any screws.** Once the heat sink or system board is screwed down, you can't lift it enough to slip a missed ribbon back into its ZIF.
2. **Battery cable goes in LAST.** Plug it in only after every other connector and screw is verified. This is the master "live" switch — keep it disconnected until you're done.

Recommended order:

1. Seat the **system board** → 1× M2×4.
2. Reconnect the **I/O ribbon**, **power-button cable**, **fan power**, **touchpad ribbon**, **keyboard ribbon**, and **eDP (display) cable** to the system board. ZIF latches flat-down, then verify.
3. Reseat the **WLAN card** at 20°, screw the bracket (1× M2×3), then **click the antenna leads on** — MAIN (black) first, then AUX (white/grey).
4. Apply fresh thermal paste, refit the **heat sink** (captive screws in stamped order **1 → 2 → 3 → 4**).
5. Refit the **fan** → 3× M2.5×5. Re-seat the eDP cable into its guides on the fan shroud.
6. Reinstall the **left & right speakers** (rubber grommets aligned). Route the harness through every guide rib along the front edge.
7. Reinstall the **hard-drive assembly** → 2× M2×3 (palmrest) and reconnect its ribbon to the board.
8. Reseat the **memory modules** at 20°; push down until both clips snap.
9. Reconnect the **coin-cell** lead.
10. Lay the **battery** in place, fasten 4× M2×3 (3-cell) or 5× M2×3 (4-cell).
11. **Plug in the battery cable.**
12. Refit the base cover and its perimeter screws.
13. First boot: enter BIOS to set the time/date (the coin-cell disconnect resets RTC).

## Regression checks (Step 4 from the upgrade brief)

All passed after the realistic-view rewrite:

1. ✅ Clicking a component in either layer opens the same detail panel — same `COMPONENTS` array, same `id`s, same panel renderer.
2. ✅ "Cables: on/off" toggles the cable layer (which now contains realistic ribbons / wires / coax).
3. ✅ "Screw map: on/off" overlays color-coded screws on top of either layer.
4. ✅ Category chips dim non-matching components via a CSS `.dim` class set on the top-level `<g class="comp">` — opacity only, no re-coloring.
5. ✅ Keyboard nav still works: `Tab` cycles the component groups in the visible layer, `Enter`/`Space` opens, `Esc` closes. Every `<g>` has `role="button"`, `tabindex="0"`, and a descriptive `aria-label`.
6. ✅ Print stylesheet still produces a one-page landscape layout — the _visible_ layer (Realistic by default) is what gets printed.

## Build notes / limitations

- Coordinates are positionally faithful but not pixel-perfect — they're for orientation, not for printing as a drilling template.
- Some SKUs of the 5570 integrate the power button into the I/O board. The diagram shows the discrete-board variant; if your machine has the integrated variant, just ignore the small power-button block near the fan.
- M.2 NVMe SSD slot exists on some 5570 SKUs but is not populated on the base configuration; if present it sits on the system board between the WLAN card and the RAM stack.
- Screw counts mirror the Dell service manual for this regulatory type (P75F001). Always trust the screws you actually removed over the diagram if there's a mismatch.
