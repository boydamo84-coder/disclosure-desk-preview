plugins { id("com.android.application") }
android {
    namespace = "com.boyddigitalstudios.wneresearch.beta"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.boyddigitalstudios.wneresearch.beta"
        minSdk = 29
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-dev"
    }
    buildTypes { getByName("release") { isMinifyEnabled = false } }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
}
