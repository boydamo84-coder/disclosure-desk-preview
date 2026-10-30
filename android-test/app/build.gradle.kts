plugins { id("com.android.application") }
android {
    namespace = "com.disclosuredesk.preview"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.disclosuredesk.preview"
        minSdk = 26
        targetSdk = 35
        versionCode = 9
        versionName = "0.8-ads-test"
    }
    buildTypes { getByName("release") { isMinifyEnabled = false } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}

dependencies { implementation("androidx.work:work-runtime:2.9.1"); implementation("com.google.android.gms:play-services-ads:25.5.0"); implementation("com.google.android.ump:user-messaging-platform:3.2.0") }
