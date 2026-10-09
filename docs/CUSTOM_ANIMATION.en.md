# Create an animation without coding

[Русский](CUSTOM_ANIMATION.md)

Your source design lives in the keyboard's **Layer 1**. The extension reads it and sends colours only to **Layer 2**. The editor cannot write to Layer 1.

## Animate an existing design

1. Draw your design in Layer 1 on the [CIDOO website](https://cidoo.illumipc.com/#/). This step happens on the website, not in the extension.
2. Select **Custom → Layer 2** on the website and enable lighting.
3. Open the extension → **Open animation editor**.
4. Click **Connect C80** and select your keyboard in Chrome. The website disconnects because control moves to the extension.
5. Click **Read Layer 1** to load your actual colours.
6. Click keys on the keyboard diagram. A purple outline means the key is animated. Other keys retain their source colours.
7. Choose **Gentle breathing** or **Heartbeat** and adjust tempo and brightness.
8. Click **Preview**, then **Run on C80** when you like the result.

Use **Heart** for the included heart shape. For another design, click **Clear selection** and select your own keys. **By colour** selects keys with the exact RGB value in the adjacent colour field. Selecting red `#ff0000`, for example, leaves a green Caps Lock unchanged.

The extension reads Layer 1 again before each real start. Stopping restores that design to Layer 2.

## Draw a sequence of frames

A frame is a set of colours shown briefly. Several frames make an animation.

Example: a dim red heart fades to bright pink and back.

1. Select the heart keys and choose **Custom frames**. **Frame 1** appears with your source colours.
2. Set **Source brightness** to **15%** and click **Apply brightness**. Only selected keys change.
3. Set **Frame duration** to **600 ms**.
4. Click **Duplicate** to open **Frame 2**.
5. Set **Colour** to `#ff6689`, then click **Fill selected**.
6. Set the second frame to **300 ms**.
7. Select **Smooth** transitions and click **Preview**.

With smooth transitions, each frame fades into the next over its duration. The final frame fades back to the first, repeating the sequence. With **Instant** transitions, each frame holds its colours for its duration and then switches.

You can add up to 120 frames. Each lasts between 50 ms and one minute. **Duplicate** copies the selected frame's colours and duration. **+ Frame** creates a frame from the source design. **Undo last change** reverses the previous edit.

**Source brightness** multiplies the original Layer 1 RGB values by the chosen percentage. Use **Colour** and **Fill selected** for an arbitrary colour. These edits change project frames only, never Layer 1.

## Choose when to stop

- **Never** — runs until you press **Stop**. There is no session time limit.
- **Timer** — enter hours, minutes and seconds. The timer begins when the animation starts and restores the source design when it ends.

The timer does not change the loop length. A one-second frame sequence can repeat for 30 minutes.

Keep **8 frames/s** for lower load. Try 12 for smoother transitions, or 4 to reduce updates further.

## Save and share

- **Save to library** stores the project inside the extension. Saving the same name replaces that library entry.
- **Download JSON** creates an animation file to share or add to the repository.
- **Open JSON** loads that file into the editor.

Drafts save automatically. Editing controls does not change an already running effect until you start it again. Uninstalling the extension deletes its library, so export important projects.

The file includes selected keys, frames, timing and a source snapshot for preview. On another keyboard, the extension reads that keyboard's actual Layer 1 before starting. Frame colours affect selected keys; the background comes from that keyboard's Layer 1.

## Troubleshooting

- **No connection:** load the extension in Chrome and enable Custom → Layer 2 on the website first.
- **Website shows disconnected:** expected after handing control to the extension.
- **Keys do not animate:** make sure they have purple selection outlines.
- **Preview works but the device does not:** preview controls the screen only. Connect the keyboard and click **Run on C80**.
- **Colours differ from the file:** the keyboard's current Layer 1 is the source. Click **Read Layer 1** first.
- **Wrong frame changed:** select the intended frame in the timeline before editing.

You can close the editor and CIDOO tab after starting. Keep Chrome running and the computer awake. USB disconnection or computer sleep interrupts the animation. Press **Stop** before quitting Chrome. Do not reconnect the website or another RGB controller while the extension is animating.

## Ready-made full-keyboard animations

Choose **Ready-made animations → Russian flag / Flowers / Northern lights / Comet / Fireflies → Open preset**. Press **Preview** to watch it on screen, then connect the keyboard and run. All frames are editable. The flag alternates between white-blue-red horizontal bands (800 ms) and lights off (500 ms). Adjust the two frame durations to change the blink rate.
