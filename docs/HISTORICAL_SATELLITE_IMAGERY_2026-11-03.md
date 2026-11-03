# Disclosure Desk — Historical satellite imagery from sighting cases

**Approved:** 3 November 2026 (follow-up to “What Was in the Sky?” research roadmap)  
**Status:** First source-link client MILESTONE STAGED and GitHub static CI GREEN (`41693881342`, implementation SHA `dda6f9bd9a87bc400859d4664773adef04ba2480`); NO live deployment, NO ingested historical frames or overlay yet.
**Parent roadmap:** [Post-launch research enhancements](POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md).  
**Live baseline:** 11 tabs; no extra tab for this tool.

## Researcher experience — approved target

1. Open a dated case from Disclosure Map or Evidence & Documents. In the case file, see **🛰 See area at the time of this sighting** with approximate town/region and the **event's documented date**.
2. Click **Open NASA Worldview · area + case date** for events with daily NASA imagery from approximately March 2000 onward. The URL uses NASA's documented `p=geographic`, `v=` bounded view, `s=` approximate coordinate marker and `t=` historical date/time. **It is a selected browsing date, NOT proof an image exists for the exact event minute.** We use 12:00 UTC only as a transparent date-browsing anchor for cases without an actual sourced observation time.
3. Researcher can optionally type a **UTC time** to set the viewer timeline, separately labelled **manually supplied / not verified**. Do not write that back to the source case as established fact.
4. For cases as early as **17 August 1981**, offer the **Meteosat historical gallery**. Its public anniversary archive provides one suitable image/day (often near 12:00 UTC), with viewer calendar selection **manual** unless a stable documented date deep link is verified. Do NOT claim that clicking it automatically selects the exact sighting date.
5. **EUMETView** offers modern satellite products and timeline tools. For historic 10- or 15-minute frames, the next engineering phase should use the authorised EUMETSAT Data Store/long-term archive or verified official WMS layer and time range, including coverage, acquisition timestamp and licence/attribution checks. Do not assume EUMETView itself hosts all historic 10-minute layers or that deep links preserve scene and date without verification.
6. Future integrated **historical imagery on the Disclosure Map**: layer selector (visible/infrared/cloud), source-specific time slider, actual frame acquisition timestamps, before/after animation, case marker, evidence source link and uncertainty/coverage. Reuse existing Leaflet Map, not a new tab or replacement map. Only render an image when source actually returns it.
7. Adjacent **“What Was in the Sky?”** analysis (satellite positions/Starlink, ADS-B aircraft, meteor, launch, weather) is **different from weather satellite pictures**. Track separately; never assert that a pass or image resolves a sighting.

## Official sources and documented limits

| Service | Purpose | Verified reality | Link |
| --- | --- | --- | --- |
| NASA Worldview | Case-date/city historical imagery viewer with documented URL parameters and daily layers | Many daily imagery layers reach back roughly 2000; geostationary 10-minute layers are advertised for **last ~90 days**, not arbitrary past years; missing scenes possible | https://worldview.earthdata.nasa.gov/ ; https://github.com/nasa-gibs/worldview/blob/main/doc/url_parameters.md ; https://github.com/nasa-gibs/worldview |
| EUMETSAT Anniversary Viewer | Longer-running Europe/Africa historic weather imagery | From 17 Aug 1981, **one image/day** (usually noon UTC) with missing days; manual date selection | https://pics.eumetsat.int/ |
| EUMETView | Official Europe/global visualisations, satellite layers and time axes | Product-specific availability and time/coverage limits | https://view.eumetsat.int/ ; https://user.eumetsat.int/data-access |
| EUMETSAT Data Store | Historical imagery retrieval for subdaily weather-satellite frames | Operational MSG SEVIRI 15-minute full scans, MTG FCI 10-minute full scans are a sensor cadence, **not guarantee an accessible historical product at every event minute**; service access/licensing and download workflow to validate | https://user.eumetsat.int/data-access ; https://user.eumetsat.int/data/satellites/meteosat-second-generation/0-degree-service |

**Important:** Weather-satellite imagery predominantly resolves clouds and large atmospheric phenomena; even modern 0.5–2km-pixel instruments are NOT street-level overhead photos. Polar-orbiting imagery can be higher resolution but not continuous every few minutes. Weather satellite image acquisition is not a track of objects orbiting above the sighting.

## Privacy and evidence accuracy guardrails

