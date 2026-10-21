# Breadcrumb

Explorable captured prototype with two journeys, 12 screens, optional guidance, free screen navigation, back history, modal close/cancel branches, and session-local sample text entry.

Live demo: https://aim-infinity.github.io/breadcrumb/

`prototype.json` defines screens and explicit hotspot destinations. `prototype.js` renders the experience without an extension or backend. Links in the address hash preserve the selected screen and mode. Text input is simulated and never submitted. Screens and control areas that were not captured are unavailable; Open original links to the real application.

The demo includes hand-authored return paths. It does not yet automatically discover branches or publish from the Chrome extension. Existing screenshots retain any recording UI visible at capture time. The original screenshot-only viewer assets remain for reference.

## HTML capture proof of concept

[Open the HTML prototype](https://aim-infinity.github.io/breadcrumb/html/).

This uses actual HTML states captured from the bundled Agentry sample app, not screenshots. Native input and select controls work. The Create and Cancel buttons navigate to explicitly mapped states. Map interactions allows changing those destinations locally; Export mapped prototype saves a standalone HTML file. These changes are not automatically published back to this repository. Original app scripts and backend actions are excluded. The Lovable recordings need fresh HTML captures before they can use this player.
