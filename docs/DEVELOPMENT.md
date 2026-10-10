# Development

No framework, bundler, build step or runtime dependency. Load the repository root as an unpacked Chrome extension.

Refresh editor assets and preset JSONs with `node scripts/refresh-assets.cjs`. It keeps extension and Pages implementations aligned. The Workshop catalog adds bilingual descriptions separately in `docs/workshop.js`.

Reaction parameters are part of project version 1: `reactiveMode` (`off`, `flash`, `ripple`, `heat`), `reactiveColor` (three RGB bytes), `reactiveDecay` (0.2–3 seconds), `reactiveStrength` (10–100%). Missing values default to off. Reactions overlay the normal frame without modifying its source. `CidooHeartMath.Reactions` holds at most 32 transient hits; HID output still uses the configured FPS and Layer 2-only write path.

`activeTab` is used only when the popup's “Connect key presses from this tab” action injects `layout.js` into the chosen HTTP(S) tab. The isolated listener forwards a matrix index, never text or field values. The worker accepts these events only from attached tabs or its own extension pages; website content scripts cannot invoke controller actions. Capture stops when detached or when playback stops. Browser refresh/navigation requires reattachment; it is not a global Windows keyboard hook.

## Files

| File | Purpose |
|---|---|
| `worker.js` | Message routing and keyboard shortcuts |
| `hid.js` | HID page reads, Layer 2-only writes and background playback |
| `bridge.js` | One-time device identification and website connection handoff |
| `animation.js` | Built-in effects and timeline renderer |
| `project.js` | Strict JSON validation and canonical project format |
| `layout.js` | CIDOO C80 labels and matrix indexes |
| `studio.*` | Full editor: selection, frames, preview, library, import/export |
| `popup.*` | Compact preset controls and editor entry point |
| `i18n.js`, `_locales/` | RU/EN interface and Chrome extension metadata |
| `tests/` | Node tests with a simulated HID device |

Run `npm test` using Node.js 18+. The tests have no external dependencies and do not contact a keyboard.

Windows updater checks: `powershell.exe -NoProfile -File tests/updater.test.ps1`. These use mocked GitHub requests and temporary installations to verify updates, no-op checks, failed downloads, checksums, archive path rejection and rollback. They do not update the installed extension or contact GitHub.

Package a release: `powershell.exe -NoProfile -File scripts/package.ps1`. It includes only runtime files, translations, licence, README files and the Windows updater. Upload the generated `cidoo-rgb-studio-v<VERSION>.zip` to a stable release with tag `v<VERSION>` matching the manifest. The updater accepts only known files; when adding runtime assets, update both packaging and updater allowlists. GitHub release asset SHA-256 digests are checked when supplied; release ownership and HTTPS remain the trust boundary.

## Layer contract

The UI source is Layer 1, whose protocol index is `0`. It is read-only. The output is Layer 2, whose protocol index is `1`. `hid.js` creates write packets with a fixed `LAYER = 1`; the JSON project cannot change this.

Before playback, Layer 1 is read from the device again. Unselected keys keep its colours. Stopping or timer expiry writes this source snapshot to Layer 2. The optional Layer 2 backup is a separate operation saved before explicit copying.

The active WebHID connection keeps the extension service worker alive in Chrome 117+. The handle closes when idle. Playback never calls `chrome.scripting` or relies on a document timer. No automatic playback resumes after a browser restart.

## Project JSON

Use `examples/` as valid full-size examples. Important fields:

```json
{
  "format": "cidoo-rgb-studio",
  "version": 1,
  "sourceLayer": 1,
  "targetLayer": 2,
  "name": "My animation",
  "effect": "timeline",
  "keys": [5, 6, 9, 10],
  "interpolation": "smooth",
  "fps": 8,
  "duration": 0
}
```

This excerpt omits `sourceColors` and `frames`; it is not an importable file. Both source snapshots and frame colours use flat arrays of **396 integers**, RGB triples for matrix indexes 0–131. `duration` is seconds, with `0` meaning Never. Each frame has `durationMs` and `colors`. Frame duration must be 50–60000 ms, maximum 120 frames.

Smooth mode interpolates current frame → next frame over the current frame's duration, including last → first. Step mode holds each frame for its duration. Only indexes in `keys` are copied from frame colours; other indexes retain the device's source snapshot.

Do not change `sourceLayer`/`targetLayer` to implement another model. Another keyboard needs a separately verified layout, report descriptor and protocol.

## Protocol examined

- Output report ID: `1`, 63-byte payloads.
- Lighting configuration read: `0x07, 0x01`; custom mode `10`, power on `0`.
- Custom colours read: `0x09, 0x80` for Layer 1; `0x09, 0x81` for Layer 2.
- Colour writes: `0x09, 0x01`, pages 0–7, up to 54 data bytes per page.
- 396 bytes total, 5 ms spacing between output packets, matching the website SDK.

Some firmware pads the final response page to 54 bytes. The reader accepts that padding but copies only the 18 bytes belonging to the final six indexes. It waits for all eight unique pages, tolerates their order and duplicate responses, and rejects incomplete reads.

Source: [CIDOO website build examined on 2026-10-09](https://cidoo.illumipc.com/app.js?v=1791540519454). Device flash/RAM behaviour has not been documented by the manufacturer.

## GitHub discovery

The README uses the actual model name and capability terms: CIDOO C80, RGB animation editor, Chrome extension, WebHID, custom keyboard lighting. In repository **About → Topics**, useful topics are `cidoo`, `cidoo-c80`, `keyboard`, `rgb`, `rgb-lighting`, `chrome-extension`, `webhid`, `animation-editor`.

GitHub topics help people find related repositories. Public search-engine indexing is controlled by search engines; publication does not guarantee immediate Google results. No hidden keyword blocks or generated search pages are included.

## Licence

Keep `LICENSE` and `NOTICE` with distributions and forks. The project is source-available for noncommercial use under PolyForm Noncommercial 1.0.0, not an unrestricted commercial-use licence.

## Подключение и шаблоны (1.3)

`connect.html` / `connect.js` выполняют выбор WebHID в постоянной вкладке. Устройство определяется до нажатия кнопки, `requestDevice` вызывается прямо внутри пользовательского клика. `presets.js` создаёт редактируемые проекты без внешних запросов. Совместимость физического протокола и раскладки проверяется отдельно для каждой модели.

В 1.4 проект хранит `restoreMode`: `hold` (по умолчанию), `previous` или `source`. `studioView` отдельно хранит активный кадр, позицию паузы и выделение для рисования. В timeline `project.keys` — область воспроизведения; выделение для рисования её не изменяет.
