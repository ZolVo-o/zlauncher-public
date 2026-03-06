package com.zlauncher.access;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import net.minecraft.text.Text;
import org.lwjgl.glfw.GLFW;

public final class ZLauncherAccessClient implements ClientModInitializer {
    private static final String CATEGORY = "key.categories.zlauncher_access";

    private static KeyBinding toggleModeKey;
    private static KeyBinding switchSideKey;
    private static KeyBinding sneakToggleKey;
    private static KeyBinding sprintToggleKey;

    private static AccessConfig config;
    private static boolean remapApplied = false;
    private static boolean sneaking = false;
    private static boolean sprinting = false;

    @Override
    public void onInitializeClient() {
        config = AccessConfig.load();

        toggleModeKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
                "key.zlauncher_access.toggle_mode",
                InputUtil.Type.KEYSYM,
                GLFW.GLFW_KEY_F8,
                CATEGORY
        ));
        switchSideKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
                "key.zlauncher_access.switch_side",
                InputUtil.Type.KEYSYM,
                GLFW.GLFW_KEY_F9,
                CATEGORY
        ));
        sneakToggleKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
                "key.zlauncher_access.sneak_toggle",
                InputUtil.Type.KEYSYM,
                GLFW.GLFW_KEY_RIGHT_ALT,
                CATEGORY
        ));
        sprintToggleKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
                "key.zlauncher_access.sprint_toggle",
                InputUtil.Type.KEYSYM,
                GLFW.GLFW_KEY_BACKSLASH,
                CATEGORY
        ));

        ClientTickEvents.END_CLIENT_TICK.register(this::tick);
    }

    private void tick(MinecraftClient client) {
        if (client == null || client.options == null) {
            return;
        }

        while (toggleModeKey.wasPressed()) {
            config.accessibilityMode = !config.accessibilityMode;
            config.save();
            applyOrResetRemap(client);
            send(client, "Спецрежим: " + (config.accessibilityMode ? "ВКЛ" : "ВЫКЛ"));
        }

        while (switchSideKey.wasPressed()) {
            config.side = "right".equalsIgnoreCase(config.side) ? "left" : "right";
            config.save();
            if (config.accessibilityMode) {
                applyRemap(client);
            }
            send(client, "Сторона управления: " + ("right".equalsIgnoreCase(config.side) ? "ПРАВАЯ" : "ЛЕВАЯ"));
        }

        if (!config.accessibilityMode) {
            if (remapApplied) {
                resetRemap(client);
            }
            return;
        }

        if (!remapApplied) {
            applyRemap(client);
        }

        while (sneakToggleKey.wasPressed()) {
            sneaking = !sneaking;
            client.options.sneakKey.setPressed(sneaking);
            send(client, "Приседание: " + (sneaking ? "ВКЛ" : "ВЫКЛ"));
        }

        while (sprintToggleKey.wasPressed()) {
            sprinting = !sprinting;
            client.options.sprintKey.setPressed(sprinting);
            send(client, "Спринт: " + (sprinting ? "ВКЛ" : "ВЫКЛ"));
        }
    }

    private void applyOrResetRemap(MinecraftClient client) {
        if (config.accessibilityMode) {
            applyRemap(client);
        } else {
            resetRemap(client);
        }
    }

    private void applyRemap(MinecraftClient client) {
        if ("right".equalsIgnoreCase(config.side)) {
            client.options.forwardKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_I, 0));
            client.options.backKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_K, 0));
            client.options.leftKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_J, 0));
            client.options.rightKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_L, 0));
            client.options.jumpKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_O, 0));
            client.options.sneakKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_U, 0));
            client.options.sprintKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_P, 0));
            client.options.inventoryKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_H, 0));
            client.options.attackKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_ENTER, 0));
            client.options.useKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_RIGHT_SHIFT, 0));
        } else {
            client.options.forwardKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_W, 0));
            client.options.backKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_S, 0));
            client.options.leftKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_A, 0));
            client.options.rightKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_D, 0));
            client.options.jumpKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_SPACE, 0));
            client.options.sneakKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_LEFT_SHIFT, 0));
            client.options.sprintKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_LEFT_CONTROL, 0));
            client.options.inventoryKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_E, 0));
        }

        remapApplied = true;
        KeyBinding.updateKeysByCode();
        client.options.write();
    }

    private void resetRemap(MinecraftClient client) {
        client.options.forwardKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_W, 0));
        client.options.backKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_S, 0));
        client.options.leftKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_A, 0));
        client.options.rightKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_D, 0));
        client.options.jumpKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_SPACE, 0));
        client.options.sneakKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_LEFT_SHIFT, 0));
        client.options.sprintKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_LEFT_CONTROL, 0));
        client.options.inventoryKey.setBoundKey(InputUtil.fromKeyCode(GLFW.GLFW_KEY_E, 0));
        client.options.attackKey.setBoundKey(InputUtil.Type.MOUSE.createFromCode(GLFW.GLFW_MOUSE_BUTTON_LEFT));
        client.options.useKey.setBoundKey(InputUtil.Type.MOUSE.createFromCode(GLFW.GLFW_MOUSE_BUTTON_RIGHT));

        remapApplied = false;
        sneaking = false;
        sprinting = false;
        client.options.sneakKey.setPressed(false);
        client.options.sprintKey.setPressed(false);
        KeyBinding.updateKeysByCode();
        client.options.write();
    }

    private static void send(MinecraftClient client, String message) {
        if (client.player != null) {
            client.player.sendMessage(Text.literal("[ZAccess] " + message), true);
        }
    }

}
