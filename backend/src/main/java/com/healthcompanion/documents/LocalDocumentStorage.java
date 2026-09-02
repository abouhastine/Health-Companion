package com.healthcompanion.documents;

import io.minio.*;
import java.io.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * MinIO-backed document store. The legacy class name is retained to avoid changing domain callers.
 */
@Service
public class LocalDocumentStorage {
  private final MinioClient minio;
  private final String bucket;

  public LocalDocumentStorage(
      @Value("${app.storage.minio.endpoint}") String endpoint,
      @Value("${app.storage.minio.access-key}") String key,
      @Value("${app.storage.minio.secret-key}") String secret,
      @Value("${app.storage.minio.bucket}") String bucket) {
    this.minio = MinioClient.builder().endpoint(endpoint).credentials(key, secret).build();
    this.bucket = bucket;
  }

  private void bucket() throws Exception {
    if (!minio.bucketExists(BucketExistsArgs.builder().bucket(bucket).build()))
      minio.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
  }

  public String save(MultipartFile file) throws IOException {
    var name = UUID.randomUUID() + ".pdf";
    try {
      bucket();
      minio.putObject(
          PutObjectArgs.builder().bucket(bucket).object(name).stream(
                  file.getInputStream(), file.getSize(), -1)
              .contentType(file.getContentType())
              .build());
      return name;
    } catch (Exception e) {
      throw new IOException("Unable to store document in MinIO", e);
    }
  }

  public Resource load(String name) throws IOException {
    try {
      bucket();
      try (var stream =
          minio.getObject(GetObjectArgs.builder().bucket(bucket).object(name).build())) {
        return new Resource(stream.readAllBytes());
      }
    } catch (Exception e) {
      throw new IOException("Unable to load document from MinIO", e);
    }
  }

  public void delete(String name) throws IOException {
    try {
      bucket();
      minio.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(name).build());
    } catch (Exception e) {
      throw new IOException("Unable to delete document from MinIO", e);
    }
  }

  public record Resource(byte[] bytes) {}
}
