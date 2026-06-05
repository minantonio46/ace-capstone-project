package com.medical.skeleton.domain.camera.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Base64;
import java.util.regex.Pattern;

@Service
public class SkeletonDataService {

    private static final byte[] MAGIC = "SKEL1".getBytes(StandardCharsets.US_ASCII);
    private static final int IV_LENGTH = 12;
    private static final int GCM_TAG_BITS = 128;
    private static final Pattern SAFE_DATA_ID = Pattern.compile("[A-Za-z0-9_-]+");

    private final ObjectMapper objectMapper;
    private final String configuredKey;
    private final Path keyFile;

    public SkeletonDataService(
            ObjectMapper objectMapper,
            @Value("${skeleton.encryption-key:}") String configuredKey,
            @Value("${skeleton.key-file:.skeleton-encryption-key}") String keyFile) {
        this.objectMapper = objectMapper;
        this.configuredKey = configuredKey;
        this.keyFile = Paths.get(keyFile).toAbsolutePath().normalize();
    }

    public JsonNode load(String dataId) {
        if (!SAFE_DATA_ID.matcher(dataId).matches()) {
            throw new IllegalArgumentException("Invalid skeleton data ID.");
        }

        byte[] encrypted = readEncryptedResource(dataId);
        byte[] plaintext = decrypt(encrypted, loadKey());

        try {
            return objectMapper.readTree(plaintext);
        } catch (IOException e) {
            throw new IllegalStateException("Decrypted skeleton data is not valid JSON.", e);
        } finally {
            Arrays.fill(plaintext, (byte) 0);
        }
    }

    private byte[] readEncryptedResource(String dataId) {
        String resourcePath = "encrypted-skeleton/" + dataId + ".json.enc";
        ClassPathResource resource = new ClassPathResource(resourcePath);

        if (!resource.exists()) {
            throw new IllegalArgumentException("Skeleton data not found: " + dataId);
        }

        try (var inputStream = resource.getInputStream()) {
            return inputStream.readAllBytes();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read encrypted skeleton data.", e);
        }
    }

    private SecretKeySpec loadKey() {
        String encodedKey = configuredKey == null ? "" : configuredKey.trim();

        if (encodedKey.isEmpty()) {
            try {
                encodedKey = Files.readString(keyFile, StandardCharsets.UTF_8).trim();
            } catch (IOException e) {
                throw new IllegalStateException(
                        "Skeleton encryption key is not configured. Set SKELETON_ENCRYPTION_KEY "
                                + "or create " + keyFile + ".", e);
            }
        }

        byte[] key;
        try {
            key = Base64.getDecoder().decode(encodedKey);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Skeleton encryption key is not valid Base64.", e);
        }

        if (key.length != 32) {
            Arrays.fill(key, (byte) 0);
            throw new IllegalStateException("Skeleton encryption key must be exactly 32 bytes.");
        }

        SecretKeySpec secretKey = new SecretKeySpec(key, "AES");
        Arrays.fill(key, (byte) 0);
        return secretKey;
    }

    private byte[] decrypt(byte[] encrypted, SecretKeySpec key) {
        int minimumLength = MAGIC.length + IV_LENGTH + (GCM_TAG_BITS / 8);
        if (encrypted.length < minimumLength
                || !Arrays.equals(MAGIC, Arrays.copyOfRange(encrypted, 0, MAGIC.length))) {
            throw new IllegalStateException("Invalid encrypted skeleton file format.");
        }

        byte[] iv = Arrays.copyOfRange(encrypted, MAGIC.length, MAGIC.length + IV_LENGTH);
        byte[] ciphertextAndTag = Arrays.copyOfRange(
                encrypted, MAGIC.length + IV_LENGTH, encrypted.length);

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            return cipher.doFinal(ciphertextAndTag);
        } catch (AEADBadTagException e) {
            throw new IllegalStateException(
                    "Skeleton data authentication failed. The key is wrong or the file was modified.", e);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to decrypt skeleton data.", e);
        } finally {
            Arrays.fill(iv, (byte) 0);
            Arrays.fill(ciphertextAndTag, (byte) 0);
        }
    }
}
