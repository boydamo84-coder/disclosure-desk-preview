"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html", "utf8");
const studio = "https://boyddigitalstudios.com/";
assert.equal((html.match(/href="https:\/\/boyddigitalstudios\.com\/"/g) || []).length, 2, "Official domain must appear in About and credit");
assert.match(html, /<h3>By Boyd Digital Studios<\/h3>[\s\S]{0,600}https:\/\/boyddigitalstudios\.com\//);
assert.match(html, /dd-studio-footer-credit[^>]*>Created by <a href="https:\/\/boyddigitalstudios\.com\//);
assert.doesNotMatch(html, /wixsite\.com/i, "Do not reintroduce Wix studio links");
assert.match(html, /https:\/\/uapdisclosuredesk\.com\//, "Disclosure Desk origin unchanged");
assert.match(html, /mailto:support@uapdisclosuredesk\.com/, "Support email unchanged");
if (process.argv.includes("--android")) {
  const java = fs.readFileSync("android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java", "utf8");
  assert.match(java, /STUDIO_URL = "https:\/\/boyddigitalstudios\.com\/"/);
  assert.match(java, /Boyd Digital Studios website.*openStudioWebsite\(\)/);
  assert.match(java, /openStudioWebsite\(\)[\s\S]{0,250}Intent\.ACTION_VIEW,Uri\.parse\(STUDIO_URL\)/);
  assert.match(java, /HOME = "https:\/\/uapdisclosuredesk\.com\/"/);
  const gradle = fs.readFileSync("android-test/app/build.gradle.kts", "utf8");
  assert(gradle.includes('applicationIdSuffix = ".beta.m96m"'));
  assert(gradle.includes('versionCode = 31'));
  assert(gradle.includes('0.14.7-m96m-studio-beta'));
  assert.match(java, /SUPPORT_URL = "https:\/\/ko-fi\.com\/disclosuredesk"/);
}
console.log("PASS: Boyd Digital Studios domain / Disclosure Desk safeguards", studio, process.argv.includes("--android") ? "(Android)" : "(web)");
