# Hand artwork redraw

Replaced hand artwork with one newly generated transparent six-pose atlas. Broader bent thumb pads, visible nails, curled rear fingers and the same navy/black sleeve, white cuff and blue trim. Built-in image generation, one request; exact prompt in hands-v3-prompt.txt. Original generated PNG is outside the repo; the deployed lossless-alpha WebP is public/big-two/portrait/hands-v3.webp (1536×1024). Reference grip coordinates and curved thumb-contour data are recorded in hands-v3-contours.json; these are manually estimated, not pixel-perfect segmentation.

Updated grip anchors and foreground thumb contours for the new artwork. Preserved wide fan geometry and press/slide/release. Pointer targeting now checks actual rendered index centers so interpolation during layout movement does not cause the model position to differ from the visible target.

Browser preview checked initial two-hand fan, split one selected card, and five selected cards at 390×844 and 320×568. Five portrait tests and scoped strict TypeScript pass. Physical phone testing is not claimed. Generated artwork still uses composited 2D hands rather than a skeletal 3D hand model.
