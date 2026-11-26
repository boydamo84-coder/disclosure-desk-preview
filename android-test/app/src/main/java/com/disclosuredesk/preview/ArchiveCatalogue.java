package com.disclosuredesk.preview;

import android.util.JsonReader;
import android.util.JsonToken;

import java.io.IOException;
import java.io.Reader;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;

final class ArchiveCatalogue {
    static final class Record {
        String id = "", title = "", source = "", category = "", description = "", url = "", kind = "";
        int year;
    }

    private final Map<String, Record> records = new LinkedHashMap<>();

    void read(Reader input) throws IOException {
        try (JsonReader json = new JsonReader(input)) {
            json.beginArray();
            while (json.hasNext()) {
                if (json.peek() != JsonToken.BEGIN_OBJECT) {
                    json.skipValue();
                    continue;
                }
                Record record = new Record();
                json.beginObject();
                while (json.hasNext()) {
                    String key = json.nextName();
                    if ("year".equals(key) && json.peek() == JsonToken.NUMBER) {
                        record.year = json.nextInt();
                    } else if (json.peek() == JsonToken.STRING) {
                        String value = json.nextString();
                        switch (key) {
                            case "id": record.id = value; break;
                            case "title": record.title = value; break;
                            case "source": record.source = value; break;
                            case "category": record.category = value; break;
                            case "description": record.description = value; break;
                            case "url": record.url = value; break;
                            case "kind": record.kind = value; break;
                        }
                    } else {
                        json.skipValue();
                    }
                }
                json.endObject();
                if (!record.id.isEmpty() && !record.title.isEmpty() && !record.source.isEmpty()
                        && !record.kind.isEmpty() && record.year != 0 && isSourceUrl(record.url)) {
                    records.putIfAbsent(record.id, record);
                }
            }
            json.endArray();
        }
    }

    List<Record> records() {
        return new ArrayList<>(records.values());
    }

    private static boolean isSourceUrl(String value) {
        try {
            java.net.URI uri = java.net.URI.create(value);
            return ("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null && uri.getRawUserInfo() == null;
        } catch (IllegalArgumentException error) {
            return false;
        }
    }
}
