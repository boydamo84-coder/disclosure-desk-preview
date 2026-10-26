# Android test alerts

Tap the bell (🔔) in the test app and enable either **Fresh video discoveries** or **Major-media UAP news**. Both are OFF by default.

Android WorkManager checks the public catalogue approximately every two hours. Android can delay background work for battery optimisation. Initial discovery checks create a baseline and do not notify about existing records. Future checks compare record IDs and notify of newly added video entries or sourced UAP headlines.

Android 13+ requires notification permission. You can turn either switch off any time. Current native alerts are only part of the APK; installing the website in Chrome does not enable them.

The world-news alerts feed is collected separately from mainstream media RSS results; the preview website's example News cards are **not** notification sources. A publisher attribution is not independent verification of an article's claims.