- Source public cases have `eventDate` (YYYY-MM-DD), `lat`/`lon` of **approximate town centre**, and generally **no verified event time**. Our latest audit of `data/disclosure-map.json` found 276 current rows, all with date-only timestamps. Do not synthesize missing time; 12:00 UTC is a viewer navigation default only.
- Round published case coordinates to ~0.1 degree before passing to third party; never send signed-in user location, precise witness-report coordinates, EXIF, private research data, device geolocation or per-account IDs. Public witness reports are excluded from this first external-link feature.
- All third-party links use HTTPS and noreferrer/noopener. No background calls; user clicks deliberately to leave site. No paid API, no automatic historical download, no Netlify builds.
- Treat missing dates, before-provider coverage, cloud obscuration, missing tiles, timezone uncertainty, alternative explanations and unknown acquisition time as **not established**, not “clear sky” and not “not a UFO”.
- Always display source provider, observation datetime (not simply the sighting datetime), dataset resolution and provenance when later showing integrated images. Credit/licensing to be verified **per product** before embedding or redistribution.

## Acceptance / staged work

- New `assets/historical-satellite.js` source: validated dates, approximate-region bounding box and NASA documented query builder, safe official links, optional manual UTC-time input, explicit data-coverage caveats, 1981+ manual EUMETSAT link.
- `index.html`: existing case list offers **Historic satellite imagery** which opens that same case's Evidence file; case evidence pane inserts imagery provider handoff. No new tab; use current map and 11-tab navigation.
- New `scripts/test_historical_satellite.cjs` checks wrong dates, invalid coordinates, witness privacy, 1997 vs 2008 provider selection, URL date/time, no actual-time fabrication, safe links and case route. GitHub-only CI step; no external calls.
- **Still needed before live release:** actual browser opening verification across desktop and Samsung, visually inspect Worldview date/viewport and media-layer availability, confirm EUMETView archival coverage/terms, real historical frame retrieval and timestamp, integrate map-layer/time slider, user-sourced event-time workflow and full privacy/release QA.

## Follow-up: consistent case-card satellite research (3 November 2026)

- Add **🛰 Satellite view** to each existing public card family: **Map search results**, **Featured Case Files**, **Explore the Unknown / rabbit-hole cases**, and **Evidence Archive listings/details**. Each button opens a single case-scoped research dialogue with date, optional UTC time, location precision and official imagery viewer links.
- **Full dated/mapped cases:** preselect documented event YYYY-MM-DD and approximate public town position. NASA Worldview opens with date and bounded location. Optional UTC time is explicitly *researcher-entered*, not a verified sighting time, and the exact acquisition time cannot be verified from this link alone.
- **Year-only cases:** leave calendar date blank. Never turn “1947” into “1947-01-01” or pretend a publication/catalogue year equals the event. Researcher may enter a day to explore, explicitly unverified.
- **Archive records:** only use case coordinates if a mapped public record explicitly links by exact `archiveRecordId`. Otherwise show an honest “location not verified” warning and do not generate a NASA link to an invented pin. Public witness reports and private research are excluded from third-party handoff.
- **Before 1981:** no supported Meteosat public daily imagery verified; show source limitations. **1981 onward:** EUMETSAT Anniversary Viewer offers roughly one historical image/day, but requires manual calendar selection. **2000 onward:** NASA Worldview supports date-and-area handoff for daily products with provider-dependent gaps. The 10-minute geostationary layer is *recent-window only* unless separately sourced from an historical archive. 
- **Important acceptance distinction:** This interaction does **not retrieve or display a verified nearest timestamped satellite image inside Disclosure Desk** yet. Real nearest-acquisition-frame matching is a separate provider-data integration task requiring exact product, acquisition timestamp, licence, regional coverage and API availability. Do not misrepresent a date-selected map as an event-time image.
- GitHub-only QA extended for all case-card families, missing dates, exact archive-ID linking, privacy and 11-tab safety; needs browser/phone QA before release.

## Provider image layer selection (3 November 2026)

NASA's GIBS documentation confirms `MODIS_Terra_CorrectedReflectance_TrueColor` as a real layer with a temporal start of **24 February 2000**, daily coverage when scenes are available, and about **250 m** rendered imagery. Its official Worldview permalink supports `l=` to select this layer along with `t=` for the selected timeline date and `v=` for viewport. We now explicitly request the **MODIS Terra daily true-colour layer** rather than allowing the viewer to retain a modern default layer incompatible with older cases. The handoff remains a viewer search **not verification that a frame exists, nor a minute-resolution match**.

Source: NASA GIBS layer/Worldview metadata https://gis.earthdata.nasa.gov/portal/home/item.html?id=780c03ffe3dc42e8bb03ca3b07b283e and https://github.com/nasa-gibs/worldview/blob/main/doc/url_parameters.md . The client conservatively starts NASA daily handoff 1 March 2000; EUMETSAT remains the manual older-date fallback.
