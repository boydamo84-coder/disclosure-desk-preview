# Disclosure Desk Android news and video alerts

Open the bell (🔔) in the Android app to enable **Major-media UAP news** or **Fresh video discoveries**. Each is optional and OFF by default; private Chat messages have a separate optional setting.

**News:** the native Android background worker checks the same source-attributed live catalogue used by the website approximately every **30 minutes**. The website's GitHub news collector runs at minute 17 and 47 of each hour, and the open website ticker checks for new catalogue updates every 10 minutes while visible. The collector is separate from the Netlify deployment; it does **not** rebuild the whole website per refresh.

**Videos:** checks remain approximately every **2 hours**, to avoid downloading the much larger catalogue every 30 minutes. This saves data and battery.

Android uses WorkManager, so the times are not guarantees. Battery restrictions, poor connections, Doze and network failures can delay checks. Existing subscriptions are upgraded from the old combined 2-hour job to separate news/video jobs automatically, with the same opt-in settings. The first check records a baseline and does not notify about old records; subsequent checks compare IDs.

Android 13+ requires notification permission. You can disable alerts in the bell settings. News alerts only use sourced major-media reporting, not claims of proven extraordinary events. Publisher attribution does not independently verify a claim.

Native alerts only work in the Android APK/AAB, not simply by adding the website to a phone's home screen. Private Chat Firebase push notifications are a **separate release gate** requiring authenticated device registration and a secure server sender; the news/video worker is not a substitute for real-time messaging.
