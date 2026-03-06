package com.zlauncher.access;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class AccessConfig {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Path CONFIG_PATH = FabricLoader.getInstance().getConfigDir().resolve("zlauncher-access.json");

    public boolean accessibilityMode = false;
    public String side = "right";

    public static AccessConfig load() {
        if (!Files.exists(CONFIG_PATH)) {
            return new AccessConfig();
        }

        try {
            String raw = Files.readString(CONFIG_PATH, StandardCharsets.UTF_8);
            AccessConfig config = GSON.fromJson(raw, AccessConfig.class);
            return config == null ? new AccessConfig() : config;
        } catch (IOException | JsonSyntaxException ignored) {
            return new AccessConfig();
        }
    }

    public void save() {
        try {
            Files.createDirectories(CONFIG_PATH.getParent());
            Files.writeString(CONFIG_PATH, GSON.toJson(this), StandardCharsets.UTF_8);
        } catch (IOException ignored) {
        }
    }
}
